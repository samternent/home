import { createHash } from "node:crypto";
import { canonicalStringify } from "@ternent/concord-protocol";
import { HttpError, conflict, notFound } from "../../services/http/errors.mjs";
import { sanitizePixbookSnapshotPayload } from "./snapshot-sanitizer.mjs";

function trim(value) {
  return String(value || "").trim();
}

function hashHex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function deriveCreateBookId(requestHash) {
  const normalized = trim(requestHash).toLowerCase();
  return `book_${normalized.slice(0, 24)}`;
}

function toRequestHash({
  method,
  routeTemplate,
  bookId,
  signingIdentityId,
  body,
}) {
  const canonical = canonicalStringify({
    method: trim(method).toUpperCase(),
    routeTemplate: trim(routeTemplate),
    bookId: trim(bookId) || null,
    signingIdentityId: trim(signingIdentityId) || null,
    body: body ?? {},
  });
  return hashHex(Buffer.from(canonical, "utf8"));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function retryAfterSeconds() {
  return parsePositiveInt(process.env.IDEMPOTENCY_RETRY_AFTER_SECONDS, 2);
}

function normalizeDetails(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}

function normalizeCreateBody(body) {
  return {
    managedUserId: trim(body?.managedUserId),
    name: trim(body?.name) || "My Pixbook",
    collectionId: trim(body?.collectionId) || "primary",
  };
}

function normalizeExpectedVersion(value) {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.trunc(numeric);
}

function normalizeSaveBody(body) {
  const snapshot = sanitizePixbookSnapshotPayload(body?.payload ?? {});
  if (!snapshot) {
    throw new HttpError(
      400,
      "PAYLOAD_LEDGER_REQUIRED",
      "payload must include a pixbook ledger snapshot."
    );
  }
  return {
    snapshot,
    clientLedgerHead: trim(body?.ledgerHead) || null,
    expectedVersion: normalizeExpectedVersion(body?.expectedVersion),
    expectedLedgerHead: trim(body?.expectedLedgerHead) || null,
  };
}

function toPendingResponse(idempotencyKey) {
  return {
    status: "in_progress",
    idempotencyKey: trim(idempotencyKey),
    retryAfterSeconds: retryAfterSeconds(),
  };
}

function isExpired(row) {
  const raw = row?.expiresAt;
  if (!raw) return false;
  const ts = new Date(raw).getTime();
  if (!Number.isFinite(ts)) return true;
  return ts <= Date.now();
}

function normalizeErrorPayload(error) {
  const code = trim(error?.code) || "COMMAND_FAILED";
  const message = String(error?.message || "Command failed.");
  const details = normalizeDetails(error?.details);
  const httpStatus = Number(error?.statusCode || 500);
  return {
    code,
    message,
    details,
    httpStatus: Number.isFinite(httpStatus) && httpStatus >= 100 ? httpStatus : 500,
  };
}

function throwStoredFailure(row) {
  const storedEnvelope = row?.responseBody && typeof row.responseBody === "object"
    ? row.responseBody
    : null;
  const storedError = storedEnvelope?.error && typeof storedEnvelope.error === "object"
    ? storedEnvelope.error
    : null;
  const fallbackErrorBody = row?.errorBody && typeof row.errorBody === "object"
    ? row.errorBody
    : null;
  const message =
    String(storedError?.message || "").trim() ||
    String(fallbackErrorBody?.message || "").trim() ||
    "Command failed previously.";
  throw new HttpError(
    Number(row?.httpStatus || 500),
    trim(storedError?.code) || trim(row?.errorCode) || "COMMAND_FAILED",
    message,
    normalizeDetails(storedError?.details ?? fallbackErrorBody?.details)
  );
}

function assertIdempotency(row, requestHash) {
  if (!row) return { mode: "create" };
  if (trim(row.requestHash) !== trim(requestHash)) {
    throw conflict(
      "IDEMPOTENCY_CONFLICT",
      "Idempotency key was already used with a different command payload."
    );
  }
  const status = trim(row.status);
  if (status === "succeeded") {
    return {
      mode: "replay_success",
      responseBody: cloneJson(row.responseBody),
      httpStatus: Number(row.httpStatus || 200),
    };
  }
  if (status === "failed") {
    return {
      mode: "replay_failed",
      row,
    };
  }
  if (status === "in_progress") {
    if (!isExpired(row)) {
      return {
        mode: "in_progress_active",
        responseBody: cloneJson(row.responseBody) || { status: "in_progress" },
        httpStatus: Number(row.httpStatus || 202) || 202,
      };
    }
    return {
      mode: "restart_expired",
    };
  }
  return {
    mode: "restart_expired",
  };
}

export function createPixbookCommandService({
  pixbookRepo,
  receiptRepo,
  receiptWriter,
  signingIdentityRepo,
  fallbackVaultKeyName = "pixbook-default",
}) {
  const CREATE_ROUTE_TEMPLATE = "POST /v1/pixbooks/commands/create";
  const SAVE_ROUTE_TEMPLATE = "POST /v1/pixbooks/{id}/commands/save";

  return {
    async createPixbook(ctx, input) {
      const userId = trim(ctx?.userId);
      const accountId = trim(input.accountId);
      const idempotencyKey = trim(input.idempotencyKey);
      const normalizedBody = normalizeCreateBody(input.body);
      const requestHash = toRequestHash({
        method: "POST",
        routeTemplate: CREATE_ROUTE_TEMPLATE,
        bookId: null,
        signingIdentityId: input.signingIdentityId,
        body: normalizedBody,
      });
      const bookId = deriveCreateBookId(requestHash);
      let resolvedBook = await pixbookRepo.getBookForAccount(userId, accountId, bookId);
      if (!resolvedBook) {
        resolvedBook = await pixbookRepo.createBookForManagedUser({
          id: bookId,
          userId,
          accountId,
          managedUserId: normalizedBody.managedUserId,
          name: normalizedBody.name,
          collectionId: normalizedBody.collectionId,
        });
      }
      if (!resolvedBook) {
        throw notFound("BOOK_CREATE_FAILED", "Unable to create pixbook.");
      }

      return receiptRepo.withCommandTransaction(
        { accountId, bookId },
        async (tx) => {
          const idempotency = await receiptRepo.getIdempotencyForUpdate(tx, {
            accountId,
            routeTemplate: CREATE_ROUTE_TEMPLATE,
            bookId,
            idempotencyKey,
          });
          const gate = assertIdempotency(idempotency, requestHash);
          if (gate.mode === "replay_success") {
            return {
              httpStatus: gate.httpStatus,
              data: gate.responseBody,
            };
          }
          if (gate.mode === "replay_failed") {
            throwStoredFailure(gate.row);
          }
          if (gate.mode === "in_progress_active") {
            return {
              httpStatus: 202,
              data: toPendingResponse(idempotencyKey),
            };
          }
          if (gate.mode === "create") {
            await receiptRepo.createIdempotencyInProgress(tx, {
              accountId,
              routeTemplate: CREATE_ROUTE_TEMPLATE,
              bookId,
              idempotencyKey,
              requestHash,
              responseBody: toPendingResponse(idempotencyKey),
            });
          }
          if (gate.mode === "restart_expired") {
            await receiptRepo.restartIdempotencyInProgress(tx, {
              accountId,
              routeTemplate: CREATE_ROUTE_TEMPLATE,
              bookId,
              idempotencyKey,
              requestHash,
              responseBody: toPendingResponse(idempotencyKey),
            });
          }

          try {
            const signingIdentity = await signingIdentityRepo.resolveForCommand({
              accountId,
              requestedSigningIdentityId: input.signingIdentityId,
              signer: ctx.signer,
              fallbackVaultKeyName:
                trim(process.env.PIXBOOK_VAULT_KEY_NAME) || fallbackVaultKeyName,
            });

            const appended = await receiptWriter.appendPixbookReceipt({
              tx,
              accountId,
              bookId,
              eventType: "PIXBOOK_CREATED",
              payload: {
                managedUserId: normalizedBody.managedUserId,
                name: normalizedBody.name,
                collectionId: normalizedBody.collectionId,
              },
              idempotencyKey,
              signingIdentity,
            });

            const responseData = {
              eventId: appended.eventId,
              bookId,
              streamVersion: appended.streamVersion,
              hash: appended.hash,
              createdAt: appended.createdAt,
            };
            await receiptRepo.completeIdempotency(tx, {
              accountId,
              routeTemplate: CREATE_ROUTE_TEMPLATE,
              bookId,
              idempotencyKey,
              requestHash,
              httpStatus: 200,
              responseBody: responseData,
              eventId: appended.eventId,
            });

            return {
              httpStatus: 200,
              data: responseData,
            };
          } catch (error) {
            const normalized = normalizeErrorPayload(error);
            await receiptRepo.failIdempotency(tx, {
              accountId,
              routeTemplate: CREATE_ROUTE_TEMPLATE,
              bookId,
              idempotencyKey,
              requestHash,
              httpStatus: normalized.httpStatus,
              errorCode: normalized.code,
              errorBody: {
                message: normalized.message,
                details: normalized.details,
              },
              responseBody: {
                ok: false,
                error: {
                  code: normalized.code,
                  message: normalized.message,
                  details: normalizeDetails(normalized.details),
                },
              },
            });
            throw new HttpError(
              normalized.httpStatus,
              normalized.code,
              normalized.message,
              normalizeDetails(normalized.details)
            );
          }
        }
      );
    },

    async savePixbook(ctx, input) {
      const userId = trim(ctx?.userId);
      const accountId = trim(input.accountId);
      const bookId = trim(input.bookId);
      const idempotencyKey = trim(input.idempotencyKey);
      const normalizedBody = normalizeSaveBody(input.body);
      const requestHash = toRequestHash({
        method: "POST",
        routeTemplate: SAVE_ROUTE_TEMPLATE,
        bookId,
        signingIdentityId: input.signingIdentityId,
        body: normalizedBody,
      });

      return receiptRepo.withCommandTransaction(
        { accountId, bookId },
        async (tx) => {
          const idempotency = await receiptRepo.getIdempotencyForUpdate(tx, {
            accountId,
            routeTemplate: SAVE_ROUTE_TEMPLATE,
            bookId,
            idempotencyKey,
          });
          const gate = assertIdempotency(idempotency, requestHash);
          if (gate.mode === "replay_success") {
            return {
              httpStatus: gate.httpStatus,
              data: gate.responseBody,
            };
          }
          if (gate.mode === "replay_failed") {
            throwStoredFailure(gate.row);
          }
          if (gate.mode === "in_progress_active") {
            return {
              httpStatus: 202,
              data: toPendingResponse(idempotencyKey),
            };
          }
          if (gate.mode === "create") {
            await receiptRepo.createIdempotencyInProgress(tx, {
              accountId,
              routeTemplate: SAVE_ROUTE_TEMPLATE,
              bookId,
              idempotencyKey,
              requestHash,
              responseBody: toPendingResponse(idempotencyKey),
            });
          }
          if (gate.mode === "restart_expired") {
            await receiptRepo.restartIdempotencyInProgress(tx, {
              accountId,
              routeTemplate: SAVE_ROUTE_TEMPLATE,
              bookId,
              idempotencyKey,
              requestHash,
              responseBody: toPendingResponse(idempotencyKey),
            });
          }

          try {
            const resolved = await pixbookRepo.getBookForAccount(userId, accountId, bookId);
            if (!resolved?.book?.id) {
              throw notFound("BOOK_NOT_FOUND", "Pixbook not found.");
            }

            const currentHead = await receiptRepo.getLedgerHead(tx, { accountId, bookId });
            if (
              normalizedBody.expectedLedgerHead !== null &&
              normalizedBody.expectedLedgerHead !== trim(currentHead.lastHash)
            ) {
              throw conflict(
                "BOOK_SNAPSHOT_CONFLICT",
                "Pixbook ledger head conflict. Another device saved a different state.",
                {
                  expectedLedgerHead: normalizedBody.expectedLedgerHead,
                  currentLedgerHead: trim(currentHead.lastHash),
                }
              );
            }
            if (
              normalizedBody.expectedLedgerHead === null &&
              normalizedBody.expectedVersion !== null &&
              normalizedBody.expectedVersion !== Number(currentHead.streamVersion || 0)
            ) {
              throw conflict(
                "BOOK_SNAPSHOT_CONFLICT",
                "Pixbook has changed since you last synced.",
                {
                  expectedVersion: normalizedBody.expectedVersion,
                  currentVersion: Number(currentHead.streamVersion || 0),
                }
              );
            }

            const signingIdentity = await signingIdentityRepo.resolveForCommand({
              accountId,
              requestedSigningIdentityId: input.signingIdentityId,
              signer: ctx.signer,
              fallbackVaultKeyName:
                trim(process.env.PIXBOOK_VAULT_KEY_NAME) || fallbackVaultKeyName,
            });

            const appended = await receiptWriter.appendPixbookReceipt({
              tx,
              accountId,
              bookId,
              eventType: "PIXBOOK_SAVE",
              payload: {
                snapshot: normalizedBody.snapshot,
                clientLedgerHead: normalizedBody.clientLedgerHead,
              },
              idempotencyKey,
              signingIdentity,
              expectedPrevHash:
                normalizedBody.expectedLedgerHead !== null
                  ? normalizedBody.expectedLedgerHead
                  : null,
            });

            const responseData = {
              eventId: appended.eventId,
              bookId,
              streamVersion: appended.streamVersion,
              hash: appended.hash,
              prevHash: appended.prevHash,
              createdAt: appended.createdAt,
            };
            await receiptRepo.completeIdempotency(tx, {
              accountId,
              routeTemplate: SAVE_ROUTE_TEMPLATE,
              bookId,
              idempotencyKey,
              requestHash,
              httpStatus: 200,
              responseBody: responseData,
              eventId: appended.eventId,
            });

            return {
              httpStatus: 200,
              data: responseData,
            };
          } catch (error) {
            const normalized = normalizeErrorPayload(error);
            await receiptRepo.failIdempotency(tx, {
              accountId,
              routeTemplate: SAVE_ROUTE_TEMPLATE,
              bookId,
              idempotencyKey,
              requestHash,
              httpStatus: normalized.httpStatus,
              errorCode: normalized.code,
              errorBody: {
                message: normalized.message,
                details: normalized.details,
              },
              responseBody: {
                ok: false,
                error: {
                  code: normalized.code,
                  message: normalized.message,
                  details: normalizeDetails(normalized.details),
                },
              },
            });
            throw new HttpError(
              normalized.httpStatus,
              normalized.code,
              normalized.message,
              normalizeDetails(normalized.details)
            );
          }
        }
      );
    },
  };
}

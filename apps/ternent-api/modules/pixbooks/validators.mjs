import { badRequest } from "../../services/http/errors.mjs";

function trim(value) {
  return String(value || "").trim();
}

export function parsePixbookListQuery(req) {
  const accountId =
    trim(req?.headers?.["x-account-id"]) ||
    trim(req?.query?.accountId) ||
    trim(req?.query?.workspaceId) ||
    trim(req?.headers?.["x-workspace-id"]);
  if (!accountId) {
    throw badRequest("ACCOUNT_ID_REQUIRED", "accountId is required.");
  }
  return { accountId };
}

export function parseGetPixbookParams(req) {
  const accountId =
    trim(req?.headers?.["x-account-id"]) ||
    trim(req?.query?.accountId) ||
    trim(req?.query?.workspaceId) ||
    trim(req?.headers?.["x-workspace-id"]);
  const bookId = trim(req?.params?.id);
  if (!accountId) {
    throw badRequest("ACCOUNT_ID_REQUIRED", "accountId is required.");
  }
  if (!bookId) {
    throw badRequest("BOOK_ID_REQUIRED", "book id is required.");
  }
  return { accountId, bookId };
}

export function parseListReceiptsQuery(req) {
  const { accountId, bookId } = parseGetPixbookParams(req);
  const after = trim(req?.query?.after);
  const limitRaw = Number(req?.query?.limit);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Math.floor(limitRaw))) : 100;
  return { accountId, bookId, after, limit };
}

function assertObject(value, code, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest(code, message);
  }
}

function hasLedgerShape(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value;
  if (payload.ledger && typeof payload.ledger === "object" && !Array.isArray(payload.ledger)) {
    return true;
  }
  if (payload.format === "concord-ledger") return true;
  if (
    payload.commits &&
    typeof payload.commits === "object" &&
    !Array.isArray(payload.commits)
  ) {
    return true;
  }
  if (
    payload.entries &&
    typeof payload.entries === "object" &&
    !Array.isArray(payload.entries)
  ) {
    return true;
  }
  return false;
}

export function parseCreateCommand(req) {
  const accountId =
    trim(req?.headers?.["x-account-id"]) ||
    trim(req?.body?.accountId) ||
    trim(req?.query?.accountId) ||
    trim(req?.query?.workspaceId);
  if (!accountId) {
    throw badRequest("ACCOUNT_ID_REQUIRED", "accountId is required.");
  }
  const idempotencyKey = trim(req?.headers?.["idempotency-key"]);
  if (!idempotencyKey) {
    throw badRequest("IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header is required.");
  }

  assertObject(req?.body, "COMMAND_BODY_INVALID", "command body must be a JSON object.");
  const managedUserId = trim(req.body?.managedUserId);
  if (!managedUserId) {
    throw badRequest("MANAGED_USER_REQUIRED", "managedUserId is required.");
  }
  const name = trim(req.body?.name) || "My Pixbook";
  const collectionId = trim(req.body?.collectionId) || "primary";
  const signingIdentityId = trim(req?.headers?.["x-signing-identity-id"]);
  return {
    accountId,
    idempotencyKey,
    signingIdentityId,
    body: { managedUserId, name, collectionId },
  };
}

export function parseSaveCommand(req) {
  const accountId =
    trim(req?.headers?.["x-account-id"]) ||
    trim(req?.body?.accountId) ||
    trim(req?.query?.accountId) ||
    trim(req?.query?.workspaceId);
  const bookId = trim(req?.params?.id);
  if (!accountId) {
    throw badRequest("ACCOUNT_ID_REQUIRED", "accountId is required.");
  }
  if (!bookId) {
    throw badRequest("BOOK_ID_REQUIRED", "book id is required.");
  }
  const idempotencyKey = trim(req?.headers?.["idempotency-key"]);
  if (!idempotencyKey) {
    throw badRequest("IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header is required.");
  }

  assertObject(req?.body, "COMMAND_BODY_INVALID", "command body must be a JSON object.");
  if (req.body?.payload == null || typeof req.body?.payload !== "object" || Array.isArray(req.body?.payload)) {
    throw badRequest("PAYLOAD_REQUIRED", "payload object is required.");
  }
  if (!hasLedgerShape(req.body.payload)) {
    throw badRequest(
      "PAYLOAD_LEDGER_REQUIRED",
      "payload must include a pixbook ledger snapshot."
    );
  }
  const signingIdentityId = trim(req?.headers?.["x-signing-identity-id"]);
  return {
    accountId,
    bookId,
    idempotencyKey,
    signingIdentityId,
    body: {
      payload: req.body.payload,
      ledgerHead: trim(req.body?.ledgerHead) || null,
      expectedVersion:
        req.body?.expectedVersion === null || req.body?.expectedVersion === undefined
          ? null
          : Number(req.body.expectedVersion),
      expectedLedgerHead:
        req.body?.expectedLedgerHead === null || req.body?.expectedLedgerHead === undefined
          ? null
          : trim(req.body.expectedLedgerHead),
    },
  };
}

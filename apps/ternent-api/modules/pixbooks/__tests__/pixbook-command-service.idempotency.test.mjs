import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { canonicalStringify } from "@ternent/concord-protocol";
import { createPixbookCommandService } from "../pixbook-command-service.mjs";
import { conflict } from "../../../services/http/errors.mjs";

function trim(value) {
  return String(value || "").trim();
}

function hashRequest({
  routeTemplate,
  bookId,
  signingIdentityId,
  body,
}) {
  const canonical = canonicalStringify({
    method: "POST",
    routeTemplate,
    bookId: trim(bookId) || null,
    signingIdentityId: trim(signingIdentityId) || null,
    body: body ?? {},
  });
  return createHash("sha256").update(Buffer.from(canonical, "utf8")).digest("hex");
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function makeIdempotencyRepo({ initialRows = [] } = {}) {
  const rows = new Map();
  for (const row of initialRows) {
    const key = `${row.accountId}|${row.routeTemplate}|${row.bookId}|${row.idempotencyKey}`;
    rows.set(key, cloneJson(row));
  }

  const calls = {
    create: 0,
    restart: 0,
    complete: 0,
    fail: 0,
  };

  function getKey({
    accountId,
    routeTemplate,
    bookId,
    idempotencyKey,
  }) {
    return `${trim(accountId)}|${trim(routeTemplate)}|${trim(bookId)}|${trim(idempotencyKey)}`;
  }

  return {
    calls,
    rows,
    async withCommandTransaction(_scope, fn) {
      return fn({});
    },
    async getIdempotencyForUpdate(_tx, params) {
      return cloneJson(rows.get(getKey(params)) || null);
    },
    async createIdempotencyInProgress(_tx, params) {
      calls.create += 1;
      rows.set(getKey(params), {
        accountId: trim(params.accountId),
        routeTemplate: trim(params.routeTemplate),
        bookId: trim(params.bookId),
        idempotencyKey: trim(params.idempotencyKey),
        requestHash: trim(params.requestHash),
        status: "in_progress",
        httpStatus: 202,
        responseBody: cloneJson(params.responseBody || { status: "in_progress" }),
        errorCode: "",
        errorBody: null,
        eventId: "",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      });
    },
    async restartIdempotencyInProgress(_tx, params) {
      calls.restart += 1;
      rows.set(getKey(params), {
        accountId: trim(params.accountId),
        routeTemplate: trim(params.routeTemplate),
        bookId: trim(params.bookId),
        idempotencyKey: trim(params.idempotencyKey),
        requestHash: trim(params.requestHash),
        status: "in_progress",
        httpStatus: 202,
        responseBody: cloneJson(params.responseBody || { status: "in_progress" }),
        errorCode: "",
        errorBody: null,
        eventId: "",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      });
    },
    async completeIdempotency(_tx, params) {
      calls.complete += 1;
      rows.set(getKey(params), {
        accountId: trim(params.accountId),
        routeTemplate: trim(params.routeTemplate),
        bookId: trim(params.bookId),
        idempotencyKey: trim(params.idempotencyKey),
        requestHash: trim(params.requestHash),
        status: "succeeded",
        httpStatus: Number(params.httpStatus || 200),
        responseBody: cloneJson(params.responseBody || null),
        errorCode: "",
        errorBody: null,
        eventId: trim(params.eventId),
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    },
    async failIdempotency(_tx, params) {
      calls.fail += 1;
      rows.set(getKey(params), {
        accountId: trim(params.accountId),
        routeTemplate: trim(params.routeTemplate),
        bookId: trim(params.bookId),
        idempotencyKey: trim(params.idempotencyKey),
        requestHash: trim(params.requestHash),
        status: "failed",
        httpStatus: Number(params.httpStatus || 500),
        responseBody: cloneJson(params.responseBody || null),
        errorCode: trim(params.errorCode),
        errorBody: cloneJson(params.errorBody || null),
        eventId: "",
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      });
    },
    async getLedgerHead() {
      return {
        accountId: "ws_123",
        bookId: "book_abc",
        lastEventId: "",
        lastHash: "",
        streamVersion: 0,
      };
    },
  };
}

function makeService({ receiptRepo, receiptWriter }) {
  return createPixbookCommandService({
    pixbookRepo: {
      async getBookForAccount() {
        return { book: { id: "book_abc" } };
      },
    },
    receiptRepo,
    receiptWriter,
    signingIdentityRepo: {
      async resolveForCommand() {
        return {
          id: "signing_abc",
          vaultKeyName: "pixbook-default",
          publicKeyId: "pk_abc",
        };
      },
    },
    fallbackVaultKeyName: "pixbook-default",
  });
}

function saveInput() {
  return {
    accountId: "ws_123",
    bookId: "book_abc",
    idempotencyKey: "83d1f495-4f20-4b85-9fc2-c9f0ba7aef3e",
    signingIdentityId: "signing_abc",
    body: {
      payload: {
        cards: ["a", "b", "c"],
      },
      ledgerHead: null,
      expectedVersion: null,
      expectedLedgerHead: null,
    },
  };
}

function ctx() {
  return {
    userId: "usr_123",
    signer: {},
  };
}

test("expired in_progress idempotency row is restarted and succeeds with one append", async () => {
  const input = saveInput();
  const routeTemplate = "POST /v1/pixbooks/{id}/commands/save";
  const requestHash = hashRequest({
    routeTemplate,
    bookId: input.bookId,
    signingIdentityId: input.signingIdentityId,
    body: {
      snapshot: input.body.payload,
      clientLedgerHead: input.body.ledgerHead,
      expectedVersion: input.body.expectedVersion,
      expectedLedgerHead: input.body.expectedLedgerHead,
    },
  });

  const receiptRepo = makeIdempotencyRepo({
    initialRows: [
      {
        accountId: input.accountId,
        routeTemplate,
        bookId: input.bookId,
        idempotencyKey: input.idempotencyKey,
        requestHash,
        status: "in_progress",
        httpStatus: 202,
        responseBody: { status: "in_progress" },
        errorCode: "",
        errorBody: null,
        eventId: "",
        expiresAt: new Date(Date.now() - 10_000).toISOString(),
      },
    ],
  });

  let appendCalls = 0;
  const service = makeService({
    receiptRepo,
    receiptWriter: {
      async appendPixbookReceipt() {
        appendCalls += 1;
        return {
          eventId: "evt_recovered",
          streamVersion: 1,
          prevHash: null,
          hash: "sha256:recovered",
          spacesKey: "pixpax/pixbooks/ws_123/book_abc/events/evt_recovered.json",
          createdAt: "2026-02-24T00:00:00.000Z",
        };
      },
    },
  });

  const result = await service.savePixbook(ctx(), input);
  assert.equal(result.httpStatus, 200);
  assert.equal(result.data.eventId, "evt_recovered");
  assert.equal(appendCalls, 1);
  assert.equal(receiptRepo.calls.restart, 1);
  assert.equal(receiptRepo.calls.complete, 1);

  const replay = await service.savePixbook(ctx(), input);
  assert.equal(replay.httpStatus, 200);
  assert.equal(replay.data.eventId, "evt_recovered");
  assert.equal(appendCalls, 1);
});

test("in_progress row with missing expiresAt is treated as active and returns stable pending response", async () => {
  const input = saveInput();
  const routeTemplate = "POST /v1/pixbooks/{id}/commands/save";
  const requestHash = hashRequest({
    routeTemplate,
    bookId: input.bookId,
    signingIdentityId: input.signingIdentityId,
    body: {
      snapshot: input.body.payload,
      clientLedgerHead: input.body.ledgerHead,
      expectedVersion: input.body.expectedVersion,
      expectedLedgerHead: input.body.expectedLedgerHead,
    },
  });

  const receiptRepo = makeIdempotencyRepo({
    initialRows: [
      {
        accountId: input.accountId,
        routeTemplate,
        bookId: input.bookId,
        idempotencyKey: input.idempotencyKey,
        requestHash,
        status: "in_progress",
        httpStatus: 202,
        responseBody: { status: "in_progress" },
        errorCode: "",
        errorBody: null,
        eventId: "",
        expiresAt: null,
      },
    ],
  });

  let appendCalls = 0;
  const service = makeService({
    receiptRepo,
    receiptWriter: {
      async appendPixbookReceipt() {
        appendCalls += 1;
        return {
          eventId: "evt_unexpected",
          streamVersion: 1,
          prevHash: null,
          hash: "sha256:unexpected",
          spacesKey: "pixpax/pixbooks/ws_123/book_abc/events/evt_unexpected.json",
          createdAt: "2026-02-24T00:00:00.000Z",
        };
      },
    },
  });

  const result = await service.savePixbook(ctx(), input);
  assert.equal(result.httpStatus, 202);
  assert.deepEqual(result.data, {
    status: "in_progress",
    idempotencyKey: input.idempotencyKey,
    retryAfterSeconds: 2,
  });
  assert.equal(appendCalls, 0);
  assert.equal(receiptRepo.calls.restart, 0);
});

test("concurrent identical save commands return in_progress for one request, then replay success on retry", async () => {
  const input = saveInput();
  const receiptRepo = makeIdempotencyRepo();

  let appendCalls = 0;
  let releaseFirstAppend;
  const firstAppendStarted = new Promise((resolve) => {
    releaseFirstAppend = resolve;
  });
  let unblockFirstAppend;
  const firstAppendGate = new Promise((resolve) => {
    unblockFirstAppend = resolve;
  });

  const service = makeService({
    receiptRepo,
    receiptWriter: {
      async appendPixbookReceipt() {
        appendCalls += 1;
        if (appendCalls === 1) {
          releaseFirstAppend();
          await firstAppendGate;
        }
        return {
          eventId: "evt_concurrent",
          streamVersion: 1,
          prevHash: null,
          hash: "sha256:concurrent",
          spacesKey: "pixpax/pixbooks/ws_123/book_abc/events/evt_concurrent.json",
          createdAt: "2026-02-24T00:00:00.000Z",
        };
      },
    },
  });

  const firstPromise = service.savePixbook(ctx(), input);
  await firstAppendStarted;

  const second = await service.savePixbook(ctx(), input);
  assert.equal(second.httpStatus, 202);
  assert.deepEqual(second.data, {
    status: "in_progress",
    idempotencyKey: input.idempotencyKey,
    retryAfterSeconds: 2,
  });

  unblockFirstAppend();
  const first = await firstPromise;
  assert.equal(first.httpStatus, 200);
  assert.equal(first.data.eventId, "evt_concurrent");
  assert.equal(appendCalls, 1);

  const replay = await service.savePixbook(ctx(), input);
  assert.equal(replay.httpStatus, 200);
  assert.equal(replay.data.eventId, "evt_concurrent");
  assert.equal(appendCalls, 1);
});

test("failed command replay returns identical failure payload fields", async () => {
  const input = saveInput();
  const receiptRepo = makeIdempotencyRepo();
  let appendCalls = 0;

  const service = makeService({
    receiptRepo,
    receiptWriter: {
      async appendPixbookReceipt() {
        appendCalls += 1;
        throw conflict(
          "STREAM_HEAD_CONFLICT",
          "Pixbook stream head changed before this write completed.",
          {
            expectedPrevHash: "sha256:expected",
            currentPrevHash: "sha256:actual",
          }
        );
      },
    },
  });

  let firstError = null;
  await assert.rejects(
    async () => {
      await service.savePixbook(ctx(), input);
    },
    (error) => {
      firstError = error;
      assert.equal(error.statusCode, 409);
      assert.equal(error.code, "STREAM_HEAD_CONFLICT");
      return true;
    }
  );

  await assert.rejects(
    async () => {
      await service.savePixbook(ctx(), input);
    },
    (error) => {
      assert.equal(error.statusCode, firstError.statusCode);
      assert.equal(error.code, firstError.code);
      assert.equal(error.message, firstError.message);
      assert.deepEqual(error.details, firstError.details);
      return true;
    }
  );

  assert.equal(appendCalls, 1);
});

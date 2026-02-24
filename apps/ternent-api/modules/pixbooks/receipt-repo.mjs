import { dbQuery, dbTx } from "../../services/platform-db/index.mjs";

function trim(value) {
  return String(value || "").trim();
}

function toJson(value) {
  if (value == null) return null;
  return JSON.stringify(value);
}

function fromJson(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

function mapIdempotencyRow(row) {
  if (!row) return null;
  return {
    accountId: trim(row.account_id),
    routeTemplate: trim(row.route_template),
    bookId: trim(row.book_id),
    idempotencyKey: trim(row.idempotency_key),
    requestHash: trim(row.request_hash),
    status: trim(row.status),
    httpStatus: Number(row.http_status || 200),
    responseBody: fromJson(row.response_body),
    errorCode: trim(row.error_code),
    errorBody: fromJson(row.error_body),
    eventId: trim(row.event_id),
    expiresAt: row.expires_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function inProgressTtlSeconds() {
  return parsePositiveInt(process.env.IDEMPOTENCY_IN_PROGRESS_TTL_SECONDS, 120);
}

function successTtlSeconds() {
  return parsePositiveInt(process.env.IDEMPOTENCY_SUCCESS_TTL_SECONDS, 7 * 24 * 60 * 60);
}

function failureTtlSeconds() {
  return parsePositiveInt(process.env.IDEMPOTENCY_FAILURE_TTL_SECONDS, 24 * 60 * 60);
}

export function createReceiptRepo() {
  return {
    async withCommandTransaction({ accountId, bookId }, fn) {
      const normalizedAccountId = trim(accountId);
      const normalizedBookId = trim(bookId);
      const lockKey = `${normalizedAccountId}:${normalizedBookId}`;
      return dbTx(async (client) => {
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
          [lockKey]
        );
        return fn(client);
      });
    },

    async getIdempotencyForUpdate(client, {
      accountId,
      routeTemplate,
      bookId,
      idempotencyKey,
    }) {
      const result = await client.query(
        `
        SELECT account_id, route_template, book_id, idempotency_key, request_hash, status, http_status, response_body, error_code, error_body, event_id, expires_at, created_at, updated_at
        FROM command_idempotency
        WHERE account_id = $1
          AND route_template = $2
          AND book_id = $3
          AND idempotency_key = $4
        FOR UPDATE
        `,
        [trim(accountId), trim(routeTemplate), trim(bookId), trim(idempotencyKey)]
      );
      return mapIdempotencyRow(result.rows[0]);
    },

    async createIdempotencyInProgress(client, {
      accountId,
      routeTemplate,
      bookId,
      idempotencyKey,
      requestHash,
      responseBody = { status: "in_progress" },
    }) {
      await client.query(
        `
        INSERT INTO command_idempotency
          (account_id, route_template, book_id, idempotency_key, request_hash, status, http_status, response_body, error_code, error_body, event_id, expires_at, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, 'in_progress', 202, $6::jsonb, NULL, NULL, NULL, NOW() + ($7 * INTERVAL '1 second'), NOW(), NOW())
        `,
        [
          trim(accountId),
          trim(routeTemplate),
          trim(bookId),
          trim(idempotencyKey),
          trim(requestHash),
          toJson(responseBody),
          inProgressTtlSeconds(),
        ]
      );
    },

    async restartIdempotencyInProgress(client, {
      accountId,
      routeTemplate,
      bookId,
      idempotencyKey,
      requestHash,
      responseBody = { status: "in_progress" },
    }) {
      await client.query(
        `
        UPDATE command_idempotency
        SET
          request_hash = $5,
          status = 'in_progress',
          http_status = 202,
          response_body = $6::jsonb,
          error_code = NULL,
          error_body = NULL,
          event_id = NULL,
          expires_at = NOW() + ($7 * INTERVAL '1 second'),
          updated_at = NOW()
        WHERE account_id = $1
          AND route_template = $2
          AND book_id = $3
          AND idempotency_key = $4
        `,
        [
          trim(accountId),
          trim(routeTemplate),
          trim(bookId),
          trim(idempotencyKey),
          trim(requestHash),
          toJson(responseBody),
          inProgressTtlSeconds(),
        ]
      );
    },

    async completeIdempotency(client, {
      accountId,
      routeTemplate,
      bookId,
      idempotencyKey,
      requestHash,
      httpStatus,
      responseBody,
      eventId,
    }) {
      await client.query(
        `
        UPDATE command_idempotency
        SET
          request_hash = $5,
          status = 'succeeded',
          http_status = $6,
          response_body = $7::jsonb,
          error_code = NULL,
          error_body = NULL,
          event_id = $8,
          expires_at = NOW() + ($9 * INTERVAL '1 second'),
          updated_at = NOW()
        WHERE account_id = $1
          AND route_template = $2
          AND book_id = $3
          AND idempotency_key = $4
        `,
        [
          trim(accountId),
          trim(routeTemplate),
          trim(bookId),
          trim(idempotencyKey),
          trim(requestHash),
          Number(httpStatus || 200),
          toJson(responseBody),
          trim(eventId) || null,
          successTtlSeconds(),
        ]
      );
    },

    async failIdempotency(client, {
      accountId,
      routeTemplate,
      bookId,
      idempotencyKey,
      requestHash,
      httpStatus,
      errorCode,
      errorBody,
      responseBody,
    }) {
      await client.query(
        `
        UPDATE command_idempotency
        SET
          request_hash = $5,
          status = 'failed',
          http_status = $6,
          response_body = $7::jsonb,
          error_code = $8,
          error_body = $9::jsonb,
          expires_at = NOW() + ($10 * INTERVAL '1 second'),
          updated_at = NOW()
        WHERE account_id = $1
          AND route_template = $2
          AND book_id = $3
          AND idempotency_key = $4
        `,
        [
          trim(accountId),
          trim(routeTemplate),
          trim(bookId),
          trim(idempotencyKey),
          trim(requestHash),
          Number(httpStatus || 500),
          toJson(responseBody),
          trim(errorCode) || "COMMAND_FAILED",
          toJson(errorBody || {}),
          failureTtlSeconds(),
        ]
      );
    },

    async getLedgerHead(client, { accountId, bookId }) {
      const result = await client.query(
        `
        SELECT account_id, book_id, last_event_id, last_hash, stream_version, updated_at
        FROM pixbook_ledger_heads
        WHERE account_id = $1
          AND book_id = $2
        FOR UPDATE
        `,
        [trim(accountId), trim(bookId)]
      );
      const row = result.rows[0];
      if (!row) {
        return {
          accountId: trim(accountId),
          bookId: trim(bookId),
          lastEventId: "",
          lastHash: "",
          streamVersion: 0,
          updatedAt: null,
        };
      }
      return {
        accountId: trim(row.account_id),
        bookId: trim(row.book_id),
        lastEventId: trim(row.last_event_id),
        lastHash: trim(row.last_hash),
        streamVersion: Number(row.stream_version || 0),
        updatedAt: row.updated_at || null,
      };
    },

    async upsertLedgerHead(client, {
      accountId,
      bookId,
      lastEventId,
      lastHash,
      streamVersion,
    }) {
      await client.query(
        `
        INSERT INTO pixbook_ledger_heads
          (account_id, book_id, last_event_id, last_hash, stream_version, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (account_id, book_id)
        DO UPDATE SET
          last_event_id = EXCLUDED.last_event_id,
          last_hash = EXCLUDED.last_hash,
          stream_version = EXCLUDED.stream_version,
          updated_at = NOW()
        `,
        [
          trim(accountId),
          trim(bookId),
          trim(lastEventId) || null,
          trim(lastHash) || null,
          Number(streamVersion || 0),
        ]
      );
    },

    async insertReceiptIndex(client, {
      accountId,
      bookId,
      eventId,
      streamVersion,
      eventType,
      createdAt,
      prevHash,
      hash,
      spacesKey,
      signingIdentityId,
      idempotencyKey,
    }) {
      await client.query(
        `
        INSERT INTO pixbook_receipt_index
          (account_id, book_id, event_id, stream_version, event_type, created_at, prev_hash, hash, spaces_key, signing_identity_id, idempotency_key)
        VALUES
          ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9, $10, $11)
        `,
        [
          trim(accountId),
          trim(bookId),
          trim(eventId),
          Number(streamVersion || 0),
          trim(eventType),
          createdAt,
          trim(prevHash) || null,
          trim(hash),
          trim(spacesKey),
          trim(signingIdentityId),
          trim(idempotencyKey),
        ]
      );
    },

    async listReceipts({ accountId, bookId, afterEventId, limit }) {
      const normalizedLimit = Number.isFinite(Number(limit))
        ? Math.max(1, Math.min(500, Math.floor(Number(limit))))
        : 100;
      let streamVersionCursor = -1;
      const after = trim(afterEventId);
      if (after) {
        const cursorRow = await dbQuery(
          `
          SELECT stream_version
          FROM pixbook_receipt_index
          WHERE account_id = $1
            AND book_id = $2
            AND event_id = $3
          LIMIT 1
          `,
          [trim(accountId), trim(bookId), after]
        );
        streamVersionCursor = Number(cursorRow.rows?.[0]?.stream_version || -1);
      }

      const rows = await dbQuery(
        `
        SELECT account_id, book_id, event_id, stream_version, event_type, created_at, prev_hash, hash, spaces_key, signing_identity_id, idempotency_key
        FROM pixbook_receipt_index
        WHERE account_id = $1
          AND book_id = $2
          AND stream_version > $3
        ORDER BY stream_version ASC
        LIMIT $4
        `,
        [trim(accountId), trim(bookId), streamVersionCursor, normalizedLimit]
      );
      return rows.rows.map((row) => ({
        accountId: trim(row.account_id),
        bookId: trim(row.book_id),
        eventId: trim(row.event_id),
        streamVersion: Number(row.stream_version || 0),
        eventType: trim(row.event_type),
        createdAt: row.created_at || null,
        prevHash: trim(row.prev_hash),
        hash: trim(row.hash),
        spacesKey: trim(row.spaces_key),
        signingIdentityId: trim(row.signing_identity_id),
        idempotencyKey: trim(row.idempotency_key),
      }));
    },

    async getLatestIndexedReceipt({ accountId, bookId }) {
      const result = await dbQuery(
        `
        SELECT account_id, book_id, event_id, stream_version, event_type, created_at, prev_hash, hash, spaces_key, signing_identity_id, idempotency_key
        FROM pixbook_receipt_index
        WHERE account_id = $1
          AND book_id = $2
        ORDER BY stream_version DESC
        LIMIT 1
        `,
        [trim(accountId), trim(bookId)]
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        accountId: trim(row.account_id),
        bookId: trim(row.book_id),
        eventId: trim(row.event_id),
        streamVersion: Number(row.stream_version || 0),
        eventType: trim(row.event_type),
        createdAt: row.created_at || null,
        prevHash: trim(row.prev_hash),
        hash: trim(row.hash),
        spacesKey: trim(row.spaces_key),
        signingIdentityId: trim(row.signing_identity_id),
        idempotencyKey: trim(row.idempotency_key),
      };
    },
  };
}

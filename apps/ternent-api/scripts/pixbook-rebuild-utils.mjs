import { createHash, webcrypto } from "node:crypto";
import { canonicalStringify } from "@ternent/concord-protocol";
import { dbQuery, dbTx } from "../services/platform-db/index.mjs";
import { createSpacesReceiptStore } from "../modules/pixbooks/spaces-receipt-store.mjs";

function trim(value) {
  return String(value || "").trim();
}

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizePublicPem(pem) {
  const normalized = String(pem || "").trim();
  if (!normalized) return "";
  return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}

function pemToDer(pem) {
  const stripped = normalizePublicPem(pem)
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replaceAll("\n", "");
  return Buffer.from(stripped, "base64");
}

async function verifySignature({ publicKeyPem, signatureB64, payload }) {
  const subtle = webcrypto?.subtle || globalThis.crypto?.subtle;
  if (!subtle) throw new Error("WebCrypto subtle is not available.");
  const key = await subtle.importKey(
    "spki",
    pemToDer(publicKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
  const data = new TextEncoder().encode(payload);
  const signature = Buffer.from(String(signatureB64 || ""), "base64");
  return subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, signature, data);
}

function extractCoreReceipt(receipt) {
  return {
    eventId: receipt.eventId,
    stream: receipt.stream,
    type: receipt.type,
    payload: receipt.payload,
    createdAt: receipt.createdAt,
    issuer: receipt.issuer,
    idempotencyKey: receipt.idempotencyKey,
    prevEventId: receipt.prevEventId ?? null,
    prevHash: receipt.prevHash ?? null,
    schemaVersion: receipt.schemaVersion,
    streamVersion: receipt.streamVersion,
  };
}

async function loadSigningIdentities() {
  const rows = await dbQuery(
    `
    SELECT id, public_key_pem
    FROM signing_identities
    WHERE status = 'active'
    `
  );
  const map = new Map();
  for (const row of rows.rows || []) {
    map.set(trim(row.id), normalizePublicPem(row.public_key_pem));
  }
  return map;
}

export async function rebuildPixbookReceiptHeads({ persistOffset = true } = {}) {
  const receiptStore = createSpacesReceiptStore();
  if (!receiptStore.ready) {
    throw new Error(
      "Pixbook receipt storage is not configured. Set LEDGER_* and PIXBOOK_RECEIPTS_PREFIX."
    );
  }

  const signingIdentities = await loadSigningIdentities();
  const indexed = await dbQuery(
    `
    SELECT account_id, book_id, event_id, stream_version, prev_hash, hash, spaces_key, signing_identity_id
    FROM pixbook_receipt_index
    ORDER BY account_id ASC, book_id ASC, stream_version ASC
    `
  );

  const byStream = new Map();
  for (const row of indexed.rows || []) {
    const accountId = trim(row.account_id);
    const bookId = trim(row.book_id);
    const key = `${accountId}:${bookId}`;
    if (!byStream.has(key)) {
      byStream.set(key, []);
    }
    byStream.get(key).push({
      accountId,
      bookId,
      eventId: trim(row.event_id),
      streamVersion: Number(row.stream_version || 0),
      prevHash: trim(row.prev_hash),
      hash: trim(row.hash),
      spacesKey: trim(row.spaces_key),
      signingIdentityId: trim(row.signing_identity_id),
    });
  }

  const rebuilt = [];
  for (const [streamKey, rows] of byStream.entries()) {
    let expectedPrevHash = "";
    let expectedVersion = 0;
    let lastEventId = "";
    let lastHash = "";
    const [accountId, bookId] = streamKey.split(":");

    for (const row of rows) {
      if (row.streamVersion !== expectedVersion + 1) {
        throw new Error(
          `Stream version gap in ${streamKey}. Expected ${expectedVersion + 1}, got ${row.streamVersion}.`
        );
      }
      if (trim(row.prevHash) !== trim(expectedPrevHash)) {
        throw new Error(
          `prevHash mismatch in ${streamKey} at streamVersion ${row.streamVersion}.`
        );
      }

      const raw = await receiptStore.getReceiptByKey(row.spacesKey);
      const receipt = JSON.parse(raw);
      const core = extractCoreReceipt(receipt);
      const canonical = canonicalStringify(core);
      const computedHash = sha256Hex(canonical);
      if (computedHash !== row.hash || computedHash !== trim(receipt.hash)) {
        throw new Error(
          `Hash mismatch in ${streamKey} at streamVersion ${row.streamVersion}.`
        );
      }

      const signingIdentityPem = signingIdentities.get(row.signingIdentityId);
      if (!signingIdentityPem) {
        throw new Error(
          `Missing signing identity ${row.signingIdentityId} for ${streamKey}.`
        );
      }
      const signatureOk = await verifySignature({
        publicKeyPem: signingIdentityPem,
        signatureB64: receipt.signature,
        payload: canonical,
      });
      if (!signatureOk) {
        throw new Error(
          `Signature verification failed in ${streamKey} at streamVersion ${row.streamVersion}.`
        );
      }

      expectedPrevHash = row.hash;
      expectedVersion = row.streamVersion;
      lastEventId = row.eventId;
      lastHash = row.hash;
    }

    rebuilt.push({
      accountId,
      bookId,
      streamVersion: expectedVersion,
      lastEventId,
      lastHash,
    });
  }

  if (persistOffset) {
    await dbTx(async (client) => {
      await client.query(
        `
        INSERT INTO projector_offsets (projector_name, account_id, book_id, stream_version, event_id, checkpoint, updated_at)
        VALUES ($1, NULL, NULL, NULL, NULL, $2::jsonb, NOW())
        ON CONFLICT (projector_name)
        DO UPDATE SET
          checkpoint = EXCLUDED.checkpoint,
          updated_at = NOW()
        `,
        [
          "pixbook-rebuild",
          JSON.stringify({
            rebuiltStreams: rebuilt.length,
            rebuiltAt: new Date().toISOString(),
          }),
        ]
      );
    });
  }

  return rebuilt;
}

export async function computeHeadDrift() {
  const rebuilt = await rebuildPixbookReceiptHeads({ persistOffset: false });
  const mismatches = [];

  for (const stream of rebuilt) {
    const head = await dbQuery(
      `
      SELECT last_event_id, last_hash, stream_version
      FROM pixbook_ledger_heads
      WHERE account_id = $1
        AND book_id = $2
      LIMIT 1
      `,
      [stream.accountId, stream.bookId]
    );
    const row = head.rows?.[0] || null;
    const persistedHash = trim(row?.last_hash);
    const persistedVersion = Number(row?.stream_version || 0);
    const persistedEventId = trim(row?.last_event_id);
    if (
      persistedHash !== stream.lastHash ||
      persistedVersion !== stream.streamVersion ||
      persistedEventId !== stream.lastEventId
    ) {
      mismatches.push({
        accountId: stream.accountId,
        bookId: stream.bookId,
        persisted: {
          lastHash: persistedHash,
          streamVersion: persistedVersion,
          lastEventId: persistedEventId,
        },
        rebuilt: {
          lastHash: stream.lastHash,
          streamVersion: stream.streamVersion,
          lastEventId: stream.lastEventId,
        },
      });
    }
  }

  return {
    rebuiltStreams: rebuilt.length,
    mismatches,
  };
}

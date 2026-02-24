const PIXBOOK_LEDGER_FORMAT = "pixbook-ledger-state";
const PIXBOOK_LEDGER_VERSION = "1.0";
const DEFAULT_PIXBOOK_LEDGER_PREFIX = "pixpax/pixbooks";

let cachedGatewayPromise = null;

function trimPathSegment(value) {
  return String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function normalizeKeySegment(value) {
  return trimPathSegment(value)
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._:-]/g, "_");
}

function normalizePrefix(value) {
  const normalized = trimPathSegment(value);
  return normalized || DEFAULT_PIXBOOK_LEDGER_PREFIX;
}

function isNoSuchKeyError(error) {
  return (
    String(error?.name || "") === "NoSuchKey" ||
    Number(error?.$metadata?.httpStatusCode || 0) === 404 ||
    String(error?.message || "").startsWith("NoSuchKey:")
  );
}

export function createPixbookLedgerConfigFromEnv() {
  const endpoint = String(process.env.LEDGER_S3_ENDPOINT || "").trim();
  const bucket = String(
    process.env.PIXBOOK_LEDGER_BUCKET ||
      process.env.LEDGER_CONTENT_BUCKET ||
      process.env.LEDGER_BUCKET ||
      ""
  ).trim();
  const prefix = normalizePrefix(
    process.env.PIXBOOK_LEDGER_PREFIX || DEFAULT_PIXBOOK_LEDGER_PREFIX
  );
  const region = String(process.env.LEDGER_REGION || "lon1").trim();
  const accessKeyId = String(process.env.LEDGER_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = String(process.env.LEDGER_SECRET_ACCESS_KEY || "").trim();
  const forcePathStyle =
    String(process.env.LEDGER_S3_FORCE_PATH_STYLE || "true").toLowerCase() !==
    "false";

  const ready =
    !!endpoint &&
    !!bucket &&
    !!region &&
    !!accessKeyId &&
    !!secretAccessKey;

  return {
    ready,
    endpoint,
    bucket,
    prefix,
    region,
    accessKeyId,
    secretAccessKey,
    forcePathStyle,
  };
}

async function createGateway(config) {
  const { S3Client, GetObjectCommand, PutObjectCommand } = await import(
    "@aws-sdk/client-s3"
  );

  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  async function bodyToBuffer(body) {
    if (!body) return Buffer.alloc(0);
    if (Buffer.isBuffer(body)) return body;
    if (typeof body.transformToByteArray === "function") {
      const bytes = await body.transformToByteArray();
      return Buffer.from(bytes);
    }
    if (typeof body.transformToString === "function") {
      const text = await body.transformToString();
      return Buffer.from(text, "utf8");
    }
    const chunks = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  return {
    async getObject({ bucket, key }) {
      try {
        const response = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key })
        );
        return bodyToBuffer(response.Body);
      } catch (error) {
        if (isNoSuchKeyError(error)) {
          throw new Error(`NoSuchKey:${key}`);
        }
        throw error;
      }
    },

    async putObject({ bucket, key, body, contentType, cacheControl }) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: cacheControl,
        })
      );
    },
  };
}

async function getGatewayContext() {
  const config = createPixbookLedgerConfigFromEnv();
  if (!config.ready) {
    return { config, gateway: null };
  }

  if (!cachedGatewayPromise) {
    cachedGatewayPromise = createGateway(config);
  }

  const gateway = await cachedGatewayPromise;
  return { config, gateway };
}

export function buildPixbookLedgerObjectKey({ accountId, bookId, prefix }) {
  const normalizedAccountId = normalizeKeySegment(accountId);
  const normalizedBookId = normalizeKeySegment(bookId);
  if (!normalizedAccountId) throw new Error("accountId is required.");
  if (!normalizedBookId) throw new Error("bookId is required.");
  const scopedPrefix = normalizePrefix(prefix || DEFAULT_PIXBOOK_LEDGER_PREFIX);
  return `${scopedPrefix}/${normalizedAccountId}/${normalizedBookId}/ledger.json`;
}

function toLedgerState(record, fallbackBookId) {
  if (!record || typeof record !== "object") return null;
  const payload = record.payload;
  if (payload == null || typeof payload !== "object") return null;
  const bookId = String(record.bookId || fallbackBookId || "").trim();
  const version = Number(record.version || 0);
  if (!bookId || !Number.isFinite(version) || version < 0) return null;
  const updatedAt = String(record.updatedAt || "").trim() || new Date().toISOString();
  return {
    id: `book-ledger:${bookId}:v${version}`,
    bookId,
    version,
    ledgerHead: String(record.ledgerHead || "").trim() || null,
    checksum: String(record.checksum || "").trim(),
    createdAt: updatedAt,
    payload,
  };
}

export async function readPixbookLedgerState({ accountId, bookId }) {
  const normalizedAccountId = String(accountId || "").trim();
  const normalizedBookId = String(bookId || "").trim();
  if (!normalizedAccountId || !normalizedBookId) {
    return { ok: false, reason: "missing-identifiers", state: null, key: null };
  }

  const { config, gateway } = await getGatewayContext();
  if (!gateway) {
    return { ok: false, reason: "storage-unconfigured", state: null, key: null };
  }

  const key = buildPixbookLedgerObjectKey({
    accountId: normalizedAccountId,
    bookId: normalizedBookId,
    prefix: config.prefix,
  });

  try {
    const bytes = await gateway.getObject({ bucket: config.bucket, key });
    const parsed = JSON.parse(Buffer.from(bytes).toString("utf8"));
    const state = toLedgerState(parsed, normalizedBookId);
    if (!state) {
      return { ok: false, reason: "invalid-object", state: null, key };
    }
    return { ok: true, reason: "ok", state, key };
  } catch (error) {
    if (String(error?.message || "").startsWith("NoSuchKey:")) {
      return { ok: true, reason: "missing", state: null, key };
    }
    throw error;
  }
}

export async function writePixbookLedgerState({
  accountId,
  bookId,
  version,
  ledgerHead,
  checksum,
  payload,
  updatedAt,
}) {
  const normalizedAccountId = String(accountId || "").trim();
  const normalizedBookId = String(bookId || "").trim();
  if (!normalizedAccountId || !normalizedBookId) {
    throw new Error("accountId and bookId are required.");
  }

  const { config, gateway } = await getGatewayContext();
  if (!gateway) {
    throw new Error(
      "Pixbook ledger storage is not configured. Set LEDGER_* (and optional PIXBOOK_LEDGER_*) environment variables."
    );
  }

  const normalizedVersion = Number(version || 0);
  if (!Number.isFinite(normalizedVersion) || normalizedVersion < 0) {
    throw new Error("version must be a non-negative integer.");
  }
  if (payload == null || typeof payload !== "object") {
    throw new Error("payload object is required.");
  }

  const key = buildPixbookLedgerObjectKey({
    accountId: normalizedAccountId,
    bookId: normalizedBookId,
    prefix: config.prefix,
  });
  const writtenAt = String(updatedAt || "").trim() || new Date().toISOString();
  const objectBody = {
    format: PIXBOOK_LEDGER_FORMAT,
    versionSchema: PIXBOOK_LEDGER_VERSION,
    accountId: normalizedAccountId,
    bookId: normalizedBookId,
    version: normalizedVersion,
    ledgerHead: String(ledgerHead || "").trim() || null,
    checksum: String(checksum || "").trim(),
    updatedAt: writtenAt,
    payload,
  };

  await gateway.putObject({
    bucket: config.bucket,
    key,
    body: Buffer.from(JSON.stringify(objectBody, null, 2), "utf8"),
    contentType: "application/json",
    cacheControl: "no-store",
  });

  const state = toLedgerState(objectBody, normalizedBookId);
  return { key, state };
}

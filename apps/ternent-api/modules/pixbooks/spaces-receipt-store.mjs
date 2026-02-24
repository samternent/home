function trimPathSegment(value) {
  return String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function normalizePrefix(value) {
  const normalized = trimPathSegment(value);
  return normalized || "pixpax/pixbooks";
}

function normalizeKeySegment(value) {
  return trimPathSegment(value)
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._:-]/g, "_");
}

function isNoSuchKeyError(error) {
  return (
    String(error?.name || "") === "NoSuchKey" ||
    Number(error?.$metadata?.httpStatusCode || 0) === 404 ||
    String(error?.message || "").startsWith("NoSuchKey:")
  );
}

export function createPixbookReceiptStoreConfigFromEnv() {
  const endpoint = String(process.env.LEDGER_S3_ENDPOINT || "").trim();
  const bucket = String(
    process.env.PIXBOOK_LEDGER_BUCKET ||
      process.env.LEDGER_CONTENT_BUCKET ||
      process.env.LEDGER_BUCKET ||
      ""
  ).trim();
  const prefix = normalizePrefix(
    process.env.PIXBOOK_RECEIPTS_PREFIX || process.env.PIXBOOK_LEDGER_PREFIX || "pixpax/pixbooks"
  );
  const region = String(process.env.LEDGER_REGION || "lon1").trim();
  const accessKeyId = String(process.env.LEDGER_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = String(process.env.LEDGER_SECRET_ACCESS_KEY || "").trim();
  const forcePathStyle =
    String(process.env.LEDGER_S3_FORCE_PATH_STYLE || "true").toLowerCase() !==
    "false";

  return {
    endpoint,
    bucket,
    prefix,
    region,
    accessKeyId,
    secretAccessKey,
    forcePathStyle,
    ready: Boolean(endpoint && bucket && region && accessKeyId && secretAccessKey),
  };
}

let gatewayPromise = null;

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

async function getGateway(config) {
  if (!gatewayPromise) {
    gatewayPromise = createGateway(config);
  }
  return gatewayPromise;
}

export function buildPixbookReceiptKey({ prefix, accountId, bookId, eventId }) {
  const p = normalizePrefix(prefix);
  const a = normalizeKeySegment(accountId);
  const b = normalizeKeySegment(bookId);
  const e = normalizeKeySegment(eventId);
  if (!a || !b || !e) {
    throw new Error("accountId, bookId, and eventId are required for receipt key.");
  }
  return `${p}/${a}/${b}/events/${e}.json`;
}

export function createSpacesReceiptStore() {
  const config = createPixbookReceiptStoreConfigFromEnv();

  return {
    get ready() {
      return config.ready;
    },
    get bucket() {
      return config.bucket;
    },
    get prefix() {
      return config.prefix;
    },

    async putReceipt({ accountId, bookId, eventId, body }) {
      if (!config.ready) {
        throw new Error(
          "Pixbook receipt storage is not configured. Set LEDGER_* and PIXBOOK_RECEIPTS_PREFIX."
        );
      }
      const gateway = await getGateway(config);
      const key = buildPixbookReceiptKey({
        prefix: config.prefix,
        accountId,
        bookId,
        eventId,
      });
      await gateway.putObject({
        bucket: config.bucket,
        key,
        body: Buffer.from(String(body || ""), "utf8"),
        contentType: "application/json",
        cacheControl: "no-store",
      });
      return { key };
    },

    async getReceiptByKey(key) {
      if (!config.ready) {
        throw new Error(
          "Pixbook receipt storage is not configured. Set LEDGER_* and PIXBOOK_RECEIPTS_PREFIX."
        );
      }
      const gateway = await getGateway(config);
      const bytes = await gateway.getObject({
        bucket: config.bucket,
        key,
      });
      return bytes.toString("utf8");
    },
  };
}

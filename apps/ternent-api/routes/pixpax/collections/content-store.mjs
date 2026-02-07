export function createPixpaxContentConfigFromEnv() {
  const endpoint = process.env.LEDGER_S3_ENDPOINT || "";
  const bucket = process.env.LEDGER_CONTENT_BUCKET || process.env.LEDGER_BUCKET || "";
  const prefix = process.env.LEDGER_CONTENT_PREFIX || "pixpax/collections";
  const region = process.env.LEDGER_REGION || "lon1";
  const accessKeyId = process.env.LEDGER_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.LEDGER_SECRET_ACCESS_KEY || "";
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

export function createCollectionContentGatewayFromS3Client(params) {
  const { client, GetObjectCommand, PutObjectCommand } = params || {};
  if (!client || !GetObjectCommand || !PutObjectCommand) {
    throw new Error(
      "createCollectionContentGatewayFromS3Client requires client, GetObjectCommand, and PutObjectCommand."
    );
  }

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
        if (
          error?.name === "NoSuchKey" ||
          error?.$metadata?.httpStatusCode === 404
        ) {
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

export async function createCollectionContentGateway(config) {
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
  return createCollectionContentGatewayFromS3Client({
    client,
    GetObjectCommand,
    PutObjectCommand,
  });
}

function trimSegment(value) {
  return String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function buildObjectKey(prefix, collectionId, version, filename) {
  const scopedPrefix = [prefix, collectionId, version]
    .map((part) => trimSegment(part))
    .filter(Boolean)
    .join("/");
  return `${scopedPrefix}/${filename}`;
}

async function putJson(gateway, bucket, key, value) {
  const bytes = Buffer.from(JSON.stringify(value, null, 2), "utf8");
  await gateway.putObject({
    bucket,
    key,
    body: bytes,
    contentType: "application/json",
    cacheControl: "public, max-age=31536000, immutable",
  });
}

async function putJsonIfAbsent(gateway, bucket, key, value) {
  try {
    await gateway.getObject({ bucket, key });
    return { created: false, key };
  } catch (error) {
    if (!String(error?.message || "").startsWith("NoSuchKey:")) {
      throw error;
    }
  }

  await putJson(gateway, bucket, key, value);
  return { created: true, key };
}

async function getJson(gateway, bucket, key) {
  const bytes = await gateway.getObject({ bucket, key });
  return JSON.parse(Buffer.from(bytes).toString("utf8"));
}

export class CollectionContentStore {
  constructor(params) {
    const { bucket, prefix, gateway } = params || {};
    if (!bucket) throw new Error("CollectionContentStore requires bucket.");
    if (!prefix) throw new Error("CollectionContentStore requires prefix.");
    if (!gateway) throw new Error("CollectionContentStore requires gateway.");

    this.bucket = bucket;
    this.prefix = prefix;
    this.gateway = gateway;
  }

  buildCollectionKey(collectionId, version) {
    return buildObjectKey(this.prefix, collectionId, version, "collection.json");
  }

  buildIndexKey(collectionId, version) {
    return buildObjectKey(this.prefix, collectionId, version, "index.json");
  }

  buildCardKey(collectionId, version, cardId) {
    return buildObjectKey(this.prefix, collectionId, version, `cards/${trimSegment(cardId)}.json`);
  }

  async putCollection(collectionId, version, collectionJson) {
    const key = this.buildCollectionKey(collectionId, version);
    await putJson(this.gateway, this.bucket, key, collectionJson);
    return { bucket: this.bucket, key };
  }

  async putCollectionIfAbsent(collectionId, version, collectionJson) {
    const key = this.buildCollectionKey(collectionId, version);
    const result = await putJsonIfAbsent(this.gateway, this.bucket, key, collectionJson);
    return { bucket: this.bucket, key, created: result.created };
  }

  async putIndex(collectionId, version, indexJson) {
    const key = this.buildIndexKey(collectionId, version);
    await putJson(this.gateway, this.bucket, key, indexJson);
    return { bucket: this.bucket, key };
  }

  async putIndexIfAbsent(collectionId, version, indexJson) {
    const key = this.buildIndexKey(collectionId, version);
    const result = await putJsonIfAbsent(this.gateway, this.bucket, key, indexJson);
    return { bucket: this.bucket, key, created: result.created };
  }

  async putCard(collectionId, version, cardId, cardJson) {
    const key = this.buildCardKey(collectionId, version, cardId);
    await putJson(this.gateway, this.bucket, key, cardJson);
    return { bucket: this.bucket, key };
  }

  async putCardIfAbsent(collectionId, version, cardId, cardJson) {
    const key = this.buildCardKey(collectionId, version, cardId);
    const result = await putJsonIfAbsent(this.gateway, this.bucket, key, cardJson);
    return { bucket: this.bucket, key, created: result.created };
  }

  async getCollection(collectionId, version) {
    const key = this.buildCollectionKey(collectionId, version);
    return getJson(this.gateway, this.bucket, key);
  }

  async getIndex(collectionId, version) {
    const key = this.buildIndexKey(collectionId, version);
    return getJson(this.gateway, this.bucket, key);
  }

  async getCard(collectionId, version, cardId) {
    const key = this.buildCardKey(collectionId, version, cardId);
    return getJson(this.gateway, this.bucket, key);
  }
}

export async function createCollectionContentStoreFromEnv() {
  const config = createPixpaxContentConfigFromEnv();
  if (!config.ready) {
    throw new Error(
      "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX."
    );
  }
  const gateway = await createCollectionContentGateway(config);
  return new CollectionContentStore({
    bucket: config.bucket,
    prefix: config.prefix,
    gateway,
  });
}

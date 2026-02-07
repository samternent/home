import { createHash, webcrypto } from "crypto";
import { gzipSync, gunzipSync } from "zlib";
import { canonicalStringify, getEntrySigningPayload } from "@ternent/concord-protocol";

const LEDGER_FORMAT = "pixpax-ledger-segment";
const LEDGER_VERSION = "1.0";
const CHECKPOINT_FORMAT = "pixpax-ledger-checkpoint";
const CHECKPOINT_VERSION = "1.0";
const TRUSTED_KEYS_SCHEMA =
  'JSON array of objects: [{"keyId":"<sha256 pubkey>", "publicKeyPem":"-----BEGIN PUBLIC KEY-----..."}]';
const SEGMENT_HASH_INPUT = "sha256(uncompressed-jsonl-utf8-bytes)";

function sha256HexFromString(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function sha256HexFromBytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizePem(pem) {
  if (!pem) return "";
  const normalized = pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
  return normalized.trim();
}

function ensurePublicPem(pemOrBody) {
  const normalized = normalizePem(pemOrBody);
  if (!normalized) return "";
  if (normalized.includes("BEGIN PUBLIC KEY")) return `${normalized}\n`;
  return `-----BEGIN PUBLIC KEY-----\n${normalized}\n-----END PUBLIC KEY-----\n`;
}

function fingerprintPublicKey(publicKeyPemOrBody) {
  return sha256HexFromString(normalizePem(publicKeyPemOrBody));
}

function parseTrustedIssuerKeysStrict(value) {
  if (!value) return {};

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error(
      `Invalid LEDGER_TRUSTED_ISSUER_PUBLIC_KEYS_JSON: must be valid JSON (${TRUSTED_KEYS_SCHEMA}).`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Invalid LEDGER_TRUSTED_ISSUER_PUBLIC_KEYS_JSON: expected array (${TRUSTED_KEYS_SCHEMA}).`
    );
  }

  const mapped = {};
  for (const [index, entry] of parsed.entries()) {
    if (!entry || typeof entry !== "object") {
      throw new Error(
        `Invalid trusted issuer key at index ${index}: expected object with keyId and publicKeyPem.`
      );
    }

    const keyId = String(entry.keyId || "").trim();
    const publicKeyPem = ensurePublicPem(entry.publicKeyPem || "");

    if (!/^[a-f0-9]{64}$/i.test(keyId)) {
      throw new Error(
        `Invalid trusted issuer key at index ${index}: keyId must be a sha256 hex string.`
      );
    }
    if (!publicKeyPem || !publicKeyPem.includes("BEGIN PUBLIC KEY")) {
      throw new Error(
        `Invalid trusted issuer key at index ${index}: publicKeyPem must be a PEM-encoded public key.`
      );
    }

    const derived = fingerprintPublicKey(publicKeyPem);
    if (derived !== keyId) {
      throw new Error(
        `Invalid trusted issuer key at index ${index}: keyId does not match sha256(publicKeyPem).`
      );
    }

    mapped[keyId] = publicKeyPem;
  }

  return mapped;
}

function nowIso() {
  return new Date().toISOString();
}

function utcDatePathPart(timestamp) {
  const date = new Date(timestamp);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pemBodyToDer(pem) {
  const stripped = normalizePem(pem)
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replaceAll("\n", "");
  return Buffer.from(stripped, "base64");
}

async function importVerifyKey(publicKeyPem) {
  const subtle = webcrypto?.subtle || globalThis.crypto?.subtle;
  if (!subtle) throw new Error("WebCrypto subtle is not available.");
  const der = pemBodyToDer(publicKeyPem);
  return subtle.importKey(
    "spki",
    der,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
}

async function verifyEntrySignature(entry, publicKeyPem) {
  if (!entry?.signature) return false;
  const subtle = webcrypto?.subtle || globalThis.crypto?.subtle;
  if (!subtle) throw new Error("WebCrypto subtle is not available.");
  const key = await importVerifyKey(publicKeyPem);
  const data = new TextEncoder().encode(getEntrySigningPayload(entry));
  const signature = Buffer.from(String(entry.signature), "base64");
  return subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, signature, data);
}

export function createDefaultCheckpoint(prefix) {
  return {
    format: CHECKPOINT_FORMAT,
    version: CHECKPOINT_VERSION,
    updatedAt: nowIso(),
    prefix,
    headSegmentHash: null,
    headSegmentKey: null,
    segmentCount: 0,
    totalEvents: 0,
    segmentHashInput: SEGMENT_HASH_INPUT,
  };
}

export function segmentEventsToJsonl({
  createdAt,
  prevSegmentHash,
  prevSegmentKey,
  events,
}) {
  const lines = [];
  const eventCount = Array.isArray(events) ? events.length : 0;
  lines.push(
    JSON.stringify({
      type: "segment.meta",
      format: LEDGER_FORMAT,
      version: LEDGER_VERSION,
      createdAt,
      prevSegmentHash: prevSegmentHash || null,
      prevSegmentKey: prevSegmentKey || null,
      segmentHashInput: SEGMENT_HASH_INPUT,
      compression: "gzip",
      eventCount,
    })
  );

  for (const event of events || []) {
    lines.push(
      JSON.stringify({
        type: "concord.entry",
        entryId: event.entryId,
        entry: event.entry,
      })
    );
  }

  return `${lines.join("\n")}\n`;
}

export function parseSegmentJsonl(segmentText) {
  const lines = String(segmentText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("Segment has no lines.");
  }

  const first = JSON.parse(lines[0]);
  if (first?.type !== "segment.meta") {
    throw new Error("Segment first line must be segment.meta.");
  }
  if (first?.format !== LEDGER_FORMAT) {
    throw new Error(`Unsupported segment format: ${first?.format || "unknown"}`);
  }

  const events = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parsed = JSON.parse(lines[i]);
    if (parsed?.type !== "concord.entry") {
      throw new Error(`Unexpected segment line type at index ${i}: ${parsed?.type}`);
    }
    events.push({ entryId: parsed.entryId, entry: parsed.entry });
  }

  if (Number(first.eventCount || 0) !== events.length) {
    throw new Error("segment.meta eventCount does not match line count.");
  }

  return { meta: first, events };
}

export function buildSegmentObject({ checkpoint, events }) {
  const createdAt = nowIso();
  const jsonl = segmentEventsToJsonl({
    createdAt,
    prevSegmentHash: checkpoint?.headSegmentHash || null,
    prevSegmentKey: checkpoint?.headSegmentKey || null,
    events,
  });
  const segmentHash = sha256HexFromString(jsonl);
  const datePath = utcDatePathPart(createdAt);
  return {
    createdAt,
    datePath,
    jsonl,
    gzipped: gzipSync(Buffer.from(jsonl, "utf8")),
    segmentHash,
  };
}

export function mergeTrustedIssuerKeys(params) {
  const current = {};
  if (params?.currentIssuerKeyId && params?.currentIssuerPublicKeyPem) {
    current[params.currentIssuerKeyId] = ensurePublicPem(params.currentIssuerPublicKeyPem);
  }

  const parsedFromEnv = parseTrustedIssuerKeysStrict(
    params?.trustedIssuerPublicKeysJson || ""
  );

  return {
    ...parsedFromEnv,
    ...current,
  };
}

export class IssuerAuditLedger {
  constructor(options) {
    this.options = options;
    this.pending = [];
    this.flushing = null;
    this.flushTimer = null;
  }

  async init() {
    if (this.options.disabled) return;
    await this.ensureCheckpoint();
    this.ensureTimers();
  }

  async appendIssuedEntry(entryId, entry) {
    if (this.options.disabled) {
      return { persisted: false, reason: "ledger-disabled" };
    }

    this.pending.push({ entryId, entry });
    if (this.pending.length >= this.options.flushMaxEvents) {
      const flushResult = await this.flush();
      return { persisted: true, ...(flushResult || {}), queued: false };
    } else {
      this.ensureTimers();
    }

    if (this.options.flushSyncOnIssue) {
      const flushResult = await this.flush();
      return { persisted: true, ...(flushResult || {}), queued: false };
    }

    return {
      persisted: true,
      queued: true,
      queuedEvents: this.pending.length,
      segmentKey: null,
      segmentHash: null,
    };
  }

  ensureTimers() {
    if (this.flushTimer || this.options.disabled) return;
    const interval = this.options.flushIntervalMs;
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        console.error("[pixpax-ledger] periodic flush failed:", error);
      });
    }, interval);
    if (typeof this.flushTimer.unref === "function") {
      this.flushTimer.unref();
    }
  }

  clearTimers() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  async shutdown() {
    this.clearTimers();
    await this.flush();
  }

  async flush() {
    if (this.options.disabled) return null;
    if (this.flushing) return this.flushing;
    if (!this.pending.length) return null;

    this.flushing = this.#flushOnce();
    try {
      return await this.flushing;
    } finally {
      this.flushing = null;
    }
  }

  async #flushOnce() {
    if (!this.pending.length) return null;

    const events = this.pending.splice(0, this.options.flushMaxEvents);
    const checkpoint = await this.ensureCheckpoint();
    const built = buildSegmentObject({ checkpoint, events });

    const segmentKey = `${this.options.prefix}/segments/${built.datePath}/seg_${built.segmentHash}.jsonl.gz`;
    await this.options.gateway.putObject({
      bucket: this.options.bucket,
      key: segmentKey,
      body: built.gzipped,
      contentType: "application/gzip",
      cacheControl: "public, max-age=31536000, immutable",
    });

    const nextCheckpoint = {
      format: CHECKPOINT_FORMAT,
      version: CHECKPOINT_VERSION,
      updatedAt: nowIso(),
      prefix: this.options.prefix,
      headSegmentHash: built.segmentHash,
      headSegmentKey: segmentKey,
      segmentCount: Number(checkpoint.segmentCount || 0) + 1,
      totalEvents: Number(checkpoint.totalEvents || 0) + events.length,
      segmentHashInput: SEGMENT_HASH_INPUT,
    };

    const checkpointKey = `${this.options.prefix}/checkpoint.json`;
    await this.options.gateway.putObject({
      bucket: this.options.bucket,
      key: checkpointKey,
      body: Buffer.from(JSON.stringify(nextCheckpoint, null, 2), "utf8"),
      contentType: "application/json",
      cacheControl: "no-store",
    });

    this.checkpoint = nextCheckpoint;

    return {
      segmentHash: built.segmentHash,
      segmentKey,
      flushedEvents: events.length,
    };
  }

  async ensureCheckpoint() {
    if (this.checkpoint) return this.checkpoint;

    const checkpointKey = `${this.options.prefix}/checkpoint.json`;

    try {
      const data = await this.options.gateway.getObject({
        bucket: this.options.bucket,
        key: checkpointKey,
      });

      const parsed = JSON.parse(Buffer.from(data).toString("utf8"));
      this.checkpoint = {
        format: CHECKPOINT_FORMAT,
        version: CHECKPOINT_VERSION,
        updatedAt: parsed?.updatedAt || nowIso(),
        prefix: parsed?.prefix || this.options.prefix,
        headSegmentHash: parsed?.headSegmentHash || null,
        headSegmentKey: parsed?.headSegmentKey || null,
        segmentCount: Number(parsed?.segmentCount || 0),
        totalEvents: Number(parsed?.totalEvents || 0),
        segmentHashInput: parsed?.segmentHashInput || SEGMENT_HASH_INPUT,
      };
      return this.checkpoint;
    } catch (error) {
      if (!String(error?.message || "").includes("NoSuchKey")) {
        throw error;
      }
    }

    const initial = createDefaultCheckpoint(this.options.prefix);
    await this.options.gateway.putObject({
      bucket: this.options.bucket,
      key: checkpointKey,
      body: Buffer.from(JSON.stringify(initial, null, 2), "utf8"),
      contentType: "application/json",
      cacheControl: "no-store",
    });
    this.checkpoint = initial;
    return initial;
  }

  async getCheckpoint() {
    return this.ensureCheckpoint();
  }

  async getSegmentByKey(segmentKey) {
    const bytes = await this.options.gateway.getObject({
      bucket: this.options.bucket,
      key: segmentKey,
    });
    const unzipped = gunzipSync(Buffer.from(bytes));
    const content = unzipped.toString("utf8");
    const segmentHash = sha256HexFromString(content);
    const segmentHashFromKey = getSegmentHashFromKey(segmentKey);
    if (segmentHashFromKey && segmentHashFromKey !== segmentHash) {
      throw new Error(
        `Segment key hash mismatch for ${segmentKey}: expected ${segmentHashFromKey}, got ${segmentHash}`
      );
    }
    return {
      segmentKey,
      segmentHash,
      content,
      parsed: parseSegmentJsonl(content),
    };
  }

  async fetchReceiptProof(packId, segmentKey) {
    const checkpoint = await this.ensureCheckpoint();
    if (!segmentKey) {
      return { ok: false, reason: "missing-segment-key", checkpoint };
    }

    const trustedIssuerKeys = mergeTrustedIssuerKeys({
      currentIssuerKeyId: this.options.currentIssuerKeyId,
      currentIssuerPublicKeyPem: this.options.currentIssuerPublicKeyPem,
      trustedIssuerPublicKeysJson: this.options.trustedIssuerPublicKeysJson,
    });

    const chain = [];
    let cursorKey = checkpoint.headSegmentKey;

    while (cursorKey) {
      let segment;
      try {
        segment = await this.getSegmentByKey(cursorKey);
      } catch (error) {
        return {
          ok: false,
          reason: "segment-integrity-error",
          message: error?.message || "Failed to load segment.",
        };
      }
      chain.push({
        segmentKey: cursorKey,
        segmentHash: segment.segmentHash,
        content: segment.content,
        parsed: segment.parsed,
      });

      if (cursorKey === segmentKey) {
        break;
      }

      cursorKey = segment.parsed.meta.prevSegmentKey || null;
    }

    if (!chain.length || chain[chain.length - 1]?.segmentKey !== segmentKey) {
      return {
        ok: false,
        reason: "segment-not-reachable-from-head",
        checkpoint,
      };
    }

    if (
      chain[0]?.segmentHash !== checkpoint.headSegmentHash ||
      chain[0]?.segmentKey !== checkpoint.headSegmentKey
    ) {
      return { ok: false, reason: "checkpoint-head-mismatch", checkpoint };
    }

    for (let i = 0; i < chain.length - 1; i += 1) {
      const current = chain[i];
      const parent = chain[i + 1];
      if ((current.parsed.meta.prevSegmentHash || null) !== parent.segmentHash) {
        return { ok: false, reason: "prev-segment-hash-mismatch", checkpoint };
      }
      if ((current.parsed.meta.prevSegmentKey || null) !== parent.segmentKey) {
        return { ok: false, reason: "prev-segment-key-mismatch", checkpoint };
      }
    }

    const target = chain[chain.length - 1];
    const targetParsed = parseSegmentJsonl(target.content);
    const receiptEvent = targetParsed.events.find(
      (event) => event?.entry?.payload?.packId === packId && event?.entry?.kind === "pack.issued"
    );

    if (!receiptEvent) {
      return { ok: false, reason: "pack-event-not-in-segment", checkpoint };
    }

    const issuerKeyId = receiptEvent.entry?.payload?.issuerKeyId;
    const issuerPublicKeyPem = trustedIssuerKeys[issuerKeyId];
    if (!issuerPublicKeyPem) {
      return {
        ok: false,
        reason: "issuer-key-not-trusted",
        issuerKeyId: issuerKeyId || null,
      };
    }

    const signatureValid = await verifyEntrySignature(
      receiptEvent.entry,
      issuerPublicKeyPem
    );

    if (!signatureValid) {
      return {
        ok: false,
        reason: "signature-invalid",
        issuerKeyId,
      };
    }

    return {
      ok: true,
      reason: "ok",
      packId,
      event: receiptEvent,
      segmentHash: target.segmentHash,
      segmentKey: target.segmentKey,
      checkpoint: {
        headSegmentHash: checkpoint.headSegmentHash,
        headSegmentKey: checkpoint.headSegmentKey,
        segmentCount: checkpoint.segmentCount,
        totalEvents: checkpoint.totalEvents,
      },
      chainDepthFromHead: chain.length - 1,
    };
  }
}

export function createLedgerConfigFromEnv(params) {
  const endpoint = process.env.LEDGER_S3_ENDPOINT || "";
  const bucket = process.env.LEDGER_BUCKET || "";
  const prefix = process.env.LEDGER_PREFIX || "pixpax/ledger";
  const region = process.env.LEDGER_REGION || "lon1";
  const accessKeyId = process.env.LEDGER_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.LEDGER_SECRET_ACCESS_KEY || "";
  const flushMaxEvents = Number(process.env.LEDGER_FLUSH_MAX_EVENTS || "200");
  const flushIntervalMs = Number(process.env.LEDGER_FLUSH_INTERVAL_MS || "60000");
  const flushSyncOnIssue =
    String(process.env.LEDGER_FLUSH_SYNC_ON_ISSUE || "false").toLowerCase() ===
    "true";

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
    flushMaxEvents:
      Number.isFinite(flushMaxEvents) && flushMaxEvents > 0 ? flushMaxEvents : 200,
    flushIntervalMs:
      Number.isFinite(flushIntervalMs) && flushIntervalMs > 0
        ? flushIntervalMs
        : 60000,
    flushSyncOnIssue,
    trustedIssuerPublicKeysJson:
      process.env.LEDGER_TRUSTED_ISSUER_PUBLIC_KEYS_JSON || "",
    forcePathStyle:
      String(process.env.LEDGER_S3_FORCE_PATH_STYLE || "true").toLowerCase() !==
      "false",
    currentIssuerKeyId: params.currentIssuerKeyId,
    currentIssuerPublicKeyPem: params.currentIssuerPublicKeyPem,
  };
}

export function validateTrustedIssuerKeysAtStartup() {
  const raw = process.env.LEDGER_TRUSTED_ISSUER_PUBLIC_KEYS_JSON || "";
  parseTrustedIssuerKeysStrict(raw);
}

export async function createS3Gateway(config) {
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

export function getSegmentHashFromKey(key) {
  const match = /seg_([a-f0-9]{64})\.jsonl\.gz$/i.exec(String(key || ""));
  return match?.[1] || null;
}

export function hashCanonical(value) {
  return sha256HexFromString(canonicalStringify(value));
}

export function hashBufferHex(buffer) {
  return sha256HexFromBytes(buffer);
}

export function ensurePublicKeyPem(pemOrBody) {
  return ensurePublicPem(pemOrBody);
}

export function deriveIssuerKeyIdFromPublicKey(publicKeyPemOrBody) {
  return fingerprintPublicKey(publicKeyPemOrBody);
}

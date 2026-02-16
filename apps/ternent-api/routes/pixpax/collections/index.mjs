import {
  createCollectionContentGateway,
  createCollectionContentStoreFromEnv,
} from "./content-store.mjs";
import { PACK_MODELS } from "../models/pack-models.mjs";
import { createNonceHex, hashCanonical } from "../../stickerbook/stickerbook-utils.mjs";
import { deriveEntryId, getEntrySigningPayload } from "@ternent/concord-protocol";
import { createHash, createHmac, timingSafeEqual, webcrypto } from "node:crypto";
import { gunzipSync } from "node:zlib";
import {
  ensureIssuerAuditLedger,
  loadIssuerKeys,
} from "../../stickerbook/index.mjs";
import { parseSegmentJsonl } from "../../stickerbook/issuer-audit-ledger.mjs";
import {
  validateCardPayload,
  validateCollectionPayload,
  validateIndexPayload,
} from "./validation.mjs";
import {
  computeMerkleRootFromItemHashes,
  hashAlbumCard,
} from "./curated-hashing.mjs";
import { createPixpaxEvent, PIXPAX_EVENT_TYPES } from "../domain/events.mjs";
import { createCryptoRngSource, createDelegateRngSource } from "../domain/rng-source.mjs";
import { IssuancePolicyError, resolveIssuancePolicy } from "../domain/issuance-policy.mjs";
import { verifyPack } from "../domain/verify-pack.mjs";
import { rebuildCollectionSnapshotFromEvents } from "../domain/rebuild-from-events.mjs";

function extractBearerToken(headerValue) {
  const raw = String(headerValue || "").trim();
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice("bearer ".length).trim();
}

function resolveAdminToken() {
  return String(process.env.PIX_PAX_ADMIN_TOKEN || "").trim();
}

function resolveOverrideCodeSecret() {
  return String(process.env.PIX_PAX_OVERRIDE_CODE_SECRET || "").trim();
}

function missingContentConfigError(error) {
  return String(error?.message || "").includes(
    "Content store configuration is incomplete"
  );
}

function canonicalizeUserKey(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "";
  if (normalized.includes(":")) return normalized;
  return `user:${normalized}`;
}

function hashIssuedToUserKey(userKey) {
  const canonical = canonicalizeUserKey(userKey);
  return createHash("sha256").update(`pixpax:user:${canonical}`, "utf8").digest("hex");
}

function toIsoWeek(isoDate = new Date()) {
  const date = new Date(
    Date.UTC(isoDate.getUTCFullYear(), isoDate.getUTCMonth(), isoDate.getUTCDate())
  );
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function resolveEventCollectionScope(event) {
  const payload = event?.payload || {};
  const collectionId = String(payload?.collectionId || "").trim();
  const version = String(payload?.version || payload?.collectionVersion || "").trim();
  if (!collectionId || !version) {
    throw new Error("PixPax event payload must include collectionId and version/collectionVersion.");
  }
  return { collectionId, version };
}

function clampPackCardCount(value) {
  const count = Number(value ?? 5);
  if (!Number.isFinite(count)) return 5;
  return Math.trunc(count);
}

function isTruthyEnv(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

const DEFAULT_PACK_COUNT = 5;
const DEFAULT_OVERRIDE_CODE_TTL_SECONDS = 14 * 24 * 60 * 60;
const MAX_OVERRIDE_CODE_TTL_SECONDS = 30 * 24 * 60 * 60;

function encodeBase64Url(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${pad}`, "base64");
}

function clampOverrideCodeTtlSeconds(value) {
  const parsed = Number(value ?? DEFAULT_OVERRIDE_CODE_TTL_SECONDS);
  if (!Number.isFinite(parsed)) return DEFAULT_OVERRIDE_CODE_TTL_SECONDS;
  const rounded = Math.trunc(parsed);
  if (rounded < 60) return 60;
  return Math.min(rounded, MAX_OVERRIDE_CODE_TTL_SECONDS);
}

function signOverridePayloadB64(payloadB64, secret) {
  return createHmac("sha256", secret).update(payloadB64, "utf8").digest();
}

function createOverrideCode(payload, secret) {
  const payloadB64 = encodeBase64Url(JSON.stringify(payload));
  const signatureB64 = encodeBase64Url(signOverridePayloadB64(payloadB64, secret));
  return `${payloadB64}.${signatureB64}`;
}

function codeIdToGiftCode(codeId) {
  const normalized = String(codeId || "").trim().toUpperCase();
  if (!/^[A-F0-9]{24}$/.test(normalized)) {
    throw new Error("codeId must be 24 hex chars.");
  }
  const groups = normalized.match(/.{1,4}/g) || [];
  return `PPX-${groups.join("-")}`;
}

function giftCodeToCodeId(input) {
  const raw = String(input || "").trim().toUpperCase();
  if (!raw) return "";
  const compact = raw.replace(/[^A-F0-9]/g, "");
  if (!/^[A-F0-9]{24}$/.test(compact)) return "";
  return compact.toLowerCase();
}

function parseOverrideCode(code, secret, nowSeconds) {
  const raw = String(code || "").trim();
  const parts = raw.split(".");
  if (parts.length !== 2) throw new Error("Invalid override code format.");
  const [payloadB64, signatureB64] = parts;
  const expected = signOverridePayloadB64(payloadB64, secret);
  const provided = decodeBase64Url(signatureB64);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new Error("Override code signature mismatch.");
  }
  const payload = JSON.parse(decodeBase64Url(payloadB64).toString("utf8"));
  if (!payload || payload.v !== 1) throw new Error("Unsupported override code payload.");
  if (!payload.codeId) throw new Error("Override code is missing codeId.");
  if (!payload.collectionId || !payload.version || !payload.dropId) {
    throw new Error("Override code is missing scope fields.");
  }
  if (typeof payload.bindToUser !== "boolean") {
    throw new Error("Override code is missing bindToUser flag.");
  }
  if (!Number.isInteger(payload.count) || payload.count < 1 || payload.count > 50) {
    throw new Error("Override code count is invalid.");
  }
  if (!Number.isInteger(payload.exp)) throw new Error("Override code expiry is invalid.");
  if (payload.bindToUser) {
    if (!payload.issuedTo) throw new Error("Override code is missing issuedTo.");
  } else if (payload.issuedTo !== null) {
    throw new Error("Unbound override code must set issuedTo=null.");
  }
  if (payload.exp <= nowSeconds) throw new Error("Override code is expired.");
  return payload;
}

function privatePemToDer(pem) {
  const stripped = String(pem || "")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replaceAll("\n", "");
  return Buffer.from(stripped, "base64");
}

async function signPayload(privateKeyPem, payload) {
  const subtle = webcrypto?.subtle || globalThis.crypto?.subtle;
  if (!subtle) throw new Error("WebCrypto subtle is not available.");

  const key = await subtle.importKey(
    "pkcs8",
    privatePemToDer(privateKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(payload)
  );

  return Buffer.from(signature).toString("base64");
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const output = new Array(items.length);
  const pending = new Set();
  for (let index = 0; index < items.length; index += 1) {
    const run = Promise.resolve()
      .then(() => mapper(items[index], index))
      .then((value) => {
        output[index] = value;
      })
      .finally(() => {
        pending.delete(run);
      });
    pending.add(run);
    if (pending.size >= concurrency) {
      await Promise.race(pending);
    }
  }
  await Promise.all(pending);
  return output;
}

function parsePositiveInt(value, fallback, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.max(1, Math.floor(parsed));
  if (Number.isFinite(max) && max > 0) {
    return Math.min(rounded, max);
  }
  return rounded;
}

function parseEventScopeFromKey(prefix, key) {
  const normalizedPrefix = String(prefix || "").replace(/\/+$/, "");
  const normalizedKey = String(key || "");
  const prefixWithSlash = `${normalizedPrefix}/`;
  if (!normalizedKey.startsWith(prefixWithSlash)) return null;
  const relative = normalizedKey.slice(prefixWithSlash.length);
  const parts = relative.split("/");
  if (parts.length < 5) return null;
  const [collectionId, version, scope] = parts;
  if (!collectionId || !version || scope !== "events") return null;
  return { collectionId, version };
}

function normalizePathPrefix(value, fallback = "") {
  const normalized = String(value || fallback)
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  return normalized;
}

function resolvePublicId(payload) {
  const publicId = String(payload?.issuedTo || payload?.userKeyHash || "").trim();
  return publicId || null;
}

function buildPackAnalyticsRow(params) {
  const payload = params?.payload || {};
  const fallbackCollectionId = String(params?.collectionId || "").trim();
  const fallbackVersion = String(params?.version || "").trim();
  const fallbackIssuedAt = String(params?.occurredAt || "").trim();
  const source = String(params?.source || "").trim();

  const cardIds = Array.isArray(payload?.cardIds)
    ? payload.cardIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  const countRaw = Number(payload?.count);
  const count = Number.isFinite(countRaw) && countRaw > 0 ? Math.floor(countRaw) : cardIds.length;
  const publicId = resolvePublicId(payload);

  return {
    packId: String(payload?.packId || "").trim(),
    collectionId: String(payload?.collectionId || fallbackCollectionId || "").trim(),
    collectionVersion: String(
      payload?.collectionVersion || payload?.version || fallbackVersion || ""
    ).trim(),
    dropId: String(payload?.dropId || "").trim(),
    issuedAt: String(payload?.issuedAt || fallbackIssuedAt || "").trim(),
    count,
    packRoot: String(payload?.packRoot || "").trim(),
    contentsCommitment: String(payload?.contentsCommitment || "").trim(),
    issuanceMode: String(payload?.issuanceMode || "weekly"),
    untracked: payload?.untracked === true,
    publicId,
    avatarSeed: publicId,
    source,
    eventId: String(params?.eventId || "").trim(),
    cardIds: params?.includeCardIds ? cardIds : undefined,
  };
}

function dedupePackRows(rows) {
  const byId = new Map();
  for (const row of rows) {
    const id = `${row.collectionId}:${row.collectionVersion}:${row.packId}`;
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, row);
      continue;
    }
    if (String(row.issuedAt || "").localeCompare(String(existing.issuedAt || "")) > 0) {
      byId.set(id, row);
    }
  }
  return Array.from(byId.values());
}

function summarizePackAnalytics(rows, scannedEvents) {
  const totalPacks = rows.length;
  const totalCardsIssued = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const byCollection = new Map();
  const byDrop = new Map();
  const byMode = new Map();
  const byDay = new Map();

  let firstIssuedAt = null;
  let lastIssuedAt = null;

  for (const row of rows) {
    const collectionVersionKey = `${row.collectionId}:${row.collectionVersion}`;
    byCollection.set(collectionVersionKey, (byCollection.get(collectionVersionKey) || 0) + 1);
    byDrop.set(row.dropId || "unknown", (byDrop.get(row.dropId || "unknown") || 0) + 1);
    byMode.set(row.issuanceMode || "weekly", (byMode.get(row.issuanceMode || "weekly") || 0) + 1);

    const issuedAt = String(row.issuedAt || "");
    if (issuedAt) {
      const day = issuedAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + 1);
      if (!firstIssuedAt || issuedAt.localeCompare(firstIssuedAt) < 0) {
        firstIssuedAt = issuedAt;
      }
      if (!lastIssuedAt || issuedAt.localeCompare(lastIssuedAt) > 0) {
        lastIssuedAt = issuedAt;
      }
    }
  }

  const topDrops = Array.from(byDrop.entries())
    .map(([dropId, packs]) => ({ dropId, packs }))
    .sort((a, b) => b.packs - a.packs || a.dropId.localeCompare(b.dropId))
    .slice(0, 10);

  const packsByCollectionVersion = Array.from(byCollection.entries())
    .map(([key, packs]) => {
      const [collectionId, collectionVersion] = key.split(":");
      return { collectionId, collectionVersion, packs };
    })
    .sort((a, b) => b.packs - a.packs || a.collectionId.localeCompare(b.collectionId));

  const issuanceModes = Array.from(byMode.entries())
    .map(([mode, packs]) => ({ mode, packs }))
    .sort((a, b) => b.packs - a.packs || a.mode.localeCompare(b.mode));

  const packsByDay = Array.from(byDay.entries())
    .map(([day, packs]) => ({ day, packs }))
    .sort((a, b) => a.day.localeCompare(b.day));

  return {
    totalPacks,
    totalCardsIssued,
    uniqueCollections: packsByCollectionVersion.length,
    uniqueDrops: byDrop.size,
    firstIssuedAt,
    lastIssuedAt,
    scannedEvents,
    issuanceModes,
    topDrops,
    packsByCollectionVersion,
    packsByDay,
  };
}

export default function pixpaxCollectionRoutes(router, options = {}) {
  const createStore = options.createStore || createCollectionContentStoreFromEnv;
  const rngSource = options.rngSource
    ? options.rngSource
    : options.pickRandomIndex
    ? createDelegateRngSource(options.pickRandomIndex)
    : createCryptoRngSource();
  const now = options.now || (() => new Date());
  const appendEventOverride = options.appendEvent || null;
  const allowDevUntrackedPacks =
    options.allowDevUntrackedPacks === true ||
    isTruthyEnv(process.env.PIX_PAX_ALLOW_DEV_UNTRACKED_PACKS) ||
    process.env.NODE_ENV !== "production";
  const issueLedgerEntry =
    options.issueLedgerEntry ||
    (async ({ entryId, entry, issuerKeys }) => {
      const ledger = await ensureIssuerAuditLedger({
        publicKeyPem: issuerKeys.publicKeyPem,
        issuerKeyId: issuerKeys.issuerKeyId,
      });
      if (ledger.options?.disabled) {
        throw new Error("Issuer audit ledger is disabled. Configure LEDGER_* environment variables.");
      }
      return ledger.appendIssuedEntry(entryId, entry);
    });
  let storePromise = null;
  let ledgerReadContextPromise = null;

  async function getStore() {
    if (!storePromise) {
      storePromise = Promise.resolve(createStore());
    }
    return storePromise;
  }

  async function getLedgerReadContext() {
    if (!ledgerReadContextPromise) {
      ledgerReadContextPromise = (async () => {
        const store = await getStore();
        const ledgerPrefix = normalizePathPrefix(process.env.LEDGER_PREFIX, "pixpax/ledger");
        const ledgerBucket = String(process.env.LEDGER_BUCKET || "").trim() || String(store.bucket || "");

        if (ledgerBucket === String(store.bucket || "")) {
          return {
            gateway: store.gateway,
            bucket: ledgerBucket,
            prefix: ledgerPrefix,
          };
        }

        const endpoint = String(process.env.LEDGER_S3_ENDPOINT || "").trim();
        const region = String(process.env.LEDGER_REGION || "lon1").trim();
        const accessKeyId = String(process.env.LEDGER_ACCESS_KEY_ID || "").trim();
        const secretAccessKey = String(process.env.LEDGER_SECRET_ACCESS_KEY || "").trim();
        const forcePathStyle =
          String(process.env.LEDGER_S3_FORCE_PATH_STYLE || "true").toLowerCase() !==
          "false";

        if (!endpoint || !ledgerBucket || !region || !accessKeyId || !secretAccessKey) {
          return null;
        }

        const gateway = await createCollectionContentGateway({
          endpoint,
          region,
          accessKeyId,
          secretAccessKey,
          forcePathStyle,
        });

        return {
          gateway,
          bucket: ledgerBucket,
          prefix: ledgerPrefix,
        };
      })();
    }

    return ledgerReadContextPromise;
  }

  async function emitDomainEvent(type, payload, occurredAt) {
    const event = createPixpaxEvent({
      type,
      payload,
      occurredAt,
      source: "pixpax.collections",
    });
    if (appendEventOverride) {
      await appendEventOverride(event);
      return event;
    }
    const scope = resolveEventCollectionScope(event);
    const store = await getStore();
    await store.putEventIfAbsent(scope.collectionId, scope.version, event);
    return event;
  }

  function requireAdminToken(req, res) {
    const expectedToken = resolveAdminToken();
    if (!expectedToken) {
      res.status(503).send({
        error: "PIX_PAX_ADMIN_TOKEN is not configured.",
      });
      return false;
    }
    const provided = extractBearerToken(req?.headers?.authorization);
    if (!provided || provided !== expectedToken) {
      res.status(401).send({ error: "Unauthorized." });
      return false;
    }
    return true;
  }

  router.put("/v1/pixpax/collections/:collectionId/:version/collection", async (req, res) => {
    if (!requireAdminToken(req, res)) return;
    const validation = validateCollectionPayload(req.body);
    if (!validation.ok) {
      res.status(400).send({ error: "Invalid collection payload.", details: validation.errors });
      return;
    }

    const { collectionId, version } = req.params || {};
    try {
      const store = await getStore();
      try {
        await store.getCollection(collectionId, version);
        res.status(409).send({ error: "collection.json already exists for this version." });
        return;
      } catch (error) {
        if (!String(error?.message || "").startsWith("NoSuchKey:")) {
          throw error;
        }
      }
      await emitDomainEvent(
        PIXPAX_EVENT_TYPES.COLLECTION_CREATED,
        {
          collectionId: String(collectionId),
          version: String(version),
          name: String(req.body?.name || ""),
          gridSize: Number(req.body?.gridSize || 0),
        },
        now().toISOString()
      );
      const result = await store.putCollectionIfAbsent(collectionId, version, req.body);
      if (!result.created) {
        res.status(409).send({ error: "collection.json already exists for this version." });
        return;
      }
      res.status(201).send({
        ok: true,
        collectionId,
        version,
        key: result.key,
      });
    } catch (error) {
      if (missingContentConfigError(error)) {
        res.status(503).send({
          error:
            "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
        });
        return;
      }
      console.error("[pixpax/collections] put collection failed:", error);
      res.status(500).send({ error: "Failed to store collection.json." });
    }
  });

  router.get("/v1/pixpax/collections/:collectionId/:version/collection", async (req, res) => {
    const { collectionId, version } = req.params || {};
    try {
      const store = await getStore();
      const collection = await store.getCollection(collectionId, version);
      res.status(200).send(collection);
    } catch (error) {
      if (missingContentConfigError(error)) {
        res.status(503).send({
          error:
            "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
        });
        return;
      }
      if (String(error?.message || "").startsWith("NoSuchKey:")) {
        res.status(404).send({ error: "Collection content is missing for this version." });
        return;
      }
      console.error("[pixpax/collections] get collection failed:", error);
      res.status(500).send({ error: "Failed to load collection.json." });
    }
  });

  router.post("/v1/pixpax/collections/:collectionId/:version/override-codes", async (req, res) => {
    if (!requireAdminToken(req, res)) return;
    const secret = resolveOverrideCodeSecret();
    if (!secret) {
      res.status(503).send({ error: "PIX_PAX_OVERRIDE_CODE_SECRET is not configured." });
      return;
    }

    const { collectionId, version } = req.params || {};
    const bindToUser = req.body?.bindToUser !== false;
    const normalizedUserKey = canonicalizeUserKey(req.body?.userKey);
    if (bindToUser && !normalizedUserKey) {
      res.status(400).send({ error: "userKey is required when bindToUser=true." });
      return;
    }
    const count = clampPackCardCount(req.body?.count);
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      res.status(400).send({ error: "count must be an integer between 1 and 50." });
      return;
    }
    const issuedAt = now().toISOString();
    const dropId = String(req.body?.dropId || `week-${toIsoWeek(new Date(issuedAt))}`).trim();
    const ttlSeconds = clampOverrideCodeTtlSeconds(req.body?.expiresInSeconds);
    const exp = Math.floor(Date.parse(issuedAt) / 1000) + ttlSeconds;
    const issuedTo = bindToUser ? hashIssuedToUserKey(normalizedUserKey) : null;
    const payload = {
      v: 1,
      codeId: createNonceHex(24),
      collectionId,
      version,
      dropId,
      bindToUser,
      issuedTo,
      count,
      exp,
    };
    const store = await getStore();
    await emitDomainEvent(
      PIXPAX_EVENT_TYPES.GIFTCODE_CREATED,
      {
        codeId: payload.codeId,
        collectionId: String(collectionId),
        version: String(version),
        dropId: payload.dropId,
        count: payload.count,
        bindToUser: payload.bindToUser,
        issuedTo: payload.issuedTo,
      },
      issuedAt
    );
    await store.putOverrideCodeRecord(collectionId, version, payload.codeId, {
      createdAt: issuedAt,
      payload,
    });
    const code = createOverrideCode(payload, secret);
    const giftCode = codeIdToGiftCode(payload.codeId);
    res.status(201).send({
      ok: true,
      code,
      giftCode,
      codeId: payload.codeId,
      collectionId,
      version,
      dropId,
      count,
      bindToUser,
      issuedTo,
      expiresAt: new Date(exp * 1000).toISOString(),
      issuedAt,
    });
  });

  router.put("/v1/pixpax/collections/:collectionId/:version/index", async (req, res) => {
    if (!requireAdminToken(req, res)) return;
    const validation = validateIndexPayload(req.body);
    if (!validation.ok) {
      res.status(400).send({ error: "Invalid index payload.", details: validation.errors });
      return;
    }

    const { collectionId, version } = req.params || {};
    try {
      const store = await getStore();
      try {
        await store.getIndex(collectionId, version);
        res.status(409).send({ error: "index.json already exists for this version." });
        return;
      } catch (error) {
        if (!String(error?.message || "").startsWith("NoSuchKey:")) {
          throw error;
        }
      }
      const seriesIds = Array.isArray(req.body?.series)
        ? req.body.series
            .map((entry) => String(entry?.seriesId || "").trim())
            .filter(Boolean)
        : [];
      await emitDomainEvent(
        PIXPAX_EVENT_TYPES.SERIES_ADDED,
        {
          collectionId: String(collectionId),
          version: String(version),
          seriesIds,
          cardCount: Array.isArray(req.body?.cards) ? req.body.cards.length : 0,
        },
        now().toISOString()
      );
      const result = await store.putIndexIfAbsent(collectionId, version, req.body);
      if (!result.created) {
        res.status(409).send({ error: "index.json already exists for this version." });
        return;
      }
      res.status(201).send({
        ok: true,
        collectionId,
        version,
        key: result.key,
      });
    } catch (error) {
      if (missingContentConfigError(error)) {
        res.status(503).send({
          error:
            "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
        });
        return;
      }
      console.error("[pixpax/collections] put index failed:", error);
      res.status(500).send({ error: "Failed to store index.json." });
    }
  });

  router.get("/v1/pixpax/collections/:collectionId/:version/index", async (req, res) => {
    const { collectionId, version } = req.params || {};
    try {
      const store = await getStore();
      const index = await store.getIndex(collectionId, version);
      res.status(200).send(index);
    } catch (error) {
      if (missingContentConfigError(error)) {
        res.status(503).send({
          error:
            "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
        });
        return;
      }
      if (String(error?.message || "").startsWith("NoSuchKey:")) {
        res.status(404).send({ error: "Collection content is missing for this version." });
        return;
      }
      console.error("[pixpax/collections] get index failed:", error);
      res.status(500).send({ error: "Failed to load index.json." });
    }
  });

  router.post(
    "/v1/pixpax/collections/:collectionId/:version/series/:seriesId/retire",
    async (req, res) => {
      if (!requireAdminToken(req, res)) return;
      const { collectionId, version, seriesId } = req.params || {};
      const normalizedSeriesId = String(seriesId || "").trim();
      if (!normalizedSeriesId) {
        res.status(400).send({ error: "seriesId is required." });
        return;
      }

      try {
        const store = await getStore();
        const index = await store.getIndex(collectionId, version);
        const declaredSeriesIds = new Set(
          (Array.isArray(index?.series) ? index.series : [])
            .map((entry) => String(entry?.seriesId || "").trim())
            .filter(Boolean)
        );
        if (!declaredSeriesIds.has(normalizedSeriesId)) {
          res.status(404).send({ error: "Unknown series for collection/version." });
          return;
        }

        const events = await store.replayEvents(collectionId, version);
        const snapshot = rebuildCollectionSnapshotFromEvents(events);
        if ((snapshot.retiredSeriesIds || []).includes(normalizedSeriesId)) {
          res.status(409).send({ error: "Series is already retired." });
          return;
        }

        const occurredAt = now().toISOString();
        const reason = String(req.body?.reason || "").trim();
        const event = await emitDomainEvent(
          PIXPAX_EVENT_TYPES.SERIES_RETIRED,
          {
            collectionId: String(collectionId),
            version: String(version),
            seriesId: normalizedSeriesId,
            ...(reason ? { reason } : {}),
          },
          occurredAt
        );
        res.status(201).send({
          ok: true,
          collectionId,
          version,
          seriesId: normalizedSeriesId,
          retiredAt: occurredAt,
          eventId: event.eventId,
        });
      } catch (error) {
        if (missingContentConfigError(error)) {
          res.status(503).send({
            error:
              "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
          });
          return;
        }
        if (String(error?.message || "").startsWith("NoSuchKey:")) {
          res.status(404).send({ error: "Collection content is missing for this version." });
          return;
        }
        console.error("[pixpax/collections] retire series failed:", error);
        res.status(500).send({ error: "Failed to retire series." });
      }
    }
  );

  router.get("/v1/pixpax/collections/:collectionId/:version/bundle", async (req, res) => {
    const { collectionId, version } = req.params || {};
    try {
      const store = await getStore();
      const [collection, index] = await Promise.all([
        store.getCollection(collectionId, version),
        store.getIndex(collectionId, version),
      ]);

      const cardIds = Array.isArray(index?.cards)
        ? index.cards.map((value) => String(value || "").trim()).filter(Boolean)
        : [];

      const missingCardIds = [];
      const cardRows = await mapWithConcurrency(cardIds, 16, async (cardId) => {
        try {
          const card = await store.getCard(collectionId, version, cardId);
          return {
            ...card,
            cardId,
          };
        } catch (error) {
          if (String(error?.message || "").startsWith("NoSuchKey:")) {
            missingCardIds.push(cardId);
            return null;
          }
          throw error;
        }
      });

      res.status(200).send({
        collection,
        index,
        cards: cardRows.filter(Boolean),
        missingCardIds: missingCardIds.sort((a, b) => a.localeCompare(b)),
      });
    } catch (error) {
      if (missingContentConfigError(error)) {
        res.status(503).send({
          error:
            "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
        });
        return;
      }
      if (String(error?.message || "").startsWith("NoSuchKey:")) {
        res.status(404).send({ error: "Collection content is missing for this version." });
        return;
      }
      console.error("[pixpax/collections] get bundle failed:", error);
      res.status(500).send({ error: "Failed to load collection bundle." });
    }
  });

  router.put(
    "/v1/pixpax/collections/:collectionId/:version/cards/:cardId",
    async (req, res) => {
      if (!requireAdminToken(req, res)) return;

      const { collectionId, version, cardId } = req.params || {};

      try {
        const store = await getStore();
        let collection;
        try {
          collection = await store.getCollection(collectionId, version);
        } catch (error) {
          if (String(error?.message || "").startsWith("NoSuchKey:")) {
            res.status(404).send({
              error: "collection.json must be uploaded first for this version.",
            });
            return;
          }
          throw error;
        }

        const validation = validateCardPayload(req.body, cardId, collection?.gridSize);
        if (!validation.ok) {
          res.status(400).send({ error: "Invalid card payload.", details: validation.errors });
          return;
        }
        try {
          await store.getCard(collectionId, version, cardId);
          res.status(409).send({ error: "card already exists for this version/cardId." });
          return;
        } catch (error) {
          if (!String(error?.message || "").startsWith("NoSuchKey:")) {
            throw error;
          }
        }
        await emitDomainEvent(
          PIXPAX_EVENT_TYPES.CARD_ADDED,
          {
            collectionId: String(collectionId),
            version: String(version),
            cardId: String(cardId),
            seriesId: req.body?.seriesId ? String(req.body.seriesId) : null,
          },
          now().toISOString()
        );
        const result = await store.putCardIfAbsent(collectionId, version, cardId, req.body);
        if (!result.created) {
          res.status(409).send({ error: "card already exists for this version/cardId." });
          return;
        }

        res.status(201).send({
          ok: true,
          collectionId,
          version,
          cardId,
          key: result.key,
        });
      } catch (error) {
        if (missingContentConfigError(error)) {
          res.status(503).send({
            error:
              "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
          });
          return;
        }
        console.error("[pixpax/collections] put card failed:", error);
        res.status(500).send({ error: "Failed to store card JSON." });
      }
    }
  );

  router.get("/v1/pixpax/collections/:collectionId/:version/cards/:cardId", async (req, res) => {
    const { collectionId, version, cardId } = req.params || {};
    try {
      const store = await getStore();
      const card = await store.getCard(collectionId, version, cardId);
      res.status(200).send(card);
    } catch (error) {
      if (missingContentConfigError(error)) {
        res.status(503).send({
          error:
            "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
        });
        return;
      }
      if (String(error?.message || "").startsWith("NoSuchKey:")) {
        res.status(404).send({ error: "Card content is missing for this version/cardId." });
        return;
      }
      console.error("[pixpax/collections] get card failed:", error);
      res.status(500).send({ error: "Failed to load card JSON." });
    }
  });

  router.get("/v1/pixpax/analytics/packs", async (req, res) => {
    const collectionIdFilter = String(req.query?.collectionId || "").trim();
    const versionFilter = String(req.query?.version || "").trim();
    const dropIdFilter = String(req.query?.dropId || "").trim();
    const rawLimit = String(req.query?.limit || "").trim();
    const limit = rawLimit ? parsePositiveInt(rawLimit, 2000, 50000) : null;
    const includeCardIds =
      String(req.query?.includeCardIds || "true").trim().toLowerCase() !== "false";

    try {
      const store = await getStore();
      if (typeof store?.gateway?.listObjects !== "function") {
        res.status(503).send({
          error: "Content store gateway does not support listObjects analytics.",
        });
        return;
      }

      const maxScanKeys = parsePositiveInt(req.query?.maxScanKeys, 50000, 200000);
      const contentPrefix = `${store.prefix}/`;
      const eventRefs = [];
      let contentCursor = null;

      do {
        const listed = await store.gateway.listObjects({
          bucket: store.bucket,
          prefix: contentPrefix,
          cursor: contentCursor,
          maxKeys: 1000,
        });
        const keys = Array.isArray(listed?.keys) ? listed.keys : [];
        for (const key of keys) {
          const scope = parseEventScopeFromKey(store.prefix, key);
          if (!scope) continue;
          if (collectionIdFilter && scope.collectionId !== collectionIdFilter) continue;
          if (versionFilter && scope.version !== versionFilter) continue;
          eventRefs.push({ key, scope });
          if (eventRefs.length >= maxScanKeys) break;
        }
        if (eventRefs.length >= maxScanKeys) break;
        contentCursor = listed?.nextCursor || null;
      } while (contentCursor);

      const loadedEvents = await mapWithConcurrency(eventRefs, 24, async (ref) => {
        try {
          const bytes = await store.gateway.getObject({
            bucket: store.bucket,
            key: ref.key,
          });
          const parsed = JSON.parse(Buffer.from(bytes).toString("utf8"));
          return {
            event: parsed,
            collectionId: ref.scope.collectionId,
            version: ref.scope.version,
          };
        } catch {
          return null;
        }
      });

      const eventPackRows = loadedEvents
        .filter(Boolean)
        .filter((entry) => entry?.event?.type === PIXPAX_EVENT_TYPES.PACK_ISSUED)
        .map((entry) =>
          buildPackAnalyticsRow({
            payload: entry.event?.payload || {},
            collectionId: entry.collectionId,
            version: entry.version,
            occurredAt: entry.event?.occurredAt,
            source: "collection-events",
            eventId: entry.event?.eventId,
            includeCardIds,
          })
        );

      const ledgerContext = await getLedgerReadContext();
      const segmentRefs = [];
      let ledgerEventsScanned = 0;
      let ledgerSegmentsInvalid = 0;
      let ledgerCursor = null;
      let ledgerPrefix = null;

      if (ledgerContext?.gateway && typeof ledgerContext.gateway.listObjects === "function") {
        ledgerPrefix = `${normalizePathPrefix(ledgerContext.prefix, "pixpax/ledger")}/segments/`;
        do {
          const listed = await ledgerContext.gateway.listObjects({
            bucket: ledgerContext.bucket,
            prefix: ledgerPrefix,
            cursor: ledgerCursor,
            maxKeys: 1000,
          });
          const keys = Array.isArray(listed?.keys) ? listed.keys : [];
          for (const key of keys) {
            if (!String(key).endsWith(".jsonl.gz")) continue;
            segmentRefs.push(key);
            if (segmentRefs.length >= maxScanKeys) break;
          }
          if (segmentRefs.length >= maxScanKeys) break;
          ledgerCursor = listed?.nextCursor || null;
        } while (ledgerCursor);
      }

      const segmentPackRowsNested = await mapWithConcurrency(
        segmentRefs,
        12,
        async (segmentKey) => {
          try {
            const compressed = await ledgerContext.gateway.getObject({
              bucket: ledgerContext.bucket,
              key: segmentKey,
            });
            const unzipped = gunzipSync(Buffer.from(compressed));
            const parsed = parseSegmentJsonl(unzipped.toString("utf8"));
            const rows = [];
            for (const event of parsed.events || []) {
              ledgerEventsScanned += 1;
              const entry = event?.entry || {};
              const payload = entry?.payload || {};
              if (entry?.kind !== "pack.issued") continue;
              const row = buildPackAnalyticsRow({
                payload,
                occurredAt: entry?.timestamp || parsed?.meta?.createdAt || null,
                source: "ledger-segment",
                eventId: event?.entryId || null,
                includeCardIds,
              });
              if (!row.collectionId || !row.collectionVersion || !row.packId) {
                continue;
              }
              if (collectionIdFilter && row.collectionId !== collectionIdFilter) continue;
              if (versionFilter && row.collectionVersion !== versionFilter) continue;
              rows.push(row);
            }
            return rows;
          } catch {
            ledgerSegmentsInvalid += 1;
            return [];
          }
        }
      );

      const segmentPackRows = segmentPackRowsNested.flat();

      const packRows = dedupePackRows(
        [...eventPackRows, ...segmentPackRows]
          .filter((row) => row.packId && row.collectionId && row.collectionVersion)
          .filter((row) => (dropIdFilter ? row.dropId === dropIdFilter : true))
      );

      packRows.sort((a, b) => {
        const byIssuedAt = String(b.issuedAt || "").localeCompare(String(a.issuedAt || ""));
        if (byIssuedAt !== 0) return byIssuedAt;
        return String(a.packId || "").localeCompare(String(b.packId || ""));
      });

      const insights = summarizePackAnalytics(
        packRows,
        loadedEvents.filter(Boolean).length + ledgerEventsScanned
      );
      const packs = Number.isFinite(limit) ? packRows.slice(0, limit) : packRows;

      res.status(200).send({
        ok: true,
        filters: {
          collectionId: collectionIdFilter || null,
          version: versionFilter || null,
          dropId: dropIdFilter || null,
        },
        scan: {
          prefix: contentPrefix,
          ledgerPrefix: ledgerPrefix || null,
          scannedEventKeys: eventRefs.length,
          scannedEvents: loadedEvents.filter(Boolean).length,
          invalidEventPayloads: loadedEvents.length - loadedEvents.filter(Boolean).length,
          scannedLedgerSegments: segmentRefs.length,
          scannedLedgerEvents: ledgerEventsScanned,
          invalidLedgerSegments: ledgerSegmentsInvalid,
        },
        insights,
        packsTotal: packRows.length,
        packsReturned: packs.length,
        truncated: packs.length < packRows.length,
        packs,
      });
    } catch (error) {
      if (missingContentConfigError(error)) {
        res.status(503).send({
          error:
            "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
        });
        return;
      }
      console.error("[pixpax/collections] analytics packs failed:", error);
      res.status(500).send({ error: "Failed to load PixPax analytics." });
    }
  });

  router.get(
    "/v1/pixpax/collections/:collectionId/:version/packs/:packId/verify",
    async (req, res) => {
      const { collectionId, version, packId } = req.params || {};
      try {
        const store = await getStore();
        const result = await verifyPack({
          store,
          packId: String(packId || ""),
          collectionId: String(collectionId || ""),
          version: String(version || ""),
        });
        if (result.ok) {
          res.status(200).send(result);
          return;
        }
        if (result.reason === "pack-not-found") {
          res.status(404).send(result);
          return;
        }
        res.status(422).send(result);
      } catch (error) {
        if (missingContentConfigError(error)) {
          res.status(503).send({
            error:
              "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
          });
          return;
        }
        if (String(error?.message || "").startsWith("NoSuchKey:")) {
          res.status(404).send({ error: "Collection content is missing for this version." });
          return;
        }
        console.error("[pixpax/collections] verify pack failed:", error);
        res.status(500).send({ error: "Failed to verify pack." });
      }
    }
  );

  router.post("/v1/pixpax/collections/:collectionId/:version/packs", async (req, res) => {
    const { collectionId, version } = req.params || {};
    const rawUserKey = req.body?.userKey;
    const normalizedUserKey = canonicalizeUserKey(rawUserKey);
    const requestedIssuanceMode = String(req.body?.issuanceMode || "").trim().toLowerCase();
    const wantsDevUntrackedPack = requestedIssuanceMode === "dev-untracked";
    const overrideCodeRaw = String(req.body?.overrideCode || "").trim();
    const wantsOverride = req.body?.override === true;
    const issuedAt = now().toISOString();
    const nowSeconds = Math.floor(Date.parse(issuedAt) / 1000);
    const requestedDropId = String(req.body?.dropId || "").trim();

    if (!normalizedUserKey) {
      res.status(400).send({ error: "userKey is required." });
      return;
    }

    try {
      const store = await getStore();

      let overridePayload = null;
      if (overrideCodeRaw) {
        const giftCodeId = giftCodeToCodeId(overrideCodeRaw);
        if (giftCodeId) {
          try {
            const codeRecord = await store.getOverrideCodeRecord(collectionId, version, giftCodeId);
            overridePayload = codeRecord?.payload || null;
            if (!overridePayload) {
              res.status(400).send({ error: "Invalid override code." });
              return;
            }
            if (!Number.isInteger(overridePayload.exp) || overridePayload.exp <= nowSeconds) {
              res.status(400).send({ error: "Override code is expired." });
              return;
            }
          } catch (error) {
            if (String(error?.message || "").startsWith("NoSuchKey:")) {
              res.status(400).send({ error: "Invalid override code." });
              return;
            }
            throw error;
          }
        } else {
          const secret = resolveOverrideCodeSecret();
          if (!secret) {
            res.status(503).send({ error: "PIX_PAX_OVERRIDE_CODE_SECRET is not configured." });
            return;
          }
          try {
            overridePayload = parseOverrideCode(overrideCodeRaw, secret, nowSeconds);
          } catch (error) {
            res.status(400).send({ error: error?.message || "Invalid override code." });
            return;
          }
        }
      }

      const issuancePolicy = resolveIssuancePolicy({
        wantsDevUntrackedPack,
        wantsOverride,
        overrideCodeRaw,
        overridePayload,
        allowDevUntrackedPacks,
        requestedDropId,
        requestedCount: req.body?.count,
        issuedAt,
        clampPackCardCount,
        defaultPackCount: DEFAULT_PACK_COUNT,
      });
      if (issuancePolicy.requiresAdmin && !requireAdminToken(req, res)) return;

      const issuedTo = hashIssuedToUserKey(normalizedUserKey);
      const beforeIssue = await issuancePolicy.beforeIssue({
        store,
        collectionId,
        version,
        issuedTo,
      });
      if (beforeIssue?.reusedResponse) {
        res.status(200).send(beforeIssue.reusedResponse);
        return;
      }

      const dropId = issuancePolicy.dropId;
      const count = issuancePolicy.count;
      const index = await store.getIndex(collectionId, version);
      const allCardIds = Array.isArray(index?.cards)
        ? index.cards.map((cardId) => String(cardId || "").trim()).filter(Boolean)
        : [];
      if (!allCardIds.length) {
        res.status(422).send({ error: "Collection index has no cards." });
        return;
      }
      const events = await store.replayEvents(collectionId, version);
      const snapshot = rebuildCollectionSnapshotFromEvents(events);
      const retiredSeriesIds = new Set(
        (Array.isArray(snapshot?.retiredSeriesIds) ? snapshot.retiredSeriesIds : [])
          .map((seriesId) => String(seriesId || "").trim())
          .filter(Boolean)
      );
      const cardPool = allCardIds.filter((cardId) => {
        if (!retiredSeriesIds.size) return true;
        const seriesId = String(index?.cardMap?.[cardId]?.seriesId || "").trim();
        return !seriesId || !retiredSeriesIds.has(seriesId);
      });
      if (!cardPool.length) {
        res.status(422).send({ error: "All series are retired for this collection version." });
        return;
      }

      // With replacement, matching stickerbook behavior.
      const selectedCardIds = new Array(count)
        .fill(null)
        .map((_, slotIndex) =>
          cardPool[
            rngSource.nextInt(cardPool.length, {
              collectionId,
              version,
              dropId,
              slotIndex,
              count,
            })
          ]
        );

      const cards = await mapWithConcurrency(selectedCardIds, 8, async (cardId) => {
        const card = await store.getCard(collectionId, version, cardId);
        return {
          cardId,
          seriesId: card?.seriesId ?? null,
          slotIndex: card?.slotIndex ?? null,
          role: card?.role ?? null,
          renderPayload: card?.renderPayload || null,
        };
      });

      const itemHashes = cards.map((card) =>
        hashAlbumCard({
          collectionId,
          collectionVersion: version,
          cardId: card.cardId,
          renderPayload: card.renderPayload || {},
        })
      );
      const packRoot = computeMerkleRootFromItemHashes(itemHashes);
      const packId = createNonceHex(24);
      const contentsCommitment = hashCanonical({
        itemHashes,
        count: cards.length,
        packRoot,
      });

      let entry = null;
      let issuerKeys = null;
      let appendResult = null;
      const payload = {
        type: "pack.issued",
        packModel: PACK_MODELS.ALBUM,
        packId,
        issuedAt,
        issuerKeyId: null,
        issuedBy: issuancePolicy.untracked ? "dev-untracked" : null,
        issuedTo,
        userKeyHash: issuedTo,
        dropId,
        collectionId,
        collectionVersion: version,
        cardIds: selectedCardIds,
        count: selectedCardIds.length,
        packRoot,
        itemHashes,
        contentsCommitment,
      };

      if (!issuancePolicy.untracked) {
        issuerKeys = await loadIssuerKeys();
        payload.issuerKeyId = issuerKeys.issuerKeyId;
        payload.issuedBy = issuerKeys.author;
        const entryCore = {
          kind: "pack.issued",
          timestamp: issuedAt,
          author: issuerKeys.author,
          payload,
        };
        const signature = await signPayload(
          issuerKeys.privateKeyPem,
          getEntrySigningPayload(entryCore)
        );
        entry = { ...entryCore, signature };
      } else {
        entry = {
          kind: "pack.issued",
          timestamp: issuedAt,
          author: "dev-untracked",
          payload,
          signature: "",
        };
      }

      await emitDomainEvent(
        PIXPAX_EVENT_TYPES.PACK_ISSUED,
        {
          packId,
          collectionId: String(collectionId),
          collectionVersion: String(version),
          dropId,
          issuedTo,
          cardIds: selectedCardIds,
          count: cards.length,
          packRoot,
          itemHashes,
          contentsCommitment,
          issuerKeyId: payload.issuerKeyId || null,
          issuerAuthor: entry?.author || null,
          issuerSignature: entry?.signature || null,
          entryTimestamp: entry?.timestamp || issuedAt,
          signedEntryPayload: payload,
          issuanceMode: issuancePolicy.mode,
          untracked: issuancePolicy.untracked,
        },
        issuedAt
      );

      if (!issuancePolicy.untracked && entry && issuerKeys) {
        try {
          const entryId = await deriveEntryId(entry);
          appendResult = await issueLedgerEntry({ entryId, entry, issuerKeys });
        } catch (ledgerError) {
          console.error("[pixpax/collections] issue ledger append failed:", ledgerError);
        }
      }

      const responsePayload = {
        packId,
        packModel: PACK_MODELS.ALBUM,
        collectionId,
        collectionVersion: version,
        dropId,
        issuedAt,
        entry,
        cards,
        receipt: {
          segmentKey: appendResult?.segmentKey || null,
          segmentHash: appendResult?.segmentHash || null,
        },
        packRoot,
        itemHashes,
      };

      const afterIssue = await issuancePolicy.afterIssue({
        store,
        collectionId,
        version,
        issuedTo,
        issuedAt,
        packId,
        dropId,
        cardsCount: cards.length,
        responsePayload,
        emitEvent: async (type, payloadValue) =>
          emitDomainEvent(type, payloadValue, issuedAt),
      });
      if (afterIssue?.reusedResponse) {
        res.status(200).send(afterIssue.reusedResponse);
        return;
      }

      res.status(200).send({
        ...responsePayload,
        issuance: {
          mode: issuancePolicy.mode,
          reused: false,
          override: issuancePolicy.override,
          untracked: issuancePolicy.untracked,
          codeId: issuancePolicy.codeId || null,
          bindToUser: issuancePolicy.bindToUser ?? null,
          dropId,
        },
      });
    } catch (error) {
      if (error instanceof IssuancePolicyError) {
        res.status(error.statusCode).send(error.payload);
        return;
      }
      if (missingContentConfigError(error)) {
        res.status(503).send({
          error:
            "Content store configuration is incomplete. Use LEDGER_* connection vars and LEDGER_CONTENT_PREFIX.",
        });
        return;
      }
      if (String(error?.message || "").startsWith("NoSuchKey:")) {
        res.status(404).send({ error: "Collection content is missing for this version." });
        return;
      }
      console.error("[pixpax/collections] issue album pack failed:", error);
      res.status(500).send({ error: "Failed to issue album pack." });
    }
  });
}

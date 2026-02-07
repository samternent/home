import { createCollectionContentStoreFromEnv } from "./content-store.mjs";
import { PACK_MODELS } from "../models/pack-models.mjs";
import { createNonceHex, hashCanonical } from "../../stickerbook/stickerbook-utils.mjs";
import { deriveEntryId, getEntrySigningPayload } from "@ternent/concord-protocol";
import { createHash, createHmac, timingSafeEqual, webcrypto } from "node:crypto";
import {
  ensureIssuerAuditLedger,
  loadIssuerKeys,
} from "../../stickerbook/index.mjs";
import {
  validateCardPayload,
  validateCollectionPayload,
  validateIndexPayload,
} from "./validation.mjs";
import {
  computeMerkleRootFromItemHashes,
  hashAlbumCard,
} from "./curated-hashing.mjs";

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

function randomIndex(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) return 0;
  return Math.floor(Math.random() * maxExclusive);
}

function clampPackCardCount(value) {
  const count = Number(value ?? 5);
  if (!Number.isFinite(count)) return 5;
  return Math.trunc(count);
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

export default function pixpaxCollectionRoutes(router, options = {}) {
  const createStore = options.createStore || createCollectionContentStoreFromEnv;
  const pickRandomIndex = options.pickRandomIndex || randomIndex;
  const now = options.now || (() => new Date());
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

  async function getStore() {
    if (!storePromise) {
      storePromise = Promise.resolve(createStore());
    }
    return storePromise;
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

  router.post("/v1/pixpax/collections/:collectionId/:version/packs", async (req, res) => {
    const { collectionId, version } = req.params || {};
    const rawUserKey = req.body?.userKey;
    const normalizedUserKey = canonicalizeUserKey(rawUserKey);
    const overrideCode = String(req.body?.overrideCode || "").trim();
    const wantsOverride = req.body?.override === true;
    if (wantsOverride && overrideCode) {
      res.status(400).send({ error: "Provide either override=true or overrideCode, not both." });
      return;
    }
    if (wantsOverride && !requireAdminToken(req, res)) return;
    const issuedAt = now().toISOString();
    const nowSeconds = Math.floor(Date.parse(issuedAt) / 1000);
    const requestedDropId = String(req.body?.dropId || "").trim();

    if (!normalizedUserKey) {
      res.status(400).send({ error: "userKey is required." });
      return;
    }
    let overridePayload = null;
    if (overrideCode) {
      const giftCodeId = giftCodeToCodeId(overrideCode);
      if (giftCodeId) {
        try {
          const store = await getStore();
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
          overridePayload = parseOverrideCode(overrideCode, secret, nowSeconds);
        } catch (error) {
          res.status(400).send({ error: error?.message || "Invalid override code." });
          return;
        }
      }
    }
    const dropId = overridePayload
      ? String(overridePayload.dropId)
      : String(requestedDropId || `week-${toIsoWeek(new Date(issuedAt))}`).trim();
    if (overridePayload && requestedDropId && requestedDropId !== dropId) {
      res.status(400).send({ error: "dropId does not match override code." });
      return;
    }
    const count = overridePayload
      ? Number(overridePayload.count)
      : wantsOverride
      ? clampPackCardCount(req.body?.count)
      : DEFAULT_PACK_COUNT;
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      res.status(400).send({ error: "count must be an integer between 1 and 50." });
      return;
    }

    try {
      const store = await getStore();
      const issuedTo = hashIssuedToUserKey(normalizedUserKey);
      if (overridePayload) {
        if (
          String(overridePayload.collectionId) !== String(collectionId) ||
          String(overridePayload.version) !== String(version)
        ) {
          res.status(403).send({ error: "Override code scope does not match collection/version." });
          return;
        }
        if (overridePayload.bindToUser && String(overridePayload.issuedTo) !== issuedTo) {
          res.status(403).send({ error: "Override code is not valid for this user." });
          return;
        }
        try {
          const existingUse = await store.getOverrideCodeUse(collectionId, version, overridePayload.codeId);
          if (existingUse) {
            res.status(409).send({
              error: "Override code has already been used.",
              codeId: overridePayload.codeId,
              usedAt: existingUse.usedAt || null,
              packId: existingUse.packId || null,
            });
            return;
          }
        } catch (error) {
          if (!String(error?.message || "").startsWith("NoSuchKey:")) throw error;
        }
      }
      if (!wantsOverride && !overridePayload) {
        try {
          const existingClaim = await store.getPackClaim(collectionId, version, dropId, issuedTo);
          if (existingClaim?.response) {
            res.status(200).send({
              ...existingClaim.response,
              issuance: {
                mode: "weekly",
                reused: true,
                override: false,
                dropId,
              },
            });
            return;
          }
        } catch (error) {
          if (!String(error?.message || "").startsWith("NoSuchKey:")) {
            throw error;
          }
        }
      }
      const index = await store.getIndex(collectionId, version);
      const cardPool = Array.isArray(index?.cards)
        ? index.cards.map((cardId) => String(cardId || "").trim()).filter(Boolean)
        : [];
      if (!cardPool.length) {
        res.status(422).send({ error: "Collection index has no cards." });
        return;
      }

      // With replacement, matching stickerbook behavior.
      const selectedCardIds = new Array(count)
        .fill(null)
        .map(() => cardPool[pickRandomIndex(cardPool.length)]);

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

      const issuerKeys = await loadIssuerKeys();
      const payload = {
        type: "pack.issued",
        packModel: PACK_MODELS.ALBUM,
        packId,
        issuedAt,
        issuerKeyId: issuerKeys.issuerKeyId,
        issuedBy: issuerKeys.author,
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
      const entry = { ...entryCore, signature };
      const entryId = await deriveEntryId(entry);
      const appendResult = await issueLedgerEntry({ entryId, entry, issuerKeys });
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

      if (overridePayload) {
        const codeUseResult = await store.putOverrideCodeUseIfAbsent(
          collectionId,
          version,
          overridePayload.codeId,
          {
            usedAt: issuedAt,
            packId,
            dropId,
            issuedTo,
            count: cards.length,
          }
        );
        if (!codeUseResult.created) {
          const existingUse = await store.getOverrideCodeUse(collectionId, version, overridePayload.codeId);
          res.status(409).send({
            error: "Override code has already been used.",
            codeId: overridePayload.codeId,
            usedAt: existingUse?.usedAt || null,
            packId: existingUse?.packId || null,
          });
          return;
        }
      } else if (!wantsOverride) {
        const claimResult = await store.putPackClaimIfAbsent(
          collectionId,
          version,
          dropId,
          issuedTo,
          {
            createdAt: issuedAt,
            response: responsePayload,
          }
        );
        if (!claimResult.created) {
          const existingClaim = await store.getPackClaim(collectionId, version, dropId, issuedTo);
          if (existingClaim?.response) {
            res.status(200).send({
              ...existingClaim.response,
              issuance: {
                mode: "weekly",
                reused: true,
                override: false,
                dropId,
              },
            });
            return;
          }
        }
      }

      res.status(200).send({
        ...responsePayload,
        issuance: {
          mode: overridePayload ? "override-code" : wantsOverride ? "override" : "weekly",
          reused: false,
          override: wantsOverride || !!overridePayload,
          codeId: overridePayload?.codeId || null,
          bindToUser: overridePayload?.bindToUser ?? null,
          dropId,
        },
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
      console.error("[pixpax/collections] issue album pack failed:", error);
      res.status(500).send({ error: "Failed to issue album pack." });
    }
  });
}

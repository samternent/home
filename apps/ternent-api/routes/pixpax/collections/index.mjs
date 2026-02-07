import { createCollectionContentStoreFromEnv } from "./content-store.mjs";
import { PACK_MODELS } from "../models/pack-models.mjs";
import { createNonceHex, hashCanonical } from "../../stickerbook/stickerbook-utils.mjs";
import { deriveEntryId, getEntrySigningPayload } from "@ternent/concord-protocol";
import { createHash, webcrypto } from "node:crypto";
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

  router.post("/v1/pixpax/collections/:collectionId/:version/packs", async (req, res) => {
    const { collectionId, version } = req.params || {};
    const rawUserKey = req.body?.userKey;
    const normalizedUserKey = canonicalizeUserKey(rawUserKey);
    const count = clampPackCardCount(req.body?.count);
    const issuedAt = now().toISOString();
    const dropId = String(req.body?.dropId || `week-${toIsoWeek(new Date(issuedAt))}`).trim();

    if (!normalizedUserKey) {
      res.status(400).send({ error: "userKey is required." });
      return;
    }
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      res.status(400).send({ error: "count must be an integer between 1 and 50." });
      return;
    }

    try {
      const store = await getStore();
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
      const issuedTo = hashIssuedToUserKey(normalizedUserKey);
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

      res.status(200).send({
        packId,
        packModel: PACK_MODELS.ALBUM,
        collectionId,
        collectionVersion: version,
        dropId,
        issuedAt,
        cards,
        receipt: {
          segmentKey: appendResult?.segmentKey || null,
          segmentHash: appendResult?.segmentHash || null,
        },
        packRoot,
        itemHashes,
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

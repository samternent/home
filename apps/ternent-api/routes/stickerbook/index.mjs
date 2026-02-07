import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  webcrypto,
} from "crypto";
import { deriveEntryId } from "@ternent/concord-protocol";
import {
  computeMerkleRoot,
  createNonceHex,
  deriveDeterministicPackId,
  deriveDeterministicPackRequestId,
  deriveKitFromCatalogue,
  derivePackSeed,
  deriveWeeklyDropSeed,
  deriveWeeklyStickerSeed,
  deriveWeeklyUserSeed,
  generatePack,
  hashCanonical,
  getSigningPayload,
} from "./stickerbook-utils.mjs";
import {
  IssuerAuditLedger,
  createLedgerConfigFromEnv,
  createS3Gateway,
  deriveIssuerKeyIdFromPublicKey,
  ensurePublicKeyPem,
  validateTrustedIssuerKeysAtStartup,
} from "./issuer-audit-ledger.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ISSUER_PENDING_PATH = "persisted/stickerbook/issuer-pending.json";
const ALGO_VERSION = "1.0.0";
const WEEK_SECONDS = 7 * 24 * 60 * 60;

let issuerAuditLedger = null;

function getNextWeeklyDropAt(now = new Date()) {
  const utcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const day = now.getUTCDay();
  let daysUntil = (7 - day) % 7;
  if (daysUntil === 0) daysUntil = 7;
  return new Date(utcMidnight + daysUntil * 24 * 60 * 60 * 1000);
}

export function toIsoWeek(isoDate = new Date()) {
  const date = new Date(
    Date.UTC(isoDate.getUTCFullYear(), isoDate.getUTCMonth(), isoDate.getUTCDate())
  );
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function stripIdentityKey(key) {
  return key
    .replace("-----BEGIN PUBLIC KEY-----\n", "")
    .replace("\n-----END PUBLIC KEY-----", "");
}

function normalizePem(pem) {
  if (!pem) return pem;
  const normalized = pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
  return normalized.trim() + "\n";
}

function derivePublicKeyPem(privateKeyPem) {
  const privateKey = createPrivateKey(normalizePem(privateKeyPem));
  return createPublicKey(privateKey).export({ type: "spki", format: "pem" });
}

function pemToDer(pem) {
  const stripped = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replaceAll("\n", "");
  return Buffer.from(stripped, "base64");
}

async function signPayload(privateKeyPem, payload) {
  const pkcs8 = pemToDer(normalizePem(privateKeyPem));
  const subtle = webcrypto?.subtle || globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("WebCrypto subtle is not available.");
  }
  const key = await subtle.importKey(
    "pkcs8",
    pkcs8,
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

function loadCatalogue(seriesId) {
  const filename = `series-${seriesId}.catalogue.json`;
  const filepath = join(
    __dirname,
    "..",
    "..",
    "persisted/stickerbook",
    "series",
    filename
  );
  return JSON.parse(readFileSync(filepath, "utf8"));
}

function loadIndex() {
  const filepath = join(
    __dirname,
    "..",
    "..",
    "persisted/stickerbook",
    "index.json"
  );
  return JSON.parse(readFileSync(filepath, "utf8"));
}

function loadPendingIssuances() {
  const filepath = join(__dirname, "..", "..", ISSUER_PENDING_PATH);
  if (!existsSync(filepath)) return {};
  return JSON.parse(readFileSync(filepath, "utf8"));
}

function savePendingIssuances(pending) {
  const filepath = join(__dirname, "..", "..", ISSUER_PENDING_PATH);
  writeFileSync(filepath, JSON.stringify(pending, null, 2));
}

export async function loadIssuerKeys() {
  const privateKeyPem = normalizePem(process.env.ISSUER_PRIVATE_KEY_PEM);
  if (!privateKeyPem) {
    throw new Error("ISSUER_PRIVATE_KEY_PEM is required.");
  }
  const publicKeyPem = derivePublicKeyPem(privateKeyPem);
  const author = stripIdentityKey(publicKeyPem);
  const issuerKeyId =
    process.env.ISSUER_KEY_ID || deriveIssuerKeyIdFromPublicKey(publicKeyPem);

  return { privateKeyPem, publicKeyPem, author, issuerKeyId };
}

export async function ensureIssuerAuditLedger(keys) {
  if (issuerAuditLedger) return issuerAuditLedger;

  const config = createLedgerConfigFromEnv({
    currentIssuerKeyId: keys.issuerKeyId,
    currentIssuerPublicKeyPem: keys.publicKeyPem,
  });

  if (!config.ready) {
    console.warn(
      "[pixpax-ledger] disabled: missing LEDGER_* environment configuration"
    );
    issuerAuditLedger = new IssuerAuditLedger({
      disabled: true,
      bucket: "",
      prefix: config.prefix,
      flushMaxEvents: config.flushMaxEvents,
      flushIntervalMs: config.flushIntervalMs,
      flushSyncOnIssue: config.flushSyncOnIssue,
      trustedIssuerPublicKeysJson: config.trustedIssuerPublicKeysJson,
      currentIssuerKeyId: keys.issuerKeyId,
      currentIssuerPublicKeyPem: keys.publicKeyPem,
      gateway: {
        async getObject() {
          throw new Error("Ledger is disabled.");
        },
        async putObject() {
          throw new Error("Ledger is disabled.");
        },
      },
    });
    return issuerAuditLedger;
  }

  const gateway = await createS3Gateway(config);
  issuerAuditLedger = new IssuerAuditLedger({
    disabled: false,
    bucket: config.bucket,
    prefix: config.prefix,
    flushMaxEvents: config.flushMaxEvents,
    flushIntervalMs: config.flushIntervalMs,
    flushSyncOnIssue: config.flushSyncOnIssue,
    trustedIssuerPublicKeysJson: config.trustedIssuerPublicKeysJson,
    currentIssuerKeyId: config.currentIssuerKeyId,
    currentIssuerPublicKeyPem: config.currentIssuerPublicKeyPem,
    gateway,
  });

  await issuerAuditLedger.init();
  return issuerAuditLedger;
}

export async function shutdownStickerbookLedger() {
  if (!issuerAuditLedger) return;
  await issuerAuditLedger.shutdown();
}

function sanitizeIssuedTo(value) {
  if (!value) return "unknown";
  const normalized = String(value).trim();
  return normalized || "unknown";
}

function canonicalizeUserKey(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "";
  if (normalized.includes(":")) return normalized;
  return `user:${normalized}`;
}

function normalizePackType(value) {
  return String(value || "").trim().toLowerCase() || "standard";
}

function requireIssuerMasterSeed() {
  const seed = String(process.env.ISSUER_MASTER_SEED || "").trim();
  if (!seed) {
    throw new Error("ISSUER_MASTER_SEED is required for weekly pack issuance.");
  }
  return seed;
}

async function assertPackConsistency(entries, expectedPackRoot) {
  const recomputed = await computeMerkleRoot(entries);
  if (recomputed !== expectedPackRoot) {
    throw new Error("Pack consistency check failed: packRoot mismatch.");
  }
}

function shouldRecordIssuedPackInLedger() {
  if (process.env.NODE_ENV === "production") return true;
  return String(process.env.LEDGER_RECORD_DEV_ISSUES || "false").toLowerCase() === "true";
}

export default function stickerbookRoutes(router) {
  validateTrustedIssuerKeysAtStartup();

  router.get("/v1/stickerbook/issuer-keypair", (_req, res) => {
    if (process.env.NODE_ENV === "production") {
      res.status(403).send({ error: "Disabled in production." });
      return;
    }
    const { publicKey, privateKey } = generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
    });
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
    const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" });
    res.status(200).send({ publicKeyPem, privateKeyPem });
  });

  router.get("/v1/stickerbook/catalogue", (req, res) => {
    const seriesId = req.query.seriesId || "S1";
    const catalogue = loadCatalogue(seriesId);
    res.status(200).send(catalogue);
  });

  router.get("/v1/stickerbook/index", (req, res) => {
    const index = loadIndex();
    const now = new Date();
    const nextDropAt = getNextWeeklyDropAt(now);
    res.status(200).send({
      ...index,
      periodSeconds: WEEK_SECONDS,
      nextDropAt: nextDropAt.toISOString(),
      serverTime: now.toISOString(),
    });
  });

  router.post("/v1/stickerbook/commit", async (req, res) => {
    try {
      const {
        packRequestId,
        packType,
        dropCycleId,
        userKey,
        seriesId,
        themeId,
        count,
        clientNonceHash,
        issuedTo,
      } = req.body || {};
      const normalizedPackType = normalizePackType(packType);
      const normalizedIssuedTo = sanitizeIssuedTo(issuedTo);
      const normalizedUserKey = canonicalizeUserKey(userKey || normalizedIssuedTo);

      if (!packRequestId || !seriesId || !themeId || !clientNonceHash) {
        if (normalizedPackType !== "weekly") {
          res.status(400).send({ error: "Missing pack request fields." });
          return;
        }
      }

      let resolvedPackRequestId = String(packRequestId || "").trim();
      let resolvedDropCycleId = String(dropCycleId || "").trim();

      if (normalizedPackType === "weekly") {
        if (!resolvedDropCycleId) {
          res.status(400).send({ error: "dropCycleId is required for weekly packs." });
          return;
        }
        if (!normalizedUserKey || normalizedUserKey === "unknown") {
          res.status(400).send({ error: "userKey (or issuedTo) is required for weekly packs." });
          return;
        }

        const issuerMasterSeed = requireIssuerMasterSeed();
        const dropSeed = deriveWeeklyDropSeed(issuerMasterSeed, resolvedDropCycleId);
        const weeklyUserSeed = deriveWeeklyUserSeed(dropSeed, normalizedUserKey);
        const deterministicPackRequestId = deriveDeterministicPackRequestId(weeklyUserSeed);
        if (resolvedPackRequestId && resolvedPackRequestId !== deterministicPackRequestId) {
          res.status(400).send({
            error: "packRequestId does not match deterministic weekly request id.",
            expectedPackRequestId: deterministicPackRequestId,
          });
          return;
        }
        resolvedPackRequestId = deterministicPackRequestId;
      }

      if (!resolvedPackRequestId || !seriesId || !themeId || !clientNonceHash) {
        res.status(400).send({ error: "Missing pack request fields." });
        return;
      }

      const { privateKeyPem, author, issuerKeyId } = await loadIssuerKeys();
      const issuedAt = new Date().toISOString();
      const serverSecret = createNonceHex(48);
      const serverCommit = hashCanonical(serverSecret);

      const payload = {
        type: "pack.commit",
        packRequestId: resolvedPackRequestId,
        seriesId,
        themeId,
        count: Number(count || 0),
        clientNonceHash,
        serverCommit,
        issuerKeyId,
        issuedAt,
      };

      const entryCore = {
        kind: "pack.commit",
        timestamp: issuedAt,
        author,
        payload,
      };
      const signature = await signPayload(
        privateKeyPem,
        getSigningPayload(entryCore)
      );
      const entry = { ...entryCore, signature };

      const pending = loadPendingIssuances();
      pending[resolvedPackRequestId] = {
        packType: normalizedPackType,
        dropCycleId: resolvedDropCycleId || null,
        userKey: normalizedUserKey || null,
        serverSecret,
        clientNonceHash,
        seriesId,
        themeId,
        count: Number(count || 0),
        issuedAt,
        issuedTo: normalizedIssuedTo,
      };
      savePendingIssuances(pending);

      res.status(200).send({
        entry,
        entryId: await deriveEntryId(entry),
        packRequestId: resolvedPackRequestId,
      });
    } catch (error) {
      console.error("[stickerbook/commit] failed:", error);
      res.status(500).send({ error: error?.message || "Commit failed." });
    }
  });

  router.post("/v1/stickerbook/issue", async (req, res) => {
    let stage = "start";
    try {
      stage = "parse-request";
      const { packRequestId, clientNonce, issuedTo } = req.body || {};
      if (!packRequestId || !clientNonce) {
        res.status(400).send({ error: "Missing pack request fields." });
        return;
      }

      stage = "load-pending";
      const pending = loadPendingIssuances();
      const pendingEntry = pending[packRequestId];
      if (!pendingEntry) {
        res.status(404).send({ error: "No pending pack commit found." });
        return;
      }

      stage = "verify-client-nonce";
      const clientNonceHash = hashCanonical(clientNonce);
      if (clientNonceHash !== pendingEntry.clientNonceHash) {
        res.status(400).send({ error: "Client nonce does not match commit." });
        return;
      }

      stage = "load-issuer-keys";
      const { privateKeyPem, publicKeyPem, author, issuerKeyId } = await loadIssuerKeys();
      const shouldPersistLedger = shouldRecordIssuedPackInLedger();

      stage = "load-catalogue";
      const catalogue = loadCatalogue(pendingEntry.seriesId);
      stage = "derive-kit";
      const kitJson = deriveKitFromCatalogue(catalogue);
      const kitHash = hashCanonical(kitJson);
      const themeHash = hashCanonical({
        themeId: catalogue?.themeId ?? pendingEntry.themeId,
        themeVersion: catalogue?.themeVersion ?? catalogue?.version ?? "1.0.0",
      });

      stage = "derive-pack-seed";
      const packType = normalizePackType(pendingEntry.packType);
      const isWeekly = packType === "weekly";
      let weeklyDropCycleId = "";
      let weeklyUserKey = "";
      let weeklyUserSeed = "";
      let packSeed = derivePackSeed({
        serverSecret: pendingEntry.serverSecret,
        clientNonce,
        packRequestId,
        seriesId: pendingEntry.seriesId,
        themeId: pendingEntry.themeId,
      });

      if (isWeekly) {
        weeklyDropCycleId = String(pendingEntry.dropCycleId || "").trim();
        weeklyUserKey = canonicalizeUserKey(pendingEntry.userKey || pendingEntry.issuedTo);
        if (!weeklyDropCycleId) {
          res.status(400).send({ error: "dropCycleId is required for weekly packs." });
          return;
        }
        if (!weeklyUserKey || weeklyUserKey === "unknown") {
          res.status(400).send({ error: "userKey is required for weekly packs." });
          return;
        }
        const issuerMasterSeed = requireIssuerMasterSeed();
        const dropSeed = deriveWeeklyDropSeed(issuerMasterSeed, weeklyDropCycleId);
        weeklyUserSeed = deriveWeeklyUserSeed(dropSeed, weeklyUserKey);
        packSeed = weeklyUserSeed;
      }

      stage = "generate-pack";
      const entries = generatePack({
        packSeed,
        seriesId: pendingEntry.seriesId,
        themeId: pendingEntry.themeId,
        count: pendingEntry.count,
        algoVersion: ALGO_VERSION,
        kitJson,
        stickerSeedForIndex: isWeekly
          ? (index) => deriveWeeklyStickerSeed(weeklyUserSeed, index)
          : null,
      });

      stage = "compute-pack-root";
      const packRoot = await computeMerkleRoot(entries);
      const issuedAt = new Date().toISOString();
      const packId = isWeekly ? deriveDeterministicPackId(weeklyUserSeed, 24) : createNonceHex(24);
      const itemHashes = entries.map((entry) => hashCanonical(entry));
      const contentsCommitment = hashCanonical({
        itemHashes,
        count: pendingEntry.count,
        packRoot,
      });
      await assertPackConsistency(entries, packRoot);
      const dropCycleId = isWeekly ? weeklyDropCycleId : toIsoWeek(new Date(issuedAt));
      const userKeyForPayload = isWeekly
        ? weeklyUserKey
        : canonicalizeUserKey(issuedTo || pendingEntry.issuedTo);

      stage = "sign-entry";
      const payload = {
        type: "pack.issued",
        packId,
        packRequestId,
        issuedAt,
        issuerKeyId,
        issuedBy: author,
        issuedTo: sanitizeIssuedTo(issuedTo || pendingEntry.issuedTo),
        userKey: userKeyForPayload || null,
        seriesId: pendingEntry.seriesId,
        dropId: `week-${dropCycleId}`,
        themeId: pendingEntry.themeId,
        week: dropCycleId,
        count: pendingEntry.count,
        packRoot,
        itemHashes,
        contentsCommitment,
        algoVersion: ALGO_VERSION,
        kitHash,
        themeHash,
      };

      const entryCore = {
        kind: "pack.issued",
        timestamp: issuedAt,
        author,
        payload,
      };
      const signature = await signPayload(
        privateKeyPem,
        getSigningPayload(entryCore)
      );
      const entry = { ...entryCore, signature };
      const entryId = await deriveEntryId(entry);

      let appendResult = {
        segmentKey: null,
        segmentHash: null,
        queued: false,
        skipped: !shouldPersistLedger,
      };

      if (shouldPersistLedger) {
        stage = "init-ledger";
        const ledger = await ensureIssuerAuditLedger({
          publicKeyPem,
          issuerKeyId,
        });

        if (ledger.options?.disabled) {
          res.status(503).send({
            error:
              "Issuer audit ledger is disabled. Configure LEDGER_* environment variables.",
          });
          return;
        }

        stage = "append-ledger-entry";
        appendResult = await ledger.appendIssuedEntry(entryId, entry);
      }

      if (isWeekly) {
        console.debug("[stickerbook/issue] weekly-issued", {
          dropCycleId,
          userKey: userKeyForPayload,
          packId,
          packRoot,
        });
      }

      stage = "persist-cleanup";
      delete pending[packRequestId];
      savePendingIssuances(pending);

      stage = "send-response";
      res.status(200).send({
        entry,
        entryId,
        pack: {
          packId,
          packRequestId,
          serverSecret: pendingEntry.serverSecret,
          clientNonce,
          seriesId: pendingEntry.seriesId,
          themeId: pendingEntry.themeId,
          count: pendingEntry.count,
          packSeed: isWeekly ? null : packSeed,
          packRoot,
          algoVersion: ALGO_VERSION,
          kitHash,
          themeHash,
          entries,
        },
        receipt: {
          segmentKey: appendResult?.segmentKey || null,
          segmentHash: appendResult?.segmentHash || null,
          queued: appendResult?.queued === true,
          skipped: appendResult?.skipped === true,
        },
      });
    } catch (error) {
      console.error("[stickerbook/issue] failed:", { stage, error });
      res.status(500).send({
        error: error?.message || "Issue failed.",
        stage,
        name: error?.name || "Error",
      });
    }
  });

  router.get("/v1/pixpax/receipt/:packId", async (req, res) => {
    try {
      const packId = String(req.params.packId || "").trim();
      const segmentKey = String(req.query.segmentKey || "").trim();
      if (!packId) {
        res.status(400).send({ ok: false, reason: "missing-pack-id" });
        return;
      }
      if (!segmentKey) {
        res.status(400).send({
          ok: false,
          reason: "missing-segment-key",
          message: "Provide ?segmentKey=<ledger segment key> for verification.",
        });
        return;
      }

      const keys = await loadIssuerKeys();
      const ledger = await ensureIssuerAuditLedger({
        publicKeyPem: ensurePublicKeyPem(keys.publicKeyPem),
        issuerKeyId: keys.issuerKeyId,
      });

      if (ledger.options?.disabled) {
        res.status(503).send({
          ok: false,
          reason: "ledger-disabled",
          message: "Configure LEDGER_* environment variables.",
        });
        return;
      }

      const verification = await ledger.fetchReceiptProof(packId, segmentKey);
      const status = verification?.ok ? 200 : 422;
      res.status(status).send(verification);
    } catch (error) {
      console.error("[pixpax/receipt] failed:", error);
      res.status(500).send({ ok: false, reason: "internal-error", error: error?.message });
    }
  });
}

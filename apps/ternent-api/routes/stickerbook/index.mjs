import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  webcrypto,
} from "crypto";
import {
  createLedger,
  deriveCommitId,
  deriveEntryId,
} from "@ternent/concord-protocol";
import {
  computeMerkleRoot,
  createNonceHex,
  deriveKitFromCatalogue,
  derivePackSeed,
  generatePack,
  hashCanonical,
  getSigningPayload,
} from "./stickerbook-utils.mjs";
const __dirname = dirname(fileURLToPath(import.meta.url));

const ISSUER_LEDGER_PATH = "persisted/stickerbook/issuer-ledger.json";
const ISSUER_PENDING_PATH = "persisted/stickerbook/issuer-pending.json";
const ALGO_VERSION = "1.0.0";

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
  console.log(filepath);
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

function loadIssuerLedger() {
  const filepath = join(__dirname, "..", "..", ISSUER_LEDGER_PATH);
  if (existsSync(filepath)) {
    return JSON.parse(readFileSync(filepath, "utf8"));
  }
  return null;
}

function saveIssuerLedger(ledger) {
  const filepath = join(__dirname, "..", "..", ISSUER_LEDGER_PATH);
  writeFileSync(filepath, JSON.stringify(ledger, null, 2));
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

async function ensureIssuerLedger() {
  let ledger = loadIssuerLedger();
  if (!ledger) {
    ledger = await createLedger({ issuer: "stickerbook" });
    saveIssuerLedger(ledger);
  }
  return ledger;
}

async function appendIssuerEntries(entries, message) {
  const ledger = await ensureIssuerLedger();
  const entryIds = [];
  const nextEntries = { ...ledger.entries };

  for (const entry of entries) {
    const entryId = await deriveEntryId(entry);
    if (nextEntries[entryId]) continue;
    nextEntries[entryId] = entry;
    entryIds.push(entryId);
  }

  if (!entryIds.length) return { ledger, entryIds: [], commitId: null };

  const commit = {
    parent: ledger.head ?? null,
    timestamp: new Date().toISOString(),
    metadata: message ? { message } : null,
    entries: entryIds,
  };

  const commitId = await deriveCommitId(commit);
  const nextLedger = {
    ...ledger,
    entries: nextEntries,
    commits: { ...ledger.commits, [commitId]: commit },
    head: commitId,
  };

  saveIssuerLedger(nextLedger);
  return { ledger: nextLedger, entryIds, commitId };
}

async function loadIssuerKeys() {
  const privateKeyPem = normalizePem(process.env.ISSUER_PRIVATE_KEY_PEM);
  const publicKeyPem = derivePublicKeyPem(privateKeyPem);
  const author = stripIdentityKey(publicKeyPem);
  const issuerKeyId =
    process.env.ISSUER_KEY_ID ||
    hashCanonical({ type: "issuer-key", v: 1, publicKey: author });

  return { privateKeyPem, publicKeyPem, author, issuerKeyId };
}

export default function stickerbookRoutes(router) {
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
    res.status(200).send(index);
  });

  router.post("/v1/stickerbook/commit", async (req, res) => {
    try {
      const { packRequestId, seriesId, themeId, count, clientNonceHash } =
        req.body || {};

      if (!packRequestId || !seriesId || !themeId || !clientNonceHash) {
        res.status(400).send({ error: "Missing pack request fields." });
        return;
      }

      const { privateKeyPem, author, issuerKeyId } = await loadIssuerKeys();
      const issuedAt = new Date().toISOString();
      const serverSecret = createNonceHex(48);
      const serverCommit = hashCanonical(serverSecret);

      const payload = {
        type: "pack.commit",
        packRequestId,
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

      const { entryIds } = await appendIssuerEntries([entry], "pack.commit");

      const pending = loadPendingIssuances();
      pending[packRequestId] = {
        serverSecret,
        clientNonceHash,
        seriesId,
        themeId,
        count: Number(count || 0),
        entryId: entryIds[0] || null,
        issuedAt,
      };
      savePendingIssuances(pending);

      res.status(200).send({
        entry,
        entryId: entryIds[0] || null,
      });
    } catch (error) {
      res.status(500).send({ error: error?.message || "Commit failed." });
    }
  });

  router.post("/v1/stickerbook/issue", async (req, res) => {
    try {
      const { packRequestId, clientNonce } = req.body || {};
      if (!packRequestId || !clientNonce) {
        res.status(400).send({ error: "Missing pack request fields." });
        return;
      }

      const pending = loadPendingIssuances();
      const pendingEntry = pending[packRequestId];
      if (!pendingEntry) {
        res.status(404).send({ error: "No pending pack commit found." });
        return;
      }

      const clientNonceHash = hashCanonical(clientNonce);
      if (clientNonceHash !== pendingEntry.clientNonceHash) {
        res.status(400).send({ error: "Client nonce does not match commit." });
        return;
      }

      const { privateKeyPem, author, issuerKeyId } = await loadIssuerKeys();
      const catalogue = loadCatalogue(pendingEntry.seriesId);
      const kitJson = deriveKitFromCatalogue(catalogue);
      const kitHash = hashCanonical(kitJson);
      const themeHash = hashCanonical({
        themeId: catalogue?.themeId ?? pendingEntry.themeId,
        themeVersion: catalogue?.themeVersion ?? catalogue?.version ?? "1.0.0",
      });

      const packSeed = derivePackSeed({
        serverSecret: pendingEntry.serverSecret,
        clientNonce,
        packRequestId,
        seriesId: pendingEntry.seriesId,
        themeId: pendingEntry.themeId,
      });

      const entries = generatePack({
        packSeed,
        seriesId: pendingEntry.seriesId,
        themeId: pendingEntry.themeId,
        count: pendingEntry.count,
        algoVersion: ALGO_VERSION,
        kitJson,
      });

      const packRoot = await computeMerkleRoot(entries);
      const issuedAt = new Date().toISOString();

      const payload = {
        type: "pack.issue",
        packRequestId,
        seriesId: pendingEntry.seriesId,
        themeId: pendingEntry.themeId,
        count: pendingEntry.count,
        serverSecret: pendingEntry.serverSecret,
        clientNonce,
        packSeed,
        packRoot,
        algoVersion: ALGO_VERSION,
        kitHash,
        themeHash,
        issuerKeyId,
        issuedAt,
      };

      const entryCore = {
        kind: "pack.issue",
        timestamp: issuedAt,
        author,
        payload,
      };
      const signature = await signPayload(
        privateKeyPem,
        getSigningPayload(entryCore)
      );
      const entry = { ...entryCore, signature };

      const { entryIds } = await appendIssuerEntries([entry], "pack.issue");

      delete pending[packRequestId];
      savePendingIssuances(pending);

      res.status(200).send({
        entry,
        entryId: entryIds[0] || null,
        pack: {
          packRequestId,
          seriesId: pendingEntry.seriesId,
          themeId: pendingEntry.themeId,
          count: pendingEntry.count,
          packSeed,
          packRoot,
          algoVersion: ALGO_VERSION,
          kitHash,
          themeHash,
          entries,
        },
      });
    } catch (error) {
      res.status(500).send({ error: error?.message || "Issue failed." });
    }
  });
}

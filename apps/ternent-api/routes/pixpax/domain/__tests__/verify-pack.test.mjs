import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";
import pixpaxCollectionRoutes from "../../collections/index.mjs";
import { CollectionContentStore } from "../../collections/content-store.mjs";
import { verifyPack } from "../verify-pack.mjs";

function createRouterHarness() {
  const routes = new Map();
  const register = (method, path, handler) => routes.set(`${method}:${path}`, handler);
  return {
    get(path, handler) {
      register("GET", path, handler);
    },
    put(path, handler) {
      register("PUT", path, handler);
    },
    post(path, handler) {
      register("POST", path, handler);
    },
    async invoke(method, path, { body = {}, params = {}, headers = {} } = {}) {
      const handler = routes.get(`${method}:${path}`);
      assert.ok(handler, `Missing handler ${method}:${path}`);
      let statusCode = 200;
      let sent;
      const req = { body, params, headers };
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        send(payload) {
          sent = payload;
          return this;
        },
      };
      await handler(req, res);
      return { statusCode, body: sent };
    },
  };
}

function createMemoryGateway() {
  const objects = new Map();
  return {
    async getObject({ bucket, key }) {
      const id = `${bucket}:${key}`;
      if (!objects.has(id)) throw new Error(`NoSuchKey:${key}`);
      return Buffer.from(objects.get(id));
    },
    async putObject({ bucket, key, body }) {
      objects.set(`${bucket}:${key}`, Buffer.from(body));
    },
    async listObjects({ bucket, prefix, cursor, maxKeys = 1000 }) {
      const allKeys = Array.from(objects.keys())
        .filter((id) => id.startsWith(`${bucket}:`))
        .map((id) => id.slice(bucket.length + 1))
        .filter((key) => key.startsWith(prefix))
        .sort((a, b) => a.localeCompare(b));
      const startIndex = cursor ? Math.max(0, allKeys.indexOf(cursor) + 1) : 0;
      const keys = allKeys.slice(startIndex, startIndex + maxKeys);
      const nextCursor =
        startIndex + maxKeys < allKeys.length ? keys[keys.length - 1] || null : null;
      return { keys, nextCursor };
    },
  };
}

function createIssuerKeyEnv() {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const privateKeyPem = privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString();
  process.env.ISSUER_PRIVATE_KEY_PEM = privateKeyPem;
}

function issuerAuthorToPem(author) {
  const normalized = String(author || "").replace(/\\n/g, "\n").trim();
  if (!normalized) return "";
  if (normalized.includes("BEGIN PUBLIC KEY")) return normalized;
  return `-----BEGIN PUBLIC KEY-----\n${normalized}\n-----END PUBLIC KEY-----`;
}

async function seedCollection(store) {
  const collectionId = "premier-league-2026";
  const version = "v1";
  await store.putCollection(collectionId, version, {
    name: "Premier League 2026",
    gridSize: 16,
    version,
  });
  await store.putIndex(collectionId, version, {
    series: [{ seriesId: "arsenal" }],
    cards: ["arsenal-01", "arsenal-02"],
    cardMap: {
      "arsenal-01": { seriesId: "arsenal", slotIndex: 0, role: "player" },
      "arsenal-02": { seriesId: "arsenal", slotIndex: 1, role: "player" },
    },
  });
  await store.putCard(collectionId, version, "arsenal-01", {
    cardId: "arsenal-01",
    seriesId: "arsenal",
    slotIndex: 0,
    role: "player",
    label: "Player One",
    renderPayload: { gridSize: 16, gridB64: "AAAAAA==" },
  });
  await store.putCard(collectionId, version, "arsenal-02", {
    cardId: "arsenal-02",
    seriesId: "arsenal",
    slotIndex: 1,
    role: "player",
    label: "Player Two",
    renderPayload: { gridSize: 16, gridB64: "AQEBAQ==" },
  });
}

test("verifyPack validates issued tracked pack integrity", async () => {
  createIssuerKeyEnv();
  process.env.PIX_PAX_ADMIN_TOKEN = "admin-token";
  process.env.PIX_PAX_OVERRIDE_CODE_SECRET = "override-secret-for-tests";
  const store = new CollectionContentStore({
    bucket: "content",
    prefix: "pixpax/collections",
    gateway: createMemoryGateway(),
  });
  await seedCollection(store);

  const router = createRouterHarness();
  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    pickRandomIndex: (max) => (max > 1 ? 1 : 0),
    now: () => new Date("2026-02-16T12:00:00.000Z"),
    issueLedgerEntry: async () => ({ segmentKey: "seg", segmentHash: "hash" }),
  });

  const issue = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: { userKey: "school:user:abc123", dropId: "week-2026-W07" },
    }
  );
  assert.equal(issue.statusCode, 200);

  const issuerKeyId = String(issue.body?.entry?.payload?.issuerKeyId || "");
  const issuerPublicKeyPem = issuerAuthorToPem(issue.body?.entry?.author || "");
  const verification = await verifyPack({
    store,
    packId: issue.body.packId,
    collectionId: "premier-league-2026",
    version: "v1",
    trustedIssuerPublicKeysById: {
      [issuerKeyId]: issuerPublicKeyPem,
    },
  });

  assert.equal(verification.ok, true);
  assert.equal(verification.packId, issue.body.packId);
});

test("verifyPack fails loudly when cached card payload is tampered", async () => {
  createIssuerKeyEnv();
  process.env.PIX_PAX_ADMIN_TOKEN = "admin-token";
  process.env.PIX_PAX_OVERRIDE_CODE_SECRET = "override-secret-for-tests";
  const store = new CollectionContentStore({
    bucket: "content",
    prefix: "pixpax/collections",
    gateway: createMemoryGateway(),
  });
  await seedCollection(store);

  const router = createRouterHarness();
  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    pickRandomIndex: (max) => (max > 1 ? 1 : 0),
    now: () => new Date("2026-02-16T12:00:00.000Z"),
    issueLedgerEntry: async () => ({ segmentKey: "seg", segmentHash: "hash" }),
  });

  const issue = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: { userKey: "school:user:abc123", dropId: "week-2026-W07" },
    }
  );
  assert.equal(issue.statusCode, 200);

  await store.putCard("premier-league-2026", "v1", "arsenal-02", {
    cardId: "arsenal-02",
    seriesId: "arsenal",
    slotIndex: 1,
    role: "player",
    label: "Player Two (tampered)",
    renderPayload: { gridSize: 16, gridB64: "////////" },
  });

  const issuerKeyId = String(issue.body?.entry?.payload?.issuerKeyId || "");
  const issuerPublicKeyPem = issuerAuthorToPem(issue.body?.entry?.author || "");
  const verification = await verifyPack({
    store,
    packId: issue.body.packId,
    collectionId: "premier-league-2026",
    version: "v1",
    trustedIssuerPublicKeysById: {
      [issuerKeyId]: issuerPublicKeyPem,
    },
  });

  assert.equal(verification.ok, false);
  assert.equal(verification.reason, "item-hashes-mismatch");
});

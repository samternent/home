import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";
import pixpaxCollectionRoutes from "../index.mjs";
import { CollectionContentStore } from "../content-store.mjs";
import { PACK_MODELS } from "../../models/pack-models.mjs";

function createRouterHarness() {
  const routes = new Map();
  const register = (method, path, handler) => routes.set(`${method}:${path}`, handler);
  return {
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
  };
}

function createIssuerKeyEnv() {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  process.env.ISSUER_PRIVATE_KEY_PEM = privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString();
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

test("album pack endpoint validates required fields", async () => {
  createIssuerKeyEnv();
  const store = new CollectionContentStore({
    bucket: "content",
    prefix: "pixpax/collections",
    gateway: createMemoryGateway(),
  });
  const router = createRouterHarness();
  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    issueLedgerEntry: async () => ({ segmentKey: "seg", segmentHash: "hash" }),
  });

  const missingUser = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: { count: 5 },
    }
  );
  assert.equal(missingUser.statusCode, 400);

  const badCount = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: { userKey: "school:user:abc123", count: 0 },
    }
  );
  assert.equal(badCount.statusCode, 400);
});

test("album pack endpoint issues receipt and keeps ledger payload secret-free", async () => {
  createIssuerKeyEnv();
  const store = new CollectionContentStore({
    bucket: "content",
    prefix: "pixpax/collections",
    gateway: createMemoryGateway(),
  });
  await seedCollection(store);
  const router = createRouterHarness();
  const captured = [];

  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    pickRandomIndex: (max) => (max > 1 ? 1 : 0),
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    issueLedgerEntry: async ({ entry }) => {
      captured.push(entry);
      return { segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" };
    },
  });

  const response = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        count: 2,
        dropId: "week-2026-W06",
      },
    }
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.packModel, PACK_MODELS.ALBUM);
  assert.equal(response.body.collectionId, "premier-league-2026");
  assert.equal(response.body.collectionVersion, "v1");
  assert.equal(response.body.cards.length, 2);
  assert.equal(response.body.cards[0].cardId, "arsenal-02");
  assert.equal(response.body.receipt.segmentHash, "deadbeef");
  assert.equal(response.body.itemHashes.length, 2);

  assert.equal(captured.length, 1);
  const payload = captured[0].payload;
  assert.equal(payload.packModel, PACK_MODELS.ALBUM);
  assert.equal(payload.collectionId, "premier-league-2026");
  assert.equal(payload.collectionVersion, "v1");
  assert.deepEqual(payload.cardIds, ["arsenal-02", "arsenal-02"]);
  assert.ok(/^[a-f0-9]{64}$/.test(payload.issuedTo));
  assert.equal("cards" in payload, false);
  assert.equal(String(JSON.stringify(payload)).includes("Player Two"), false);
});

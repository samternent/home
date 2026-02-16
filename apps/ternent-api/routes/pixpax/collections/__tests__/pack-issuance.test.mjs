import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";
import pixpaxCollectionRoutes from "../index.mjs";
import { CollectionContentStore } from "../content-store.mjs";
import { PACK_MODELS } from "../../models/pack-models.mjs";
import { PIXPAX_EVENT_TYPES } from "../../domain/events.mjs";

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
  process.env.PIX_PAX_ADMIN_TOKEN = "admin-token";
  process.env.PIX_PAX_OVERRIDE_CODE_SECRET = "override-secret-for-tests";
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
      headers: { authorization: "Bearer admin-token" },
      body: { userKey: "school:user:abc123", override: true, count: 0 },
    }
  );
  assert.equal(badCount.statusCode, 400);
});

test("album issuance uses rngSource.nextInt with issuance context", async () => {
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
  const calls = [];
  const rngSource = {
    nextInt(maxExclusive, context) {
      calls.push({ maxExclusive, context });
      return maxExclusive > 1 ? 1 : 0;
    },
  };

  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    rngSource,
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    issueLedgerEntry: async () => ({ segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" }),
  });

  const response = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        dropId: "week-2026-W06",
      },
    }
  );
  assert.equal(response.statusCode, 200);
  assert.equal(calls.length, 5);
  assert.deepEqual(calls.map((entry) => entry.context.slotIndex), [0, 1, 2, 3, 4]);
  assert.ok(calls.every((entry) => entry.context.collectionId === "premier-league-2026"));
  assert.ok(calls.every((entry) => entry.context.version === "v1"));
  assert.ok(calls.every((entry) => entry.maxExclusive === 2));
});

test("album pack endpoint issues receipt and keeps ledger payload secret-free", async () => {
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
        dropId: "week-2026-W06",
      },
    }
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.packModel, PACK_MODELS.ALBUM);
  assert.equal(response.body.collectionId, "premier-league-2026");
  assert.equal(response.body.collectionVersion, "v1");
  assert.equal(response.body.cards.length, 5);
  assert.equal(response.body.cards[0].cardId, "arsenal-02");
  assert.equal(response.body.entry.kind, "pack.issued");
  assert.ok(response.body.entry.signature);
  assert.equal(response.body.receipt.segmentHash, "deadbeef");
  assert.equal(response.body.itemHashes.length, 5);
  assert.equal(response.body.issuance.mode, "weekly");
  assert.equal(response.body.issuance.reused, false);
  assert.equal(response.body.issuance.override, false);

  assert.equal(captured.length, 1);
  const payload = captured[0].payload;
  assert.equal(payload.packModel, PACK_MODELS.ALBUM);
  assert.equal(payload.collectionId, "premier-league-2026");
  assert.equal(payload.collectionVersion, "v1");
  assert.deepEqual(payload.cardIds, ["arsenal-02", "arsenal-02", "arsenal-02", "arsenal-02", "arsenal-02"]);
  assert.ok(/^[a-f0-9]{64}$/.test(payload.issuedTo));
  assert.equal("cards" in payload, false);
  assert.equal(String(JSON.stringify(payload)).includes("Player Two"), false);
});

test("album pack endpoint is idempotent per user+drop without override", async () => {
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
  let issuedCount = 0;
  const events = [];

  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    pickRandomIndex: (max) => (max > 1 ? 1 : 0),
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    issueLedgerEntry: async () => {
      issuedCount += 1;
      return { segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" };
    },
    appendEvent: async (event) => {
      events.push(event);
      return { emitted: true };
    },
  });

  const first = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        dropId: "week-2026-W06",
      },
    }
  );
  assert.equal(first.statusCode, 200);
  assert.equal(first.body.issuance.reused, false);

  const second = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        dropId: "week-2026-W06",
      },
    }
  );
  assert.equal(second.statusCode, 200);
  assert.equal(second.body.issuance.reused, true);
  assert.equal(second.body.packId, first.body.packId);
  assert.equal(issuedCount, 1);
  assert.deepEqual(
    events.map((event) => event.type),
    [PIXPAX_EVENT_TYPES.PACK_ISSUED, PIXPAX_EVENT_TYPES.PACK_CLAIMED]
  );
});

test("dev-untracked issuance allows unlimited packs and skips ledger receipt persistence", async () => {
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
  let issuedCount = 0;

  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    pickRandomIndex: (max) => (max > 1 ? 1 : 0),
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    issueLedgerEntry: async () => {
      issuedCount += 1;
      return { segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" };
    },
    allowDevUntrackedPacks: true,
  });

  const first = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        issuanceMode: "dev-untracked",
      },
    }
  );
  const second = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        issuanceMode: "dev-untracked",
      },
    }
  );

  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(first.body.issuance.mode, "dev-untracked");
  assert.equal(first.body.issuance.untracked, true);
  assert.equal(first.body.receipt.segmentKey, null);
  assert.equal(first.body.receipt.segmentHash, null);
  assert.equal(first.body.cards.length, 5);
  assert.equal(first.body.entry.signature, "");
  assert.notEqual(first.body.packId, second.body.packId);
  assert.equal(issuedCount, 0);
});

test("album pack endpoint supports admin override for extra issuance", async () => {
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
  let nonce = 0;

  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    pickRandomIndex: (max) => (max > 1 ? 1 : 0),
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    issueLedgerEntry: async () => ({ segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" }),
  });

  const denied = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        dropId: "week-2026-W06",
        override: true,
        count: 8,
      },
    }
  );
  assert.equal(denied.statusCode, 401);

  const issued = [];
  const router2 = createRouterHarness();
  pixpaxCollectionRoutes(router2, {
    createStore: () => store,
    pickRandomIndex: (max) => (max > 1 ? ((nonce += 1) % 2) : 0),
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    issueLedgerEntry: async () => ({ segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" }),
  });

  const first = await router2.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        dropId: "week-2026-W06",
      },
    }
  );
  issued.push(first.body.packId);

  const override = await router2.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      headers: { authorization: "Bearer admin-token" },
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        dropId: "week-2026-W06",
        override: true,
        count: 8,
      },
    }
  );
  issued.push(override.body.packId);
  assert.equal(override.statusCode, 200);
  assert.equal(override.body.cards.length, 8);
  assert.equal(override.body.issuance.override, true);
  assert.equal(override.body.issuance.mode, "override");
  assert.equal(override.body.issuance.reused, false);
  assert.notEqual(issued[0], issued[1]);
});

test("admin can mint one-time override code and code can be redeemed once", async () => {
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
  const events = [];

  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    pickRandomIndex: (max) => (max > 1 ? 1 : 0),
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    issueLedgerEntry: async () => ({ segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" }),
    appendEvent: async (event) => {
      events.push(event);
      return { emitted: true };
    },
  });

  const mint = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/override-codes",
    {
      headers: { authorization: "Bearer admin-token" },
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        dropId: "week-2026-W06",
        count: 8,
        expiresInSeconds: 86400,
      },
    }
  );
  assert.equal(mint.statusCode, 201);
  assert.ok(mint.body.code);
  assert.ok(mint.body.giftCode);
  assert.equal(mint.body.count, 8);

  const firstUse = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        overrideCode: mint.body.giftCode,
      },
    }
  );
  assert.equal(firstUse.statusCode, 200);
  assert.equal(firstUse.body.cards.length, 8);
  assert.equal(firstUse.body.issuance.mode, "override-code");
  assert.equal(firstUse.body.issuance.override, true);
  assert.equal(firstUse.body.issuance.reused, false);

  const secondUse = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        overrideCode: mint.body.giftCode,
      },
    }
  );
  assert.equal(secondUse.statusCode, 409);
  assert.equal(secondUse.body.error, "Override code has already been used.");
  assert.deepEqual(
    events.map((event) => event.type),
    [
      PIXPAX_EVENT_TYPES.GIFTCODE_CREATED,
      PIXPAX_EVENT_TYPES.PACK_ISSUED,
      PIXPAX_EVENT_TYPES.GIFTCODE_REDEEMED,
    ]
  );
});

test("override code cannot be redeemed by another user", async () => {
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
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    issueLedgerEntry: async () => ({ segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" }),
  });

  const mint = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/override-codes",
    {
      headers: { authorization: "Bearer admin-token" },
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        dropId: "week-2026-W06",
        count: 8,
      },
    }
  );
  assert.equal(mint.statusCode, 201);
  assert.ok(mint.body.giftCode);

  const wrongUser = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:other-user",
        overrideCode: mint.body.giftCode,
      },
    }
  );
  assert.equal(wrongUser.statusCode, 403);
  assert.equal(wrongUser.body.error, "Override code is not valid for this user.");
});

test("unbound gift override code can be redeemed by any user once", async () => {
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
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    issueLedgerEntry: async () => ({ segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" }),
  });

  const mint = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/override-codes",
    {
      headers: { authorization: "Bearer admin-token" },
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        bindToUser: false,
        dropId: "week-2026-W06",
        count: 8,
      },
    }
  );
  assert.equal(mint.statusCode, 201);
  assert.equal(mint.body.bindToUser, false);
  assert.equal(mint.body.issuedTo, null);
  assert.ok(mint.body.giftCode);

  const firstUse = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:recipient-a",
        overrideCode: mint.body.giftCode,
      },
    }
  );
  assert.equal(firstUse.statusCode, 200);
  assert.equal(firstUse.body.issuance.mode, "override-code");
  assert.equal(firstUse.body.issuance.bindToUser, false);
  assert.equal(firstUse.body.cards.length, 8);

  const secondUse = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:recipient-b",
        overrideCode: mint.body.giftCode,
      },
    }
  );
  assert.equal(secondUse.statusCode, 409);
  assert.equal(secondUse.body.error, "Override code has already been used.");
});

test("verify-pack route returns ok for a clean dev-untracked pack", async () => {
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
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    allowDevUntrackedPacks: true,
    issueLedgerEntry: async () => ({ segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" }),
  });

  const issue = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        issuanceMode: "dev-untracked",
      },
    }
  );
  assert.equal(issue.statusCode, 200);

  const verify = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/:version/packs/:packId/verify",
    {
      params: {
        collectionId: "premier-league-2026",
        version: "v1",
        packId: issue.body.packId,
      },
    }
  );
  assert.equal(verify.statusCode, 200);
  assert.equal(verify.body.ok, true);
  assert.equal(verify.body.checks.signature, "skipped-untracked");
});

test("verify-pack route fails loudly after cached tamper", async () => {
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
    now: () => new Date("2026-02-07T12:00:00.000Z"),
    allowDevUntrackedPacks: true,
    issueLedgerEntry: async () => ({ segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz", segmentHash: "deadbeef" }),
  });

  const issue = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:abc123",
        issuanceMode: "dev-untracked",
      },
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

  const verify = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/:version/packs/:packId/verify",
    {
      params: {
        collectionId: "premier-league-2026",
        version: "v1",
        packId: issue.body.packId,
      },
    }
  );
  assert.equal(verify.statusCode, 422);
  assert.equal(verify.body.ok, false);
  assert.equal(verify.body.reason, "item-hashes-mismatch");
});

test("public analytics route returns pack totals, insights, and non-identifying pack list", async () => {
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

  let nowCall = 0;
  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    pickRandomIndex: (max) => (max > 1 ? 1 : 0),
    now: () => new Date(`2026-02-07T12:00:0${Math.min(nowCall++, 9)}.000Z`),
    allowDevUntrackedPacks: true,
    issueLedgerEntry: async () => ({
      segmentKey: "pixpax/ledger/segments/day/seg_deadbeef.jsonl.gz",
      segmentHash: "deadbeef",
    }),
  });

  const issueA = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:alpha",
        dropId: "week-2026-W06",
      },
    }
  );
  assert.equal(issueA.statusCode, 200);

  const issueB = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/packs",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        userKey: "school:user:beta",
        dropId: "week-2026-W07",
      },
    }
  );
  assert.equal(issueB.statusCode, 200);

  const analytics = await router.invoke("GET", "/v1/pixpax/analytics/packs");
  assert.equal(analytics.statusCode, 200);
  assert.equal(analytics.body.ok, true);
  assert.equal(analytics.body.packsTotal, 2);
  assert.equal(analytics.body.insights.totalPacks, 2);
  assert.ok(Array.isArray(analytics.body.packs));
  assert.equal(analytics.body.packs.length, 2);
  assert.ok(Array.isArray(analytics.body.insights.topDrops));
  assert.ok(Array.isArray(analytics.body.insights.packsByCollectionVersion));
  assert.ok(Array.isArray(analytics.body.insights.issuanceModes));

  for (const pack of analytics.body.packs) {
    assert.equal(typeof pack.packId, "string");
    assert.equal(pack.collectionId, "premier-league-2026");
    assert.equal(pack.collectionVersion, "v1");
    assert.equal("issuedTo" in pack, false);
    assert.equal("userKeyHash" in pack, false);
  }
});

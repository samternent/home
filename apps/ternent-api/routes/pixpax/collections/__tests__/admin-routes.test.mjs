import assert from "node:assert/strict";
import test from "node:test";
import pixpaxCollectionRoutes from "../index.mjs";
import { CollectionContentStore } from "../content-store.mjs";
import { PIXPAX_EVENT_TYPES, createPixpaxEvent } from "../../domain/events.mjs";

function createRouterHarness() {
  const routes = new Map();
  return {
    get(path, handler) {
      routes.set(`GET:${path}`, handler);
    },
    put(path, handler) {
      routes.set(`PUT:${path}`, handler);
    },
    post(path, handler) {
      routes.set(`POST:${path}`, handler);
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
      if (!objects.has(id)) {
        throw new Error(`NoSuchKey:${key}`);
      }
      return Buffer.from(objects.get(id));
    },
    async putObject({ bucket, key, body }) {
      const id = `${bucket}:${key}`;
      objects.set(id, Buffer.from(body));
    },
    async deleteObject({ bucket, key }) {
      const id = `${bucket}:${key}`;
      objects.delete(id);
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

function createStore() {
  return new CollectionContentStore({
    bucket: "content-bucket",
    prefix: "pixpax/collections",
    gateway: createMemoryGateway(),
  });
}

test("admin endpoints require bearer token", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });

  const response = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: { gridSize: 16 },
    }
  );

  assert.equal(response.statusCode, 401);
});

test("admin session endpoint validates token and returns permissions", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });

  const unauthorized = await router.invoke("GET", "/v1/pixpax/admin/session");
  assert.equal(unauthorized.statusCode, 401);
  assert.deepEqual(unauthorized.body, {
    ok: false,
    authenticated: false,
    error: "Unauthorized.",
  });

  const authorized = await router.invoke("GET", "/v1/pixpax/admin/session", {
    headers: { authorization: "Bearer test-token" },
  });
  assert.equal(authorized.statusCode, 200);
  assert.equal(authorized.body.ok, true);
  assert.equal(authorized.body.authenticated, true);
  assert.deepEqual(authorized.body.permissions, [
    "pixpax.admin.manage",
    "pixpax.analytics.read",
    "pixpax.creator.publish",
    "pixpax.creator.view",
  ]);
});

test("analytics endpoint requires bearer token", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });

  const unauthorized = await router.invoke("GET", "/v1/pixpax/analytics/packs");
  assert.equal(unauthorized.statusCode, 401);

  const authorized = await router.invoke("GET", "/v1/pixpax/analytics/packs", {
    headers: { authorization: "Bearer test-token" },
  });
  assert.equal(authorized.statusCode, 200);
  assert.equal(authorized.body.ok, true);
});

test("collection upload validates payload and enforces immutability", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });

  const headers = { authorization: "Bearer test-token" };

  const badPayload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: { gridSize: 0 },
    }
  );
  assert.equal(badPayload.statusCode, 400);

  const first = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        name: "Premier League 2026",
        gridSize: 16,
        version: "v1",
      },
    }
  );
  assert.equal(first.statusCode, 201);

  const second = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params: { collectionId: "premier-league-2026", version: "v1" },
      body: {
        name: "Premier League 2026 v2",
        gridSize: 16,
      },
    }
  );
  assert.equal(second.statusCode, 409);
});

test("index and card endpoints validate references and collection grid size", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });
  const headers = { authorization: "Bearer test-token" };
  const params = { collectionId: "premier-league-2026", version: "v1" };

  const collectionUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params,
      body: { name: "Premier League 2026", gridSize: 16, version: "v1" },
    }
  );
  assert.equal(collectionUpload.statusCode, 201);

  const badIndex = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/index",
    {
      headers,
      params,
      body: {
        series: [{ seriesId: "arsenal" }],
        cards: ["arsenal-01"],
        cardMap: {
          "arsenal-01": { seriesId: "chelsea", slotIndex: 0, role: "player" },
        },
      },
    }
  );
  assert.equal(badIndex.statusCode, 400);

  const goodIndex = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/index",
    {
      headers,
      params,
      body: {
        series: [{ seriesId: "arsenal" }],
        cards: ["arsenal-01"],
        cardMap: {
          "arsenal-01": { seriesId: "arsenal", slotIndex: 0, role: "player" },
        },
      },
    }
  );
  assert.equal(goodIndex.statusCode, 201);

  const wrongGridCard = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/cards/:cardId",
    {
      headers,
      params: { ...params, cardId: "arsenal-01" },
      body: {
        cardId: "arsenal-01",
        seriesId: "arsenal",
        slotIndex: 0,
        role: "player",
        renderPayload: { gridSize: 8, gridB64: "AAECAw==" },
      },
    }
  );
  assert.equal(wrongGridCard.statusCode, 400);

  const goodCard = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/cards/:cardId",
    {
      headers,
      params: { ...params, cardId: "arsenal-01" },
      body: {
        cardId: "arsenal-01",
        seriesId: "arsenal",
        slotIndex: 0,
        role: "player",
        renderPayload: { gridSize: 16, gridB64: "AAECAw==" },
      },
    }
  );
  assert.equal(goodCard.statusCode, 201);

  const duplicateCard = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/cards/:cardId",
    {
      headers,
      params: { ...params, cardId: "arsenal-01" },
      body: {
        cardId: "arsenal-01",
        seriesId: "arsenal",
        slotIndex: 0,
        role: "player",
        renderPayload: { gridSize: 16, gridB64: "AAECAw==" },
      },
    }
  );
  assert.equal(duplicateCard.statusCode, 409);
});

test("public read endpoints return seeded collection content", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });
  const headers = { authorization: "Bearer test-token" };
  const params = { collectionId: "premier-league-2026", version: "v1" };

  const collectionBody = { name: "Premier League 2026", gridSize: 16, version: "v1" };
  const indexBody = {
    series: [{ seriesId: "arsenal", name: "Arsenal" }],
    cards: ["arsenal-01"],
    cardMap: {
      "arsenal-01": { seriesId: "arsenal", slotIndex: 0, role: "player" },
    },
  };
  const cardBody = {
    cardId: "arsenal-01",
    seriesId: "arsenal",
    slotIndex: 0,
    role: "player",
    label: "Player One",
    renderPayload: { gridSize: 16, gridB64: "AAECAw==" },
  };

  const collectionUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    { headers, params, body: collectionBody }
  );
  assert.equal(collectionUpload.statusCode, 201);

  const indexUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/index",
    { headers, params, body: indexBody }
  );
  assert.equal(indexUpload.statusCode, 201);

  const cardUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/cards/:cardId",
    {
      headers,
      params: { ...params, cardId: "arsenal-01" },
      body: cardBody,
    }
  );
  assert.equal(cardUpload.statusCode, 201);

  const collection = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    { params }
  );
  assert.equal(collection.statusCode, 200);
  assert.equal(collection.body.name, "Premier League 2026");

  const index = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/:version/index",
    { params }
  );
  assert.equal(index.statusCode, 200);
  assert.deepEqual(index.body.cards, ["arsenal-01"]);

  const card = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/:version/cards/:cardId",
    { params: { ...params, cardId: "arsenal-01" } }
  );
  assert.equal(card.statusCode, 200);
  assert.equal(card.body.cardId, "arsenal-01");

  const bundle = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/:version/bundle",
    { params }
  );
  assert.equal(bundle.statusCode, 200);
  assert.equal(bundle.body.collection.name, "Premier League 2026");
  assert.deepEqual(bundle.body.index.cards, ["arsenal-01"]);
  assert.equal(Array.isArray(bundle.body.cards), true);
  assert.equal(bundle.body.cards.length, 1);
  assert.equal(bundle.body.cards[0].cardId, "arsenal-01");
  assert.deepEqual(bundle.body.missingCardIds, []);

  const missingCard = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/:version/cards/:cardId",
    { params: { ...params, cardId: "arsenal-02" } }
  );
  assert.equal(missingCard.statusCode, 404);
});

test("mutating admin endpoints emit PixPax domain events", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  process.env.PIX_PAX_OVERRIDE_CODE_SECRET = "override-secret-for-tests";
  const events = [];
  pixpaxCollectionRoutes(router, {
    createStore,
    now: () => new Date("2026-02-16T12:00:00.000Z"),
    appendEvent: async (event) => {
      events.push(event);
      return { emitted: true };
    },
  });
  const headers = { authorization: "Bearer test-token" };
  const params = { collectionId: "premier-league-2026", version: "v1" };

  const collectionUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params,
      body: { name: "Premier League 2026", gridSize: 16, version: "v1" },
    }
  );
  assert.equal(collectionUpload.statusCode, 201);

  const indexUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/index",
    {
      headers,
      params,
      body: {
        series: [{ seriesId: "arsenal" }],
        cards: ["arsenal-01"],
        cardMap: {
          "arsenal-01": { seriesId: "arsenal", slotIndex: 0, role: "player" },
        },
      },
    }
  );
  assert.equal(indexUpload.statusCode, 201);

  const cardUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/cards/:cardId",
    {
      headers,
      params: { ...params, cardId: "arsenal-01" },
      body: {
        cardId: "arsenal-01",
        seriesId: "arsenal",
        slotIndex: 0,
        role: "player",
        label: "Player One",
        renderPayload: { gridSize: 16, gridB64: "AAECAw==" },
      },
    }
  );
  assert.equal(cardUpload.statusCode, 201);

  const codeCreate = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/override-codes",
    {
      headers,
      params,
      body: {
        userKey: "school:user:abc123",
        dropId: "week-2026-W07",
        count: 5,
      },
    }
  );
  assert.equal(codeCreate.statusCode, 201);

  assert.equal(events.length, 4);
  assert.deepEqual(
    events.map((event) => event.type),
    [
      PIXPAX_EVENT_TYPES.COLLECTION_CREATED,
      PIXPAX_EVENT_TYPES.SERIES_ADDED,
      PIXPAX_EVENT_TYPES.CARD_ADDED,
      PIXPAX_EVENT_TYPES.GIFTCODE_CREATED,
    ]
  );
  assert.equal(events[0].payload.collectionId, "premier-league-2026");
  assert.equal(events[1].payload.seriesIds[0], "arsenal");
  assert.equal(events[2].payload.cardId, "arsenal-01");
  assert.equal(events[3].payload.codeId.length, 24);
});

test("series retirement endpoint emits event and prevents duplicate retirement", async () => {
  const store = createStore();
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    now: () => new Date("2026-02-16T12:00:00.000Z"),
  });
  const headers = { authorization: "Bearer test-token" };
  const params = { collectionId: "premier-league-2026", version: "v1" };

  const collectionUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params,
      body: { name: "Premier League 2026", gridSize: 16, version: "v1" },
    }
  );
  assert.equal(collectionUpload.statusCode, 201);

  const indexUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/index",
    {
      headers,
      params,
      body: {
        series: [{ seriesId: "arsenal" }],
        cards: ["arsenal-01"],
        cardMap: {
          "arsenal-01": { seriesId: "arsenal", slotIndex: 0, role: "player" },
        },
      },
    }
  );
  assert.equal(indexUpload.statusCode, 201);

  const retire = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/series/:seriesId/retire",
    {
      headers,
      params: { ...params, seriesId: "arsenal" },
      body: { reason: "season-complete" },
    }
  );
  assert.equal(retire.statusCode, 201);
  assert.equal(retire.body.seriesId, "arsenal");

  const duplicate = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/series/:seriesId/retire",
    {
      headers,
      params: { ...params, seriesId: "arsenal" },
      body: { reason: "again" },
    }
  );
  assert.equal(duplicate.statusCode, 409);

  const replay = await store.replayEvents("premier-league-2026", "v1");
  const retirement = replay.find((event) => event.type === PIXPAX_EVENT_TYPES.SERIES_RETIRED);
  assert.ok(retirement);
  assert.equal(retirement.payload.seriesId, "arsenal");
});

test("event schema rejects unsupported event types", async () => {
  assert.throws(
    () =>
      createPixpaxEvent({
        type: "not.real",
        occurredAt: "2026-02-16T12:00:00.000Z",
        payload: {},
      }),
    /Unsupported PixPax event type/
  );
});

test("default appendEvent persists mutation events to event log", async () => {
  const gateway = createMemoryGateway();
  const store = new CollectionContentStore({
    bucket: "content-bucket",
    prefix: "pixpax/collections",
    gateway,
  });
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    now: () => new Date("2026-02-16T12:00:00.000Z"),
  });
  const headers = { authorization: "Bearer test-token" };
  const params = { collectionId: "premier-league-2026", version: "v1" };

  const collectionUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params,
      body: { name: "Premier League 2026", gridSize: 16, version: "v1" },
    }
  );
  assert.equal(collectionUpload.statusCode, 201);

  const indexUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/index",
    {
      headers,
      params,
      body: {
        series: [{ seriesId: "arsenal" }],
        cards: ["arsenal-01"],
        cardMap: {
          "arsenal-01": { seriesId: "arsenal", slotIndex: 0, role: "player" },
        },
      },
    }
  );
  assert.equal(indexUpload.statusCode, 201);

  const cardUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/cards/:cardId",
    {
      headers,
      params: { ...params, cardId: "arsenal-01" },
      body: {
        cardId: "arsenal-01",
        seriesId: "arsenal",
        slotIndex: 0,
        role: "player",
        renderPayload: { gridSize: 16, gridB64: "AAECAw==" },
      },
    }
  );
  assert.equal(cardUpload.statusCode, 201);

  const replay = await store.replayEvents("premier-league-2026", "v1");
  assert.deepEqual(
    replay.map((event) => event.type).sort((a, b) => a.localeCompare(b)),
    [
      PIXPAX_EVENT_TYPES.CARD_ADDED,
      PIXPAX_EVENT_TYPES.COLLECTION_CREATED,
      PIXPAX_EVENT_TYPES.SERIES_ADDED,
    ]
  );
});

test("collection write aborts when event emission fails", async () => {
  const store = createStore();
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, {
    createStore: () => store,
    appendEvent: async () => {
      throw new Error("event sink unavailable");
    },
  });

  const params = { collectionId: "premier-league-2026", version: "v1" };
  const upload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers: { authorization: "Bearer test-token" },
      params,
      body: { name: "Premier League 2026", gridSize: 16, version: "v1" },
    }
  );
  assert.equal(upload.statusCode, 500);

  const readBack = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    { params }
  );
  assert.equal(readBack.statusCode, 404);
});

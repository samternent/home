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

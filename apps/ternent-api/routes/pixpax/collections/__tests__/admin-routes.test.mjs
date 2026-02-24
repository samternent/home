import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync } from "node:crypto";
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
    async invoke(method, path, { body = {}, params = {}, headers = {}, query = {} } = {}) {
      const handler = routes.get(`${method}:${path}`);
      assert.ok(handler, `Missing handler ${method}:${path}`);
      let statusCode = 200;
      let sent;
      const req = { body, params, headers, query };
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

function createIssuerAndReceiptKeyEnv() {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  process.env.ISSUER_PRIVATE_KEY_PEM = privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString();

  const { privateKey: receiptPrivateKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  process.env.PIX_PAX_RECEIPT_PRIVATE_KEY_PEM = receiptPrivateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString();
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

test("admin collections endpoint returns all collection/version refs including unlisted collections", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });
  const headers = { authorization: "Bearer test-token" };

  const putCollection = async (collectionId, version) => {
    const response = await router.invoke(
      "PUT",
      "/v1/pixpax/collections/:collectionId/:version/collection",
      {
        headers,
        params: { collectionId, version },
        body: { name: collectionId, gridSize: 16, version },
      }
    );
    assert.equal(response.statusCode, 201);
  };

  await putCollection("pixel-animals", "v2");
  await putCollection("kid-dragons", "v1");

  const unlistedSetting = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/settings",
    {
      headers,
      params: { collectionId: "kid-dragons" },
      body: { visibility: "unlisted", issuanceMode: "codes-only" },
    }
  );
  assert.equal(unlistedSetting.statusCode, 200);

  const listedSetting = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/settings",
    {
      headers,
      params: { collectionId: "pixel-animals" },
      body: { visibility: "public", issuanceMode: "scheduled" },
    }
  );
  assert.equal(listedSetting.statusCode, 200);

  const response = await router.invoke("GET", "/v1/pixpax/admin/collections", {
    headers,
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.deepEqual(
    response.body.refs.map((entry) => `${entry.collectionId}:${entry.version}`),
    ["kid-dragons:v1", "pixel-animals:v2"]
  );
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

test("collection upload validates optional issuer metadata shape", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });
  const headers = { authorization: "Bearer test-token" };

  const invalidIssuer = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params: { collectionId: "kid-dragons", version: "v1" },
      body: {
        name: "Kid Dragons",
        gridSize: 16,
        issuer: "PixPax",
      },
    }
  );
  assert.equal(invalidIssuer.statusCode, 400);

  const validIssuer = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params: { collectionId: "kid-dragons", version: "v2" },
      body: {
        name: "Kid Dragons",
        gridSize: 16,
        issuer: {
          name: "PixPax",
          avatarUrl: "https://pixpax.xyz/avatar.png",
        },
      },
    }
  );
  assert.equal(validIssuer.statusCode, 201);
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

test("collection-level settings endpoints validate enums and preserve unknown keys", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });
  const headers = { authorization: "Bearer test-token" };

  const invalid = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/settings",
    {
      headers,
      params: { collectionId: "pixel-animals" },
      body: {
        visibility: "friends-only",
        issuanceMode: "weekly",
      },
    }
  );
  assert.equal(invalid.statusCode, 400);

  const saved = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/settings",
    {
      headers,
      params: { collectionId: "pixel-animals" },
      body: {
        visibility: "unlisted",
        issuanceMode: "codes-only",
        customLabel: "dragon-drop",
      },
    }
  );
  assert.equal(saved.statusCode, 200);
  assert.equal(saved.body.settings.visibility, "unlisted");
  assert.equal(saved.body.settings.issuanceMode, "codes-only");
  assert.equal(saved.body.settings.customLabel, "dragon-drop");

  const loaded = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/settings",
    {
      params: { collectionId: "pixel-animals" },
    }
  );
  assert.equal(loaded.statusCode, 200);
  assert.equal(loaded.body.settings.visibility, "unlisted");
  assert.equal(loaded.body.settings.issuanceMode, "codes-only");
  assert.equal(loaded.body.settings.customLabel, "dragon-drop");
});

test("resolve endpoint returns deterministic version, settings, and issuer fallback", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });
  const headers = { authorization: "Bearer test-token" };

  const v1Params = { collectionId: "pixel-animals", version: "v1" };
  const v2Params = { collectionId: "pixel-animals", version: "v2" };
  const collectionBase = { name: "Pixel Animals", gridSize: 16 };

  const upV1 = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params: v1Params,
      body: {
        ...collectionBase,
        issuer: { name: "Sam" },
      },
    }
  );
  assert.equal(upV1.statusCode, 201);

  const upV2 = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params: v2Params,
      body: collectionBase,
    }
  );
  assert.equal(upV2.statusCode, 201);

  const savedSettings = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/settings",
    {
      headers,
      params: { collectionId: "pixel-animals" },
      body: { visibility: "public", issuanceMode: "scheduled" },
    }
  );
  assert.equal(savedSettings.statusCode, 200);

  const resolvedDefault = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/resolve",
    {
      params: { collectionId: "pixel-animals" },
    }
  );
  assert.equal(resolvedDefault.statusCode, 200);
  assert.equal(resolvedDefault.body.collectionId, "pixel-animals");
  assert.equal(resolvedDefault.body.resolvedVersion, "v2");
  assert.equal(resolvedDefault.body.settings.visibility, "public");
  assert.equal(resolvedDefault.body.settings.issuanceMode, "scheduled");
  assert.equal(resolvedDefault.body.issuer.name, "PixPax");

  const resolvedV1 = await router.invoke(
    "GET",
    "/v1/pixpax/collections/:collectionId/resolve",
    {
      params: { collectionId: "pixel-animals" },
      query: { version: "v1" },
    }
  );
  assert.equal(resolvedV1.statusCode, 200);
  assert.equal(resolvedV1.body.resolvedVersion, "v1");
  assert.equal(resolvedV1.body.issuer.name, "Sam");
});

test("catalog endpoint only includes public collections", async () => {
  const router = createRouterHarness();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });
  const headers = { authorization: "Bearer test-token" };

  const seedCollection = async (collectionId, version, visibility) => {
    const upload = await router.invoke(
      "PUT",
      "/v1/pixpax/collections/:collectionId/:version/collection",
      {
        headers,
        params: { collectionId, version },
        body: { name: collectionId, gridSize: 16 },
      }
    );
    assert.equal(upload.statusCode, 201);

    const settings = await router.invoke(
      "PUT",
      "/v1/pixpax/collections/:collectionId/settings",
      {
        headers,
        params: { collectionId },
        body: {
          visibility,
          issuanceMode: "scheduled",
        },
      }
    );
    assert.equal(settings.statusCode, 200);
  };

  await seedCollection("house-animals", "v1", "public");
  await seedCollection("kid-dragons", "v1", "unlisted");

  const catalog = await router.invoke("GET", "/v1/pixpax/collections/catalog");
  assert.equal(catalog.statusCode, 200);
  assert.equal(catalog.body.ok, true);
  assert.equal(Array.isArray(catalog.body.collections), true);
  assert.equal(catalog.body.collections.length, 1);
  assert.equal(catalog.body.collections[0].collectionId, "house-animals");
  assert.equal(catalog.body.collections[0].settings.visibility, "public");
});

test("code token mint response includes label, redeemUrl, and qrSvg", async () => {
  const router = createRouterHarness();
  createIssuerAndReceiptKeyEnv();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });
  const headers = { authorization: "Bearer test-token" };
  const params = { collectionId: "kid-dragons", version: "v1" };

  const collectionUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params,
      body: { name: "Kid Dragons", gridSize: 16, issuer: { name: "PixPax" } },
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
        series: [{ seriesId: "dragons" }],
        cards: ["dragon-001"],
        cardMap: {
          "dragon-001": { seriesId: "dragons", slotIndex: 0, role: "card" },
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
      params: { ...params, cardId: "dragon-001" },
      body: {
        cardId: "dragon-001",
        seriesId: "dragons",
        slotIndex: 0,
        role: "card",
        label: "Dragon One",
        renderPayload: { gridSize: 16, gridB64: "AAECAw==" },
      },
    }
  );
  assert.equal(cardUpload.statusCode, 201);

  const minted = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/override-codes",
    {
      headers,
      params,
      body: {
        kind: "fixed-card",
        cardId: "dragon-001",
        dropId: "dragon-wave",
      },
    }
  );

  assert.equal(minted.statusCode, 201);
  assert.equal(typeof minted.body.token, "string");
  assert.equal(typeof minted.body.tokenHash, "string");
  assert.equal(minted.body.label, "Dragon One");
  assert.equal(typeof minted.body.redeemUrl, "string");
  assert.match(minted.body.redeemUrl, /\/r\//);
  assert.equal(minted.body.qrErrorCorrection, "M");
  assert.equal(minted.body.qrQuietZoneModules, 4);
  assert.equal(typeof minted.body.qrSvg, "string");
  assert.match(minted.body.qrSvg, /<svg/i);

  const resolved = await router.invoke(
    "GET",
    "/v1/pixpax/redeem-code/:codeId",
    {
      params: { codeId: minted.body.codeId },
    }
  );
  assert.equal(resolved.statusCode, 200);
  assert.equal(resolved.body.ok, true);
  assert.equal(resolved.body.codeId, minted.body.codeId);
  assert.equal(resolved.body.token, minted.body.token);
  assert.equal(resolved.body.kind, "fixed-card");

  const missing = await router.invoke(
    "GET",
    "/v1/pixpax/redeem-code/:codeId",
    {
      params: { codeId: "does-not-exist" },
    }
  );
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.body.reason, "code-not-found");
});

test("admin can revoke code ids and resolve reflects revoked status", async () => {
  const router = createRouterHarness();
  createIssuerAndReceiptKeyEnv();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });
  const headers = { authorization: "Bearer test-token" };
  const params = { collectionId: "kid-dragons", version: "v1" };

  const collectionUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params,
      body: { name: "Kid Dragons", gridSize: 16, issuer: { name: "PixPax" } },
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
        series: [{ seriesId: "dragons" }],
        cards: ["dragon-001"],
        cardMap: {
          "dragon-001": { seriesId: "dragons", slotIndex: 0, role: "card" },
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
      params: { ...params, cardId: "dragon-001" },
      body: {
        cardId: "dragon-001",
        seriesId: "dragons",
        slotIndex: 0,
        role: "card",
        label: "Dragon One",
        renderPayload: { gridSize: 16, gridB64: "AAECAw==" },
      },
    }
  );
  assert.equal(cardUpload.statusCode, 201);

  const minted = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/override-codes",
    {
      headers,
      params,
      body: {
        kind: "fixed-card",
        cardId: "dragon-001",
      },
    }
  );
  assert.equal(minted.statusCode, 201);

  const revoke = await router.invoke(
    "POST",
    "/v1/pixpax/admin/codes/:codeId/revoke",
    {
      headers,
      params: { codeId: minted.body.codeId },
      body: { reason: "test-revoke" },
    }
  );
  assert.equal(revoke.statusCode, 200);
  assert.equal(revoke.body.ok, true);
  assert.equal(revoke.body.status, "revoked");
  assert.equal(revoke.body.codeId, minted.body.codeId);

  const resolved = await router.invoke(
    "GET",
    "/v1/pixpax/redeem-code/:codeId",
    {
      params: { codeId: minted.body.codeId },
    }
  );
  assert.equal(resolved.statusCode, 200);
  assert.equal(resolved.body.ok, true);
  assert.equal(resolved.body.status, "revoked");
  assert.equal(resolved.body.codeId, minted.body.codeId);
});

test("code cards endpoint returns shared items dataset as json only", async () => {
  const router = createRouterHarness();
  createIssuerAndReceiptKeyEnv();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
  pixpaxCollectionRoutes(router, { createStore });
  const headers = { authorization: "Bearer test-token" };
  const params = { collectionId: "house-animals", version: "v1" };

  const collectionUpload = await router.invoke(
    "PUT",
    "/v1/pixpax/collections/:collectionId/:version/collection",
    {
      headers,
      params,
      body: {
        name: "House Animals",
        gridSize: 16,
        palette: { id: "house", colors: [0, ...new Array(15).fill(0xffffffff)] },
      },
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
        series: [{ seriesId: "animals" }],
        cards: ["fox-001"],
        cardMap: {
          "fox-001": { seriesId: "animals", slotIndex: 0, role: "card" },
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
      params: { ...params, cardId: "fox-001" },
      body: {
        cardId: "fox-001",
        seriesId: "animals",
        slotIndex: 0,
        role: "card",
        label: "Fox",
        renderPayload: {
          gridSize: 16,
          gridB64: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
        },
      },
    }
  );
  assert.equal(cardUpload.statusCode, 201);

  const jsonResponse = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/code-cards",
    {
      headers,
      params,
      body: {
        kind: "fixed-card",
        cardId: "fox-001",
        quantity: 2,
        format: "json",
      },
    }
  );
  assert.equal(jsonResponse.statusCode, 200);
  assert.equal(jsonResponse.body.ok, true);
  assert.equal(jsonResponse.body.quantity, 2);
  assert.equal(Array.isArray(jsonResponse.body.items), true);
  assert.equal(jsonResponse.body.items.length, 2);
  assert.equal(typeof jsonResponse.body.items[0].token, "string");
  assert.equal(typeof jsonResponse.body.items[0].redeemUrl, "string");
  assert.equal(typeof jsonResponse.body.items[0].qrSvg, "string");
  assert.equal(jsonResponse.body.items[0].label, "Fox");

  const unsupportedPdf = await router.invoke(
    "POST",
    "/v1/pixpax/collections/:collectionId/:version/code-cards",
    {
      headers,
      params,
      body: {
        kind: "pack",
        count: 3,
        quantity: 13,
        format: "pdf",
      },
    }
  );
  assert.equal(unsupportedPdf.statusCode, 400);
  assert.match(String(unsupportedPdf.body?.error || ""), /format must be 'json'/);
});

test("mutating admin endpoints emit PixPax domain events", async () => {
  const router = createRouterHarness();
  createIssuerAndReceiptKeyEnv();
  process.env.PIX_PAX_ADMIN_TOKEN = "test-token";
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
  assert.equal(typeof codeCreate.body.redeemUrl, "string");
  assert.equal(typeof codeCreate.body.qrSvg, "string");
  assert.equal(typeof codeCreate.body.label, "string");

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
  assert.equal(events[3].payload.codeId.length, 16);
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

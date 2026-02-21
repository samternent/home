import assert from "node:assert/strict";
import test from "node:test";
import {
  CollectionContentStore,
  createCollectionContentGatewayFromS3Client,
  createPixpaxContentConfigFromEnv,
} from "../content-store.mjs";

function createMemoryGateway() {
  const objects = new Map();
  const writes = [];
  return {
    objects,
    writes,
    async getObject({ bucket, key }) {
      const id = `${bucket}:${key}`;
      if (!objects.has(id)) {
        throw new Error(`NoSuchKey:${key}`);
      }
      return Buffer.from(objects.get(id));
    },
    async putObject({ bucket, key, body, contentType, cacheControl }) {
      const id = `${bucket}:${key}`;
      objects.set(id, Buffer.from(body));
      writes.push({ bucket, key, contentType, cacheControl });
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

test("CollectionContentStore put/get round-trip and writes JSON content type", async () => {
  const gateway = createMemoryGateway();
  const store = new CollectionContentStore({
    bucket: "content-bucket",
    prefix: "pixpax/collections",
    gateway,
  });

  const collection = { name: "Premier League 2026", gridSize: 16, version: "v1" };
  const index = {
    series: [{ seriesId: "arsenal", label: "Arsenal" }],
    cards: ["arsenal-01"],
    cardMap: { "arsenal-01": { seriesId: "arsenal", slotIndex: 0, role: "player" } },
  };
  const card = {
    cardId: "arsenal-01",
    seriesId: "arsenal",
    slotIndex: 0,
    role: "player",
    renderPayload: { gridSize: 16, gridB64: "AAECAw==" },
  };

  await store.putCollection("premier-league-2026", "v1", collection);
  await store.putIndex("premier-league-2026", "v1", index);
  await store.putCard("premier-league-2026", "v1", "arsenal-01", card);

  const collectionOut = await store.getCollection("premier-league-2026", "v1");
  const indexOut = await store.getIndex("premier-league-2026", "v1");
  const cardOut = await store.getCard("premier-league-2026", "v1", "arsenal-01");

  assert.deepEqual(collectionOut, collection);
  assert.deepEqual(indexOut, index);
  assert.deepEqual(cardOut, card);
  assert.equal(gateway.writes.length, 3);
  assert.equal(gateway.writes[0].contentType, "application/json");
  assert.match(gateway.writes[0].key, /collection\.json$/);
  assert.match(gateway.writes[1].key, /index\.json$/);
  assert.match(gateway.writes[2].key, /cards\/arsenal-01\.json$/);
});

test("CollectionContentStore stores collection-level settings and lists ids/versions", async () => {
  const gateway = createMemoryGateway();
  const store = new CollectionContentStore({
    bucket: "content-bucket",
    prefix: "pixpax/collections",
    gateway,
  });

  await store.putCollection("pixel-animals", "v1", { name: "Pixel Animals", gridSize: 16 });
  await store.putCollection("pixel-animals", "v2", { name: "Pixel Animals", gridSize: 16 });
  await store.putCollection("dragon-club", "v1", { name: "Dragon Club", gridSize: 16 });
  await store.putCollectionSettings("pixel-animals", {
    visibility: "public",
    issuanceMode: "scheduled",
    featured: true,
  });

  const settings = await store.getCollectionSettings("pixel-animals");
  assert.equal(settings.visibility, "public");
  assert.equal(settings.issuanceMode, "scheduled");
  assert.equal(settings.featured, true);

  const versions = await store.listCollectionVersions("pixel-animals");
  assert.deepEqual(versions, ["v1", "v2"]);

  const collectionIds = await store.listCollectionIds();
  assert.deepEqual(collectionIds, ["dragon-club", "pixel-animals"]);
});

test("createCollectionContentGatewayFromS3Client maps not-found errors to NoSuchKey:*", async () => {
  class GetObjectCommand {
    constructor(input) {
      this.input = input;
    }
  }
  class PutObjectCommand {
    constructor(input) {
      this.input = input;
    }
  }

  const sent = [];
  const client = {
    async send(command) {
      sent.push(command.input);
      if ("Body" in command.input) return {};
      const error = new Error("missing");
      error.name = "NoSuchKey";
      throw error;
    },
  };

  const gateway = createCollectionContentGatewayFromS3Client({
    client,
    GetObjectCommand,
    PutObjectCommand,
  });

  await assert.rejects(
    () => gateway.getObject({ bucket: "b", key: "k" }),
    /NoSuchKey:k/
  );

  await gateway.putObject({
    bucket: "b",
    key: "k",
    body: Buffer.from("{}", "utf8"),
    contentType: "application/json",
    cacheControl: "no-store",
  });

  assert.equal(sent.length, 2);
  assert.deepEqual(sent[1], {
    Bucket: "b",
    Key: "k",
    Body: Buffer.from("{}", "utf8"),
    ContentType: "application/json",
    CacheControl: "no-store",
  });
});

test("createPixpaxContentConfigFromEnv reads LEDGER_* vars", () => {
  process.env.LEDGER_S3_ENDPOINT = "https://example.digitaloceanspaces.com";
  process.env.LEDGER_BUCKET = "pixpax-content";
  process.env.LEDGER_CONTENT_PREFIX = "pixpax/collections";
  process.env.LEDGER_ACCESS_KEY_ID = "abc";
  process.env.LEDGER_SECRET_ACCESS_KEY = "def";
  process.env.LEDGER_REGION = "lon1";

  const config = createPixpaxContentConfigFromEnv();
  assert.equal(config.ready, true);
  assert.equal(config.endpoint, "https://example.digitaloceanspaces.com");
  assert.equal(config.bucket, "pixpax-content");
  assert.equal(config.prefix, "pixpax/collections");
  assert.equal(config.region, "lon1");
});

test("CollectionContentStore appends events and replays in deterministic order", async () => {
  const gateway = createMemoryGateway();
  const store = new CollectionContentStore({
    bucket: "content-bucket",
    prefix: "pixpax/collections",
    gateway,
  });

  const eventA = {
    eventId: "evt_a",
    type: "collection.created",
    occurredAt: "2026-02-16T12:00:00.000Z",
    source: "test",
    payload: {
      collectionId: "premier-league-2026",
      version: "v1",
    },
  };
  const eventB = {
    eventId: "evt_b",
    type: "series.added",
    occurredAt: "2026-02-16T12:00:01.000Z",
    source: "test",
    payload: {
      collectionId: "premier-league-2026",
      version: "v1",
      seriesIds: ["arsenal"],
    },
  };

  const firstWrite = await store.putEventIfAbsent(
    "premier-league-2026",
    "v1",
    eventA
  );
  const duplicateWrite = await store.putEventIfAbsent(
    "premier-league-2026",
    "v1",
    eventA
  );
  const secondWrite = await store.putEventIfAbsent(
    "premier-league-2026",
    "v1",
    eventB
  );

  assert.equal(firstWrite.created, true);
  assert.equal(duplicateWrite.created, false);
  assert.equal(secondWrite.created, true);

  const listed = await store.listEvents("premier-league-2026", "v1");
  assert.equal(listed.events.length, 2);
  assert.deepEqual(
    listed.events.map((event) => event.eventId),
    ["evt_a", "evt_b"]
  );

  const replayed = await store.replayEvents("premier-league-2026", "v1");
  assert.deepEqual(
    replayed.map((event) => event.type),
    ["collection.created", "series.added"]
  );
});

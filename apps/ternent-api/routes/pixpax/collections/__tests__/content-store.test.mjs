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

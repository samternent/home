import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createHmac } from "crypto";

const DEFAULT_SERVER_SECRET = "stickerbook-demo-secret";
const __dirname = dirname(fileURLToPath(import.meta.url));

function getServerSecret() {
  return process.env.SERVER_SECRET || DEFAULT_SERVER_SECRET;
}

function getPackSigningSecret() {
  return process.env.PACK_SIGNING_SECRET || getServerSecret();
}

function createHmacRng(secret, seed) {
  let counter = 0;
  return function next() {
    const hmac = createHmac("sha256", secret);
    hmac.update(`${seed}:${counter}`);
    const digest = hmac.digest();
    counter += 1;
    const int =
      (digest[0] << 24) |
      (digest[1] << 16) |
      (digest[2] << 8) |
      digest[3];
    return (int >>> 0) / 0xffffffff;
  };
}

function pickWeighted(rng, weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const roll = rng() * total;
  let cursor = 0;
  for (const [key, value] of entries) {
    cursor += value;
    if (roll <= cursor) return key;
  }
  return entries[entries.length - 1][0];
}

function base64UrlEncode(payload) {
  return Buffer.from(payload).toString("base64url");
}

function signPayload(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function loadCatalogue(seriesId) {
  const filename = `series-${seriesId}.catalogue.json`;
  const filepath = join(
    __dirname,
    "..",
    "..",
    "data/stickerbook",
    filename
  );
  return JSON.parse(readFileSync(filepath, "utf8"));
}

function derivePackId(secret, seed) {
  return createHmac("sha256", secret).update(seed).digest("hex").slice(0, 16);
}

function getCatalogueEntries(catalogue) {
  if (Array.isArray(catalogue.creatures)) return catalogue.creatures;
  if (Array.isArray(catalogue.stickers)) return catalogue.stickers;
  return [];
}

function pickFinishForCard(catalogue, rarity, rng) {
  const finishOptions = ["base", "foil", "holo", "sparkle", "prismatic"];
  const styleType = catalogue.styleType || "creature";
  if (styleType === "letters") {
    if (rarity === "mythic") {
      return rng() > 0.5 ? "foil" : "sparkle";
    }
    return "base";
  }
  return finishOptions[Math.floor(rng() * finishOptions.length)];
}

export default function stickerbookRoutes(router) {
  router.get("/v1/stickerbook/catalogue", (req, res) => {
    const seriesId = req.query.seriesId || "S1";
    const catalogue = loadCatalogue(seriesId);
    res.status(200).send(catalogue);
  });

  router.get("/v1/stickerbook/pack", (req, res) => {
    const seriesId = req.query.seriesId || "S1";
    const periodId = req.query.periodId || "week-0";
    const profile = req.query.profile || "anon";
    const devSeed = req.query.devSeed || "";

    const catalogue = loadCatalogue(seriesId);
    const catalogueVersion =
      req.query.catalogueVersion || catalogue.version || "1.0.0";

    const seed = `${seriesId}|${catalogueVersion}|${periodId}|${profile}|${devSeed}`;
    const rng = createHmacRng(getServerSecret(), seed);
    const packId = derivePackId(getServerSecret(), seed);

    const entries = getCatalogueEntries(catalogue);
    const creaturesByRarity = entries.reduce((acc, creature) => {
      acc[creature.rarity] = acc[creature.rarity] || [];
      acc[creature.rarity].push(creature);
      return acc;
    }, {});

    const packSize = 5;
    const cards = [];
    const usedCreatureIds = new Set();

    while (cards.length < packSize) {
      const rarity = pickWeighted(rng, catalogue.rarityWeights);
      const pool = creaturesByRarity[rarity] || entries;
      const creature = pool[Math.floor(rng() * pool.length)];
      if (usedCreatureIds.has(creature.id)) continue;
      usedCreatureIds.add(creature.id);

      const finish = pickFinishForCard(catalogue, rarity, rng);
      cards.push({
        creatureId: creature.id,
        rarity,
        finish,
      });
    }

    const payload = {
      packId,
      seriesId,
      catalogueVersion,
      periodId,
      profile,
      ...(devSeed ? { devSeed } : {}),
      cards,
      createdAt: new Date().toISOString(),
    };

    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = signPayload(encodedPayload, getPackSigningSecret());
    const token = `${encodedPayload}.${signature}`;

    res.status(200).send({
      pack: payload,
      token,
    });
  });
}

import { canonicalStringify, getEntrySigningPayload } from "@ternent/concord-protocol";
import { createHash, randomBytes } from "crypto";

const DEFAULT_RARITY_WEIGHTS = {
  common: 0.7,
  uncommon: 0.2,
  rare: 0.08,
  mythic: 0.02,
};

const DEFAULT_RARITY_RULES = {
  common: { accessoryChance: 0, frameChance: 0, fxChance: 0, identityChance: 0 },
  uncommon: { accessoryChance: 0.2, frameChance: 0.15, fxChance: 0.05, identityChance: 0.1 },
  rare: { accessoryChance: 0.6, frameChance: 0.4, fxChance: 0.15, identityChance: 0.2 },
  mythic: { accessoryChance: 1, frameChance: 0.8, fxChance: 0.5, identityChance: 0.35 },
};

function clampInt(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function createNonceHex(length = 16) {
  return randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

export function hashCanonical(value) {
  const canonical = canonicalStringify(value);
  return createHash("sha256").update(canonical).digest("hex");
}

export function hashString(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function derivePackSeed(params) {
  return hashCanonical({
    serverSecret: params.serverSecret,
    clientNonce: params.clientNonce,
    packRequestId: params.packRequestId,
    seriesId: params.seriesId,
    themeId: params.themeId,
  });
}

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRng(seed) {
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
}

function toSortedIds(list = []) {
  return list
    .map((entry) => (typeof entry === "string" ? entry : entry?.id))
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)));
}

function pick(rng, list) {
  if (!list.length) return null;
  return list[Math.floor(rng() * list.length)];
}

function pickWeighted(rng, weights) {
  const entries = Object.entries(weights);
  if (!entries.length) return "common";
  const total = entries.reduce((sum, [, weight]) => sum + Number(weight || 0), 0);
  if (!total) return entries[0][0];
  const roll = rng() * total;
  let cursor = 0;
  for (const [key, weight] of entries) {
    cursor += Number(weight || 0);
    if (roll <= cursor) return key;
  }
  return entries[entries.length - 1][0];
}

function resolveRarityRules(kitJson, rarity) {
  return (
    kitJson?.rarityRules?.[rarity] ||
    kitJson?.rarityRules?.default ||
    DEFAULT_RARITY_RULES[rarity] ||
    DEFAULT_RARITY_RULES.common
  );
}

function normalizeCandidates(kitJson) {
  const candidates = Array.isArray(kitJson?.candidates)
    ? kitJson.candidates.map((candidate) => ({
        archetypeId: candidate.archetypeId ?? null,
        bodyId: candidate.bodyId ?? null,
        eyesId: candidate.eyesId ?? null,
        identityId: candidate.identityId ?? null,
        accessoryId: candidate.accessoryId ?? null,
        frameId: candidate.frameId ?? null,
        fxId: candidate.fxId ?? null,
        paletteId: candidate.paletteId ?? null,
      }))
    : [];
  return candidates.sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b))
  );
}

function ensureExplicitNull(value) {
  return value === undefined ? null : value;
}

export function generatePack(params) {
  const count = clampInt(params.count || 0);
  const rng = createSeededRng(
    `${params.packSeed}:${params.seriesId}:${params.themeId}:${params.algoVersion}`
  );
  const kitJson = params.kitJson || {};
  const rarityWeights = kitJson.rarityWeights || DEFAULT_RARITY_WEIGHTS;
  const candidates = normalizeCandidates(kitJson);
  const archetypeIds = toSortedIds(kitJson.archetypes || kitJson.bodies);
  const bodyIds = toSortedIds(kitJson.bodies);
  const eyesIds = toSortedIds(kitJson.eyes);
  const identityIds = toSortedIds(kitJson.identities);
  const accessoryIds = toSortedIds(kitJson.accessories);
  const frameIds = toSortedIds(kitJson.frames);
  const fxIds = toSortedIds(kitJson.fx);
  const paletteIds = toSortedIds(kitJson.palettes);

  const entries = [];

  for (let index = 0; index < count; index += 1) {
    const rarity = pickWeighted(
      rng,
      Object.fromEntries(
        Object.entries(rarityWeights).sort(([a], [b]) =>
          a.localeCompare(b)
        )
      )
    );
    const rules = resolveRarityRules(kitJson, rarity);
    const candidate = candidates.length ? pick(rng, candidates) : null;
    const identityRoll = rng() <= Number(rules.identityChance || 0);
    const accessoryRoll = rng() <= Number(rules.accessoryChance || 0);
    const frameRoll = rng() <= Number(rules.frameChance || 0);
    const fxRoll = rng() <= Number(rules.fxChance || 0);

    const entry = {
      index,
      archetypeId: ensureExplicitNull(
        candidate?.archetypeId ?? pick(rng, archetypeIds)
      ),
      bodyId: ensureExplicitNull(candidate?.bodyId ?? pick(rng, bodyIds)),
      eyesId: ensureExplicitNull(candidate?.eyesId ?? pick(rng, eyesIds)),
      identityId: ensureExplicitNull(
        candidate?.identityId ??
          (identityRoll ? pick(rng, identityIds) : null)
      ),
      accessoryId: ensureExplicitNull(
        candidate?.accessoryId ??
          (accessoryRoll ? pick(rng, accessoryIds) : null)
      ),
      frameId: ensureExplicitNull(
        candidate?.frameId ?? (frameRoll ? pick(rng, frameIds) : null)
      ),
      fxId: ensureExplicitNull(
        candidate?.fxId ?? (fxRoll ? pick(rng, fxIds) : null)
      ),
      paletteId: ensureExplicitNull(
        candidate?.paletteId ?? pick(rng, paletteIds)
      ),
      rarity,
    };

    entries.push(entry);
  }

  return entries;
}

export function deriveKitFromCatalogue(catalogue) {
  const entries = Array.isArray(catalogue?.creatures)
    ? catalogue.creatures
    : Array.isArray(catalogue?.stickers)
    ? catalogue.stickers
    : [];

  const candidates = entries.map((entry) => ({
    archetypeId: entry?.attributes?.archetypeId ?? null,
    bodyId: entry?.attributes?.bodyId ?? null,
    eyesId: entry?.attributes?.eyesId ?? null,
    identityId: entry?.attributes?.identityId ?? null,
    accessoryId: entry?.attributes?.accessoryId ?? null,
    frameId: entry?.attributes?.frameId ?? null,
    fxId: entry?.attributes?.fxId ?? null,
    paletteId: entry?.paletteId ?? null,
  }));

  return {
    id: catalogue?.themeId ?? "stickerbook",
    version: catalogue?.themeVersion ?? catalogue?.version ?? "1.0.0",
    palettes: catalogue?.palettes || [],
    rarityWeights: catalogue?.rarityWeights || DEFAULT_RARITY_WEIGHTS,
    rarityRules: catalogue?.rarityRules || null,
    candidates,
  };
}

export async function computeMerkleRoot(entries) {
  const leafHashes = entries.map((entry) => hashCanonical(entry));
  if (!leafHashes.length) return hashCanonical([]);
  let level = leafHashes.slice();
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? level[i];
      next.push(hashCanonical({ left, right }));
    }
    level = next;
  }
  return level[0];
}

export function generateProof(entries, index) {
  const leafHashes = entries.map((entry) => hashCanonical(entry));
  if (index < 0 || index >= leafHashes.length) return [];
  let idx = index;
  let level = leafHashes.slice();
  const proof = [];

  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? level[i];
      const pairHash = hashCanonical({ left, right });
      next.push(pairHash);

      if (i === idx || i + 1 === idx) {
        if (idx === i) {
          proof.push({ position: "right", hash: right });
        } else {
          proof.push({ position: "left", hash: left });
        }
        idx = Math.floor(i / 2);
      }
    }
    level = next;
  }

  return proof;
}

export function verifyProof(entry, proof, packRoot) {
  let current = hashCanonical(entry);
  for (const step of proof || []) {
    if (step.position === "left") {
      current = hashCanonical({ left: step.hash, right: current });
    } else {
      current = hashCanonical({ left: current, right: step.hash });
    }
  }
  return current === packRoot;
}

export function deriveStickerId(packRoot, index) {
  return hashCanonical({ packRoot, index });
}

export function getSigningPayload(entry) {
  return getEntrySigningPayload(entry);
}

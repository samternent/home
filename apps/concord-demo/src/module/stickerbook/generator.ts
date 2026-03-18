const DEFAULT_RARITY_WEIGHTS = {
  common: 0.7,
  uncommon: 0.2,
  rare: 0.08,
  mythic: 0.02,
};

const DEFAULT_RARITY_RULES = {
  common: {
    accessoryChance: 0,
    frameChance: 0,
    fxChance: 0,
    identityChance: 0,
  },
  uncommon: {
    accessoryChance: 0.2,
    frameChance: 0.15,
    fxChance: 0.05,
    identityChance: 0.1,
  },
  rare: {
    accessoryChance: 0.6,
    frameChance: 0.4,
    fxChance: 0.15,
    identityChance: 0.2,
  },
  mythic: {
    accessoryChance: 1,
    frameChance: 0.8,
    fxChance: 0.5,
    identityChance: 0.35,
  },
};

function clampInt(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function xmur3(str: string) {
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

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createSeededRng(seed: string) {
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
}

function toSortedIds(list: any[] = []) {
  return list
    .map((entry) => (typeof entry === "string" ? entry : entry?.id))
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)));
}

function pick<T>(rng: () => number, list: T[]): T | null {
  if (!list.length) return null;
  return list[Math.floor(rng() * list.length)];
}

function pickWeighted(rng: () => number, weights: Record<string, number>) {
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

function resolveRarityRules(kitJson: any, rarity: string) {
  return (
    kitJson?.rarityRules?.[rarity] ||
    kitJson?.rarityRules?.default ||
    (DEFAULT_RARITY_RULES as Record<string, any>)[rarity] ||
    DEFAULT_RARITY_RULES.common
  );
}

function normalizeCandidates(kitJson: any) {
  const candidates = Array.isArray(kitJson?.candidates)
    ? kitJson.candidates.map((candidate: any) => ({
        archetypeId: candidate.archetypeId ?? null,
        bodyId: candidate.bodyId ?? null,
        eyesId: candidate.eyesId ?? null,
        identityId: candidate.identityId ?? null,
        accessoryId: candidate.accessoryId ?? null,
        frameId: candidate.frameId ?? null,
        fxId: candidate.fxId ?? null,
        paletteId: candidate.paletteId ?? null,
        rarity: candidate.rarity ?? null,
      }))
    : [];
  return candidates.sort((a: any, b: any) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b))
  );
}

function ensureExplicitNull<T>(value: T | undefined | null) {
  return value === undefined ? null : value;
}

export type StickerEntry = {
  index: number;
  archetypeId: string;
  bodyId: string;
  eyesId: string;
  identityId: string | null;
  accessoryId: string | null;
  frameId: string | null;
  fxId: string | null;
  paletteId: string;
  rarity: "common" | "uncommon" | "rare" | "mythic";
};

export function generatePack(params: {
  packSeed: string;
  seriesId: string;
  themeId: string;
  count: number;
  algoVersion: string;
  kitJson: any;
}): StickerEntry[] {
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

  const entries: StickerEntry[] = [];

  for (let index = 0; index < count; index += 1) {
    const rarity = pickWeighted(
      rng,
      Object.fromEntries(
        Object.entries(rarityWeights).sort(([a], [b]) => a.localeCompare(b))
      )
    ) as StickerEntry["rarity"];
    const rules = resolveRarityRules(kitJson, rarity);
    const rarityCandidates = candidates.filter(
      (candidate: any) => candidate.rarity === rarity
    );
    const candidatePool = rarityCandidates.length ? rarityCandidates : candidates;
    const candidate = candidatePool.length ? pick(rng, candidatePool) : null;
    const identityRoll = rng() <= Number(rules.identityChance || 0);
    const accessoryRoll = rng() <= Number(rules.accessoryChance || 0);
    const frameRoll = rng() <= Number(rules.frameChance || 0);
    const fxRoll = rng() <= Number(rules.fxChance || 0);

    entries.push({
      index,
      archetypeId: ensureExplicitNull(
        candidate?.archetypeId ?? pick(rng, archetypeIds)
      ) as string,
      bodyId: ensureExplicitNull(
        candidate?.bodyId ?? pick(rng, bodyIds)
      ) as string,
      eyesId: ensureExplicitNull(
        candidate?.eyesId ?? pick(rng, eyesIds)
      ) as string,
      identityId: ensureExplicitNull(
        candidate?.identityId ??
          (identityRoll ? pick(rng, identityIds) : null)
      ) as string | null,
      accessoryId: ensureExplicitNull(
        candidate?.accessoryId ??
          (accessoryRoll ? pick(rng, accessoryIds) : null)
      ) as string | null,
      frameId: ensureExplicitNull(
        candidate?.frameId ?? (frameRoll ? pick(rng, frameIds) : null)
      ) as string | null,
      fxId: ensureExplicitNull(
        candidate?.fxId ?? (fxRoll ? pick(rng, fxIds) : null)
      ) as string | null,
      paletteId: ensureExplicitNull(
        candidate?.paletteId ?? pick(rng, paletteIds)
      ) as string,
      rarity,
    });
  }

  return entries;
}

export function deriveKitFromCatalogue(catalogue: any) {
  const entries = Array.isArray(catalogue?.creatures)
    ? catalogue.creatures
    : Array.isArray(catalogue?.stickers)
    ? catalogue.stickers
    : [];

  const candidates = entries.map((entry: any) => ({
    archetypeId: entry?.attributes?.archetypeId ?? null,
    bodyId: entry?.attributes?.bodyId ?? null,
    eyesId: entry?.attributes?.eyesId ?? null,
    identityId: entry?.attributes?.identityId ?? null,
    accessoryId: entry?.attributes?.accessoryId ?? null,
    frameId: entry?.attributes?.frameId ?? null,
    fxId: entry?.attributes?.fxId ?? null,
    paletteId: entry?.paletteId ?? null,
    rarity: entry?.rarity ?? null,
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

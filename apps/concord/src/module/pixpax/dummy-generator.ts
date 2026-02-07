import type {
  Collection,
  PackPalette16,
  Sticker,
  StickerArt16,
  StickerMeta,
} from "./sticker-types";
import { packIndicesToIdx4Base64 } from "./pixel";
import { hashStickerArt } from "./hash";

const TRANSPARENT = 0x00000000;

const BASE_PALETTE: number[] = [
  TRANSPARENT,
  0xff111111, 0xffffffff, 0xffef4444, 0xff22c55e, 0xff3b82f6, 0xfff59e0b,
  0xffa855f7, 0xff06b6d4, 0xfff97316, 0xff84cc16, 0xffec4899, 0xff8b5cf6,
  0xfff5d0fe, 0xffbae6fd, 0xfffde68a,
];

const COLLECTION_CANDIDATES = [
  { id: "critters-club", name: "Critters Club" },
  { id: "pixel-garden", name: "Pixel Garden" },
  { id: "city-lights", name: "City Lights" },
  { id: "retro-arcade", name: "Retro Arcade" },
];

const TAG_SETS = [
  ["animal", "cute"],
  ["retro", "arcade"],
  ["nature", "garden"],
  ["city", "night"],
  ["funny", "collectible"],
];

type Rarity = StickerMeta["rarity"];
type Finish = StickerMeta["finish"];

function xmur3(input: string) {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function seed() {
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

function createRng(seed: string) {
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
}

export function createDeterministicRng(seed: string) {
  return createRng(seed);
}

function hashHex12(value: string): string {
  const seedFn = xmur3(value);
  const n1 = seedFn().toString(16).padStart(8, "0");
  const n2 = seedFn().toString(16).padStart(8, "0");
  return `${n1}${n2}`.slice(0, 12);
}

function pickWeighted<T>(rng: () => number, pairs: Array<[T, number]>): T {
  const total = pairs.reduce((sum, [, weight]) => sum + weight, 0);
  const roll = rng() * total;
  let cursor = 0;
  for (const [value, weight] of pairs) {
    cursor += weight;
    if (roll <= cursor) return value;
  }
  return pairs[pairs.length - 1][0];
}

function pickRarity(rng: () => number): Rarity {
  return pickWeighted(rng, [
    ["common", 0.7],
    ["rare", 0.2],
    ["epic", 0.09],
    ["legendary", 0.01],
  ]);
}

function pickFinish(rng: () => number, rarity: Rarity): Finish {
  const shinyChanceByRarity: Record<Rarity, number> = {
    common: 0.02,
    rare: 0.06,
    epic: 0.12,
    legendary: 0.25,
  };
  const shiny = rng() < shinyChanceByRarity[rarity];
  if (!shiny) return "matte";
  return pickWeighted(rng, [
    ["holo", 0.65],
    ["gold", 0.2],
    ["silver", 0.15],
  ]);
}

function setPixel(indices: Uint8Array, x: number, y: number, colorIndex: number) {
  if (x < 0 || x >= 16 || y < 0 || y >= 16) return;
  indices[y * 16 + x] = colorIndex & 0x0f;
}

function drawChecker(indices: Uint8Array, fg: number, bg: number) {
  for (let y = 2; y < 14; y += 1) {
    for (let x = 2; x < 14; x += 1) {
      const even = (x + y) % 2 === 0;
      setPixel(indices, x, y, even ? fg : bg);
    }
  }
}

function drawStripes(indices: Uint8Array, fg: number) {
  for (let y = 1; y < 15; y += 1) {
    for (let x = 1; x < 15; x += 1) {
      if ((x + y) % 3 === 0) setPixel(indices, x, y, fg);
    }
  }
}

function drawFace(indices: Uint8Array, skin: number, eye: number, mouth: number) {
  for (let y = 3; y < 13; y += 1) {
    for (let x = 3; x < 13; x += 1) setPixel(indices, x, y, skin);
  }
  setPixel(indices, 6, 7, eye);
  setPixel(indices, 9, 7, eye);
  for (let x = 6; x <= 9; x += 1) setPixel(indices, x, 10, mouth);
}

function drawDots(indices: Uint8Array, rng: () => number, color: number) {
  for (let i = 0; i < 64; i += 1) {
    const x = Math.floor(rng() * 16);
    const y = Math.floor(rng() * 16);
    setPixel(indices, x, y, color);
  }
}

function drawBlob(indices: Uint8Array, rng: () => number, color: number) {
  const cx = 8 + Math.floor(rng() * 3) - 1;
  const cy = 8 + Math.floor(rng() * 3) - 1;
  const radius = 4 + Math.floor(rng() * 3);
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius + (rng() - 0.5) * 1.6) setPixel(indices, x, y, color);
    }
  }
}

function rotatePalette(offset: number): number[] {
  const opaque = BASE_PALETTE.slice(1);
  const next = new Array(opaque.length);
  for (let i = 0; i < opaque.length; i += 1) {
    next[i] = opaque[(i + offset) % opaque.length];
  }
  return [TRANSPARENT, ...next];
}

function buildPalette(seed: string, collectionId: string): PackPalette16 {
  const rng = createRng(`${seed}:${collectionId}:palette`);
  const offset = Math.floor(rng() * 15);
  return {
    id: `pal_${hashHex12(`${seed}:${collectionId}:palette`)}`,
    colors: rotatePalette(offset),
  };
}

function buildArt(seed: string, patternIndex: number): StickerArt16 {
  const rng = createRng(seed);
  const indices = new Uint8Array(16 * 16);

  const c1 = 1 + Math.floor(rng() * 6);
  const c2 = 7 + Math.floor(rng() * 4);
  const c3 = 11 + Math.floor(rng() * 4);

  switch (patternIndex % 5) {
    case 0:
      drawChecker(indices, c1, c2);
      break;
    case 1:
      drawStripes(indices, c1);
      break;
    case 2:
      drawFace(indices, c2, c1, c3);
      break;
    case 3:
      drawDots(indices, rng, c3);
      break;
    default:
      drawBlob(indices, rng, c2);
      break;
  }

  return {
    v: 1,
    w: 16,
    h: 16,
    fmt: "idx4",
    px: packIndicesToIdx4Base64(indices),
  };
}

function splitCounts(total: number, buckets: number): number[] {
  const each = Math.floor(total / buckets);
  const counts = new Array(buckets).fill(each);
  let remainder = total - each * buckets;
  let i = 0;
  while (remainder > 0) {
    counts[i] += 1;
    remainder -= 1;
    i = (i + 1) % buckets;
  }
  return counts;
}

export async function generateDummyCollections(
  seed: string,
  count: number
): Promise<Collection[]> {
  const normalizedSeed = String(seed || "pixpax-dummy");
  const total = Math.max(1, Math.min(500, Math.floor(count || 30)));
  const collectionCount = Math.max(2, Math.min(4, Math.ceil(total / 15)));
  const chosen = COLLECTION_CANDIDATES.slice(0, collectionCount);
  const counts = splitCounts(total, collectionCount);

  const collections: Collection[] = [];

  for (let collectionIndex = 0; collectionIndex < chosen.length; collectionIndex += 1) {
    const entry = chosen[collectionIndex];
    const stickers: Sticker[] = [];
    const targetCount = counts[collectionIndex];
    const collectionRng = createRng(`${normalizedSeed}:${entry.id}:meta`);
    const palette = buildPalette(normalizedSeed, entry.id);

    for (let i = 0; i < targetCount; i += 1) {
      const rarity = pickRarity(collectionRng);
      const finish = pickFinish(collectionRng, rarity);
      const shiny = finish !== "matte";
      const id = `stk_${hashHex12(`${normalizedSeed}:${entry.id}:${i}`)}`;
      const series = `Series ${1 + (i % 3)}`;
      const tagSet = TAG_SETS[(collectionIndex + i) % TAG_SETS.length];
      const art = buildArt(`${normalizedSeed}:${entry.id}:art:${i}`, i);
      const contentHash = await hashStickerArt(art);

      const meta: StickerMeta = {
        id,
        contentHash,
        name: `${entry.name} #${String(i + 1).padStart(3, "0")}`,
        collectionId: entry.id,
        collectionName: entry.name,
        series,
        tags: tagSet,
        rarity,
        finish,
        shiny,
        createdAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
      };

      stickers.push({ meta, art });
    }

    collections.push({
      id: entry.id,
      name: entry.name,
      series: `Volume ${collectionIndex + 1}`,
      palette,
      stickers,
    });
  }

  return collections;
}

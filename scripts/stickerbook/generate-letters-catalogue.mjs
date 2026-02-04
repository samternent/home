import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { createHmac } from "crypto";

const OUTPUT_PATH =
  process.env.OUTPUT_PATH ||
  join(
    process.cwd(),
    "apps/ternent-api/data/stickerbook/series/series-SERIES-L1.catalogue.json"
  );

const SERIES_ID = "SERIES-L1";
const SERIES_SEED = "stickerbook-series-L1";
const VERSION = "1.0.0";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const palettes = [
  {
    id: "sunrise",
    background: "#FDE68A",
    foreground: "#1E3A8A",
    accent: "#FCA5A5",
  },
  {
    id: "bubblegum",
    background: "#FBCFE8",
    foreground: "#1F2937",
    accent: "#FDE68A",
  },
  {
    id: "minty",
    background: "#A7F3D0",
    foreground: "#1E3A8A",
    accent: "#F472B6",
  },
  {
    id: "sky",
    background: "#BFDBFE",
    foreground: "#1E293B",
    accent: "#FDE68A",
  },
  {
    id: "tangerine",
    background: "#FDBA74",
    foreground: "#1F2937",
    accent: "#93C5FD",
  },
  {
    id: "berry",
    background: "#FCA5A5",
    foreground: "#111827",
    accent: "#FDE68A",
  },
  {
    id: "lavender",
    background: "#DDD6FE",
    foreground: "#1F2937",
    accent: "#FBCFE8",
  },
  {
    id: "seafoam",
    background: "#99F6E4",
    foreground: "#1E293B",
    accent: "#FCA5A5",
  },
];

const shapes = ["round", "pill"];

function createHmacRng(seed) {
  let counter = 0;
  return function next() {
    const hmac = createHmac("sha256", SERIES_SEED);
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

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function luminance(hex) {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)
    .map((v) => parseInt(v, 16) / 255);
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(colorA, colorB) {
  const l1 = luminance(colorA);
  const l2 = luminance(colorB);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function scoreSticker(palette) {
  const contrast = contrastRatio(palette.background, palette.foreground);
  const accentContrast = contrastRatio(
    palette.background,
    palette.accent
  );
  const contrastScore = Math.min((contrast - 3) / 5, 1);
  const accentScore = Math.min((accentContrast - 2) / 4, 1);
  return Math.max(0, contrastScore * 0.8 + accentScore * 0.2);
}

function pickEyesForUncommon(letter) {
  const rng = createHmacRng(`${SERIES_ID}:${letter}:eyes`);
  return rng() > 0.5 ? "dots" : "none";
}

function pickAccentForUncommon(letter) {
  const rng = createHmacRng(`${SERIES_ID}:${letter}:accent`);
  return rng() > 0.5 ? "cheeks" : "none";
}

const candidates = [];

for (const letter of LETTERS) {
  const letterSeed = `${SERIES_ID}:${letter}`;
  const rng = createHmacRng(letterSeed);
  const letterCandidates = [];
  for (let i = 0; i < 12; i += 1) {
    const palette = pick(rng, palettes);
    const shape = pick(rng, shapes);
    const score = scoreSticker(palette);
    if (score < 0.4) continue;
    letterCandidates.push({
      letter,
      palette,
      shape,
      score,
    });
  }
  letterCandidates.sort((a, b) => b.score - a.score);
  const best = letterCandidates[0];
  if (!best) {
    throw new Error(`No valid candidate for letter ${letter}`);
  }
  candidates.push(best);
}

const sorted = [...candidates].sort((a, b) => b.score - a.score);
const rarityByLetter = new Map();

sorted.forEach((entry, index) => {
  let rarity = "common";
  if (index === 0) rarity = "mythic";
  else if (index < 4) rarity = "rare";
  else if (index < 10) rarity = "uncommon";
  rarityByLetter.set(entry.letter, rarity);
});

const stickers = candidates.map((entry, index) => {
  const rarity = rarityByLetter.get(entry.letter) || "common";
  let eyes = "none";
  let accent = "none";
  if (rarity === "uncommon") {
    eyes = pickEyesForUncommon(entry.letter);
    accent = eyes === "dots" ? "none" : pickAccentForUncommon(entry.letter);
    if (eyes === "none" && accent === "none") {
      eyes = "dots";
    }
  }
  if (rarity === "rare" || rarity === "mythic") {
    eyes = "dots";
    accent = "cheeks";
  }

  return {
    id: `L1-${entry.letter}`,
    name: `Letter ${entry.letter}`,
    rarity,
    attributes: {
      letter: entry.letter,
      shape: entry.shape,
      eyes,
      paletteId: entry.palette.id,
      accent,
    },
  };
});

const catalogue = {
  seriesId: SERIES_ID,
  styleType: "letters",
  version: VERSION,
  generatedAt: new Date().toISOString(),
  seed: SERIES_SEED,
  rarityWeights: {
    common: 0.62,
    uncommon: 0.23,
    rare: 0.12,
    mythic: 0.03,
  },
  palettes,
  stickers,
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(catalogue, null, 2));

console.log(`Generated ${stickers.length} letter stickers to ${OUTPUT_PATH}.`);

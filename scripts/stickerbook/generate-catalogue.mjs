import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { createHmac } from "crypto";

const OUTPUT_PATH =
  process.env.OUTPUT_PATH ||
  join(
    process.cwd(),
    "apps/ternent-api/data/stickerbook/series/series-S1.catalogue.json"
  );

const SERIES_ID = "S1";
const SERIES_SEED = "stickerbook-series-S1";
const CANDIDATE_COUNT = Number(process.env.CANDIDATE_COUNT || 20000);
const TARGET_COUNT = Number(process.env.TARGET_COUNT || 200);
const VERSION = "1.0.0";

const palettes = [
  {
    id: "sunburst",
    name: "Sunburst",
    colors: ["#F2C94C", "#F2994A", "#EB5757", "#2F80ED"],
  },
  {
    id: "pond",
    name: "Pond",
    colors: ["#56CCF2", "#2D9CDB", "#27AE60", "#6FCF97"],
  },
  {
    id: "nebula",
    name: "Nebula",
    colors: ["#9B51E0", "#BB6BD9", "#2D9CDB", "#56CCF2"],
  },
  {
    id: "ember",
    name: "Ember",
    colors: ["#FF6B6B", "#F06595", "#FFD43B", "#F76707"],
  },
  {
    id: "orchard",
    name: "Orchard",
    colors: ["#A7F3D0", "#34D399", "#FDE68A", "#FCA5A5"],
  },
  {
    id: "shadow",
    name: "Shadow",
    colors: ["#111827", "#374151", "#9CA3AF", "#F9FAFB"],
  },
  {
    id: "coral",
    name: "Coral",
    colors: ["#FF9F1C", "#FFBF69", "#CBF3F0", "#2EC4B6"],
  },
  {
    id: "garden",
    name: "Garden",
    colors: ["#2F855A", "#68D391", "#F6E05E", "#ED8936"],
  },
];

const bodyShapes = ["round", "bean", "diamond", "squircle", "orb"];
const eyeTypes = ["dot", "oval", "star", "spark", "sleepy"];
const patternTypes = ["spots", "stripes", "blush", "gradient", "none"];
const accentTypes = ["horns", "fin", "leaf", "tuft", "tail"];

const syllables = [
  "la",
  "zu",
  "ra",
  "mi",
  "ko",
  "ta",
  "lo",
  "shi",
  "va",
  "no",
  "pi",
  "ki",
];

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

function contrastScore(colorA, colorB) {
  const l1 = luminance(colorA);
  const l2 = luminance(colorB);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.min((contrast - 1) / 6, 1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createName(rng) {
  const parts = 2 + Math.floor(rng() * 2);
  let name = "";
  for (let i = 0; i < parts; i += 1) {
    name += pick(rng, syllables);
  }
  return name[0].toUpperCase() + name.slice(1);
}

function scoreCreature(meta) {
  const contrast = contrastScore(meta.colors.primary, meta.colors.secondary);
  const coverage = clamp(1 - Math.abs(meta.body.scale - 0.72) * 2.2, 0, 1);
  const balance = meta.pattern.symmetry ? 1 : 0.55;
  return contrast * 0.45 + coverage * 0.35 + balance * 0.2;
}

const candidates = [];
const paletteCounts = new Map();
const shapeCounts = new Map();
const signatureSet = new Set();

for (let i = 0; i < CANDIDATE_COUNT; i += 1) {
  const seed = `${SERIES_ID}:${i}`;
  const rng = createHmacRng(seed);
  const palette = pick(rng, palettes);
  const bodyShape = pick(rng, bodyShapes);
  const pattern = pick(rng, patternTypes);
  const accent = pick(rng, accentTypes);
  const eyes = pick(rng, eyeTypes);

  const signature = `${palette.id}|${bodyShape}|${pattern}|${accent}|${eyes}`;
  if (signatureSet.has(signature)) continue;

  const colorRoll = [...palette.colors].sort(() => rng() - 0.5);
  const colors = {
    primary: colorRoll[0],
    secondary: colorRoll[1],
    accent: colorRoll[2],
    highlight: colorRoll[3],
  };

  const body = {
    shape: bodyShape,
    scale: 0.55 + rng() * 0.35,
    wobble: rng() * 0.15,
  };

  const patternMeta = {
    type: pattern,
    density: 0.25 + rng() * 0.55,
    symmetry: rng() > 0.3,
  };

  const meta = {
    seed,
    paletteId: palette.id,
    body,
    eyes,
    accent,
    pattern: patternMeta,
    colors,
  };

  const score = scoreCreature(meta);
  if (score < 0.5) continue;

  const paletteCount = paletteCounts.get(palette.id) || 0;
  const shapeCount = shapeCounts.get(bodyShape) || 0;
  const diversityPenalty = clamp((paletteCount + shapeCount) * 0.003, 0, 0.2);
  const finalScore = score - diversityPenalty;

  candidates.push({
    id: seed,
    meta,
    score: finalScore,
  });

  signatureSet.add(signature);
  paletteCounts.set(palette.id, paletteCount + 1);
  shapeCounts.set(bodyShape, shapeCount + 1);
}

candidates.sort((a, b) => b.score - a.score);

const selected = candidates.slice(0, TARGET_COUNT);

const mythicCutoff = Math.floor(selected.length * 0.03);
const rareCutoff = Math.floor(selected.length * 0.15);
const uncommonCutoff = Math.floor(selected.length * 0.4);

const creatures = selected.map((entry, index) => {
  let rarity = "common";
  if (index < mythicCutoff) rarity = "mythic";
  else if (index < rareCutoff) rarity = "rare";
  else if (index < uncommonCutoff) rarity = "uncommon";

  const nameRng = createHmacRng(`${entry.meta.seed}:name`);
  return {
    id: `${SERIES_ID}-${String(index + 1).padStart(4, "0")}`,
    seed: entry.meta.seed,
    name: createName(nameRng),
    rarity,
    paletteId: entry.meta.paletteId,
    attributes: {
      body: entry.meta.body,
      eyes: entry.meta.eyes,
      accent: entry.meta.accent,
      pattern: entry.meta.pattern,
      colors: entry.meta.colors,
    },
  };
});

const catalogue = {
  seriesId: SERIES_ID,
  styleType: "creature",
  version: VERSION,
  generatedAt: new Date().toISOString(),
  seed: SERIES_SEED,
  rarityWeights: {
    common: 0.62,
    uncommon: 0.25,
    rare: 0.1,
    mythic: 0.03,
  },
  palettes,
  creatures,
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(catalogue, null, 2));

console.log(
  `Generated ${creatures.length} creatures to ${OUTPUT_PATH} from ${CANDIDATE_COUNT} candidates.`
);

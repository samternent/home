<script setup lang="ts">
import { computed } from "vue";
import { buildSparklePositions, hashToRange } from "./stickerbook";

type NaturalCreature = {
  id: string;
  seed: string;
  rarity: string;
  paletteId: string;
  attributes: {
    grid: string;
    gridSize: number;
    bg: number;
    symmetry: string;
  };
};

type Palette = {
  id: string;
  colors: string[];
};

const props = defineProps<{
  creature: NaturalCreature;
  palettes: Palette[];
  finish?: string;
  packId?: string;
  missing?: boolean;
  compact?: boolean;
}>();

function decodeBase64Url(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const normalized = padded + "=".repeat(padLength);
  const bin = atob(normalized);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function decodeGrid(data: string, size: number) {
  const bytes = decodeBase64Url(data);
  const total = size * size;
  const values = new Array(total).fill(0);
  for (let i = 0; i < total; i += 1) {
    const byte = bytes[Math.floor(i / 2)] || 0;
    values[i] = i % 2 === 0 ? (byte >> 4) & 0x0f : byte & 0x0f;
  }
  const grid: number[][] = [];
  for (let y = 0; y < size; y += 1) {
    grid.push(values.slice(y * size, (y + 1) * size));
  }
  return grid;
}

type Point = [number, number];

type PathResult = {
  d: string;
  key: string;
};

function buildPaths(
  grid: number[][],
  isFilled: (value: number) => boolean,
  scale: number,
  offset: number
): PathResult[] {
  const size = grid.length;
  const edges = new Map<string, Point[]>();

  const addEdge = (start: Point, end: Point) => {
    const key = `${start[0]},${start[1]}`;
    const list = edges.get(key) || [];
    list.push(end);
    edges.set(key, list);
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!isFilled(grid[y][x])) continue;
      const top = y === 0 || !isFilled(grid[y - 1][x]);
      const right = x === size - 1 || !isFilled(grid[y][x + 1]);
      const bottom = y === size - 1 || !isFilled(grid[y + 1][x]);
      const left = x === 0 || !isFilled(grid[y][x - 1]);

      if (top) addEdge([x, y], [x + 1, y]);
      if (right) addEdge([x + 1, y], [x + 1, y + 1]);
      if (bottom) addEdge([x + 1, y + 1], [x, y + 1]);
      if (left) addEdge([x, y + 1], [x, y]);
    }
  }

  const paths: PathResult[] = [];
  let guard = 0;

  while (edges.size && guard < 5000) {
    guard += 1;
    const startKey = edges.keys().next().value as string;
    const [sx, sy] = startKey.split(",").map(Number);
    const start: Point = [sx, sy];
    const points: Point[] = [start];
    let current = start;

    while (guard < 5000) {
      const key = `${current[0]},${current[1]}`;
      const nextList = edges.get(key);
      if (!nextList || nextList.length === 0) {
        edges.delete(key);
        break;
      }
      const next = nextList.pop() as Point;
      if (nextList.length === 0) edges.delete(key);
      points.push(next);
      current = next;
      if (current[0] === start[0] && current[1] === start[1]) {
        break;
      }
      guard += 1;
    }

    if (points.length < 3) continue;

    const d = points
      .map((point, index) => {
        const x = offset + point[0] * scale;
        const y = offset + point[1] * scale;
        return `${index === 0 ? "M" : "L"}${x} ${y}`;
      })
      .join(" ");

    paths.push({
      d: `${d} Z`,
      key: `${sx}-${sy}-${paths.length}`,
    });
  }

  return paths;
}

const palette = computed(() => {
  const match = props.palettes.find((entry) => entry.id === props.creature.paletteId);
  return (
    match || {
      id: "fallback",
      colors: ["#f8fafc", "#1f2937", "#64748b", "#94a3b8", "#e2e8f0"],
    }
  );
});

const gridSize = computed(() => props.creature.attributes.gridSize || 16);
const grid = computed(() =>
  decodeGrid(props.creature.attributes.grid, gridSize.value)
);
const bgIndex = computed(() => props.creature.attributes.bg ?? 0);

const cellSize = computed(() => Math.floor(128 / gridSize.value));
const offset = computed(() => (200 - gridSize.value * cellSize.value) / 2);

const basePaths = computed(() =>
  buildPaths(
    grid.value,
    (value) => value !== bgIndex.value,
    cellSize.value,
    offset.value
  )
);

const colorLayers = computed(() => {
  const layers = [
    { index: 2, opacity: 0.7 },
    { index: 3, opacity: 0.72 },
    { index: 4, opacity: 0.75 },
  ];
  return layers
    .map((layer) => ({
      ...layer,
      paths: buildPaths(
        grid.value,
        (value) => value === layer.index,
        cellSize.value,
        offset.value
      ),
    }))
    .filter((layer) => layer.paths.length > 0);
});

const highlightSpots = computed(() =>
  buildSparklePositions(`${props.creature.id}:highlight`, 3)
);

const finishSeed = computed(() =>
  props.packId ? `${props.packId}:${props.creature.id}` : props.creature.id
);
const finishAngle = computed(() =>
  Math.floor(hashToRange(finishSeed.value, 10, 70))
);
const shimmerHue = computed(() =>
  Math.floor(hashToRange(`${finishSeed.value}:hue`, 180, 320))
);
const sparklePositions = computed(() =>
  buildSparklePositions(`${finishSeed.value}:sparkle`, 7)
);
const shimmerScale = computed(() =>
  hashToRange(`${finishSeed.value}:scale`, 0.9, 1.1)
);
const foilOpacity = computed(() =>
  hashToRange(`${finishSeed.value}:foil`, 0.16, 0.32)
);

const showFinish = computed(() => props.finish && props.finish !== "base");
const finishKind = computed(() => props.finish || "base");

const gradientId = computed(() => `natural-finish-${props.creature.id}`);
const maskId = computed(() => `natural-mask-${props.creature.id}`);
const finishMaskId = computed(() => `natural-finish-mask-${props.creature.id}`);
const shadowId = computed(() => `natural-shadow-${props.creature.id}`);

const baseFill = computed(() =>
  props.missing ? "#cbd5f5" : palette.value.colors[1]
);
const secondaryFill = computed(() =>
  props.missing ? "#e2e8f0" : palette.value.colors[2]
);
const accentFill = computed(() =>
  props.missing ? "#e2e8f0" : palette.value.colors[3]
);
const highlightFill = computed(() =>
  props.missing ? "#f1f5f9" : palette.value.colors[4]
);
const outlineStroke = computed(() => (props.missing ? "#475569" : "#0f172a"));
const frameFill = computed(() =>
  props.missing ? "#e2e8f0" : palette.value.colors[0]
);
</script>

<template>
  <div
    class="sticker-natural"
    :class="[
      compact ? 'sticker-compact' : 'sticker-full',
      missing ? 'sticker-missing' : '',
      finishKind !== 'base' ? `finish-${finishKind}` : '',
    ]"
  >
    <svg viewBox="0 0 200 200" class="sticker-svg" aria-hidden="true">
      <defs>
        <linearGradient
          :id="gradientId"
          :gradientTransform="`rotate(${finishAngle}) scale(${shimmerScale})`"
        >
          <stop offset="0%" :stop-color="`hsla(${shimmerHue},90%,72%,1)`" />
          <stop offset="50%" :stop-color="`hsla(${shimmerHue + 30},90%,65%,1)`" />
          <stop offset="100%" :stop-color="`hsla(${shimmerHue + 60},90%,60%,1)`" />
        </linearGradient>
        <filter :id="shadowId" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.25" />
        </filter>
        <mask :id="maskId">
          <rect width="200" height="200" fill="white" />
          <rect v-if="missing" width="200" height="200" fill="black" opacity="0.35" />
        </mask>
        <mask :id="finishMaskId" maskUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="black" />
          <path
            v-for="path in basePaths"
            :key="`mask-${path.key}`"
            :d="path.d"
            fill="white"
          />
        </mask>
      </defs>

      <g :mask="`url(#${maskId})`">
        <rect
          x="16"
          y="18"
          width="168"
          height="168"
          rx="32"
          :fill="frameFill"
          :stroke="outlineStroke"
          stroke-width="4"
        />

        <g
          v-if="showFinish"
          :opacity="finishKind === 'foil' ? foilOpacity : 0.25"
          :mask="`url(#${finishMaskId})`"
        >
          <rect x="18" y="20" width="164" height="164" :fill="`url(#${gradientId})`" />
        </g>

        <g :filter="`url(#${shadowId})`">
          <path
            v-for="path in basePaths"
            :key="path.key"
            :d="path.d"
            :fill="baseFill"
            :stroke="outlineStroke"
            stroke-width="6"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <path
            v-for="path in basePaths"
            :key="`inline-${path.key}`"
            :d="path.d"
            fill="none"
            :stroke="outlineStroke"
            stroke-width="2.5"
            stroke-linejoin="round"
            stroke-linecap="round"
            opacity="0.6"
          />
        </g>

        <g opacity="0.8">
          <template v-for="layer in colorLayers" :key="`layer-${layer.index}`">
            <path
              v-for="path in layer.paths"
              :key="`layer-${layer.index}-${path.key}`"
              :d="path.d"
              :fill="layer.index === 2 ? secondaryFill : layer.index === 3 ? accentFill : highlightFill"
              :opacity="layer.opacity"
            />
          </template>
        </g>

        <g opacity="0.35">
          <circle
            v-for="(spot, index) in highlightSpots"
            :key="`spot-${index}`"
            :cx="spot.x"
            :cy="spot.y"
            :r="spot.r * 0.9"
            :fill="highlightFill"
          />
        </g>
        <g v-if="finishKind === 'sparkle'" opacity="0.55">
          <circle
            v-for="(sparkle, index) in sparklePositions"
            :key="`sparkle-${index}`"
            :cx="sparkle.x"
            :cy="sparkle.y"
            :r="sparkle.r"
            fill="#ffffff"
          />
        </g>
      </g>
    </svg>

    <div class="sticker-label" v-if="!compact">
      <span class="sticker-name">{{ creature.id }}</span>
      <span class="sticker-rarity">{{ creature.rarity }}</span>
    </div>
  </div>
</template>

<style scoped>
.sticker-natural {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  border: 3px solid rgba(15, 23, 42, 0.12);
}

.sticker-svg {
  width: 150px;
  height: 150px;
}

.sticker-compact {
  padding: 0.4rem;
  gap: 0.2rem;
}

.sticker-compact .sticker-svg {
  width: 110px;
  height: 110px;
}

.sticker-full .sticker-svg {
  width: 170px;
  height: 170px;
}

.sticker-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sticker-name {
  font-weight: 700;
  font-size: 0.75rem;
  color: #0f172a;
}

.sticker-rarity {
  font-size: 0.65rem;
  color: #475569;
}

.sticker-missing {
  opacity: 0.55;
  box-shadow: none;
}

.finish-holo .sticker-svg,
.finish-prismatic .sticker-svg {
  filter: saturate(1.1) brightness(1.05);
}
</style>

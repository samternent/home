<script setup lang="ts">
import { computed } from "vue";
import { buildSparklePositions, hashToRange } from "./stickerbook";

type PixelCreature = {
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
  creature: PixelCreature;
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

const palette = computed(() => {
  const match = props.palettes.find((entry) => entry.id === props.creature.paletteId);
  return (
    match || {
      id: "fallback",
      colors: ["#f8fafc", "#1f2937", "#64748b"],
    }
  );
});

const gridSize = computed(() => props.creature.attributes.gridSize || 8);
const grid = computed(() =>
  decodeGrid(props.creature.attributes.grid, gridSize.value)
);
const bgIndex = computed(() => props.creature.attributes.bg ?? 0);

const spriteBounds = 164;
const pixelSize = computed(() => spriteBounds / gridSize.value);
const offset = computed(() => (200 - spriteBounds) / 2);

function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "");
  return [
    parseInt(cleaned.slice(0, 2), 16),
    parseInt(cleaned.slice(2, 4), 16),
    parseInt(cleaned.slice(4, 6), 16),
  ];
}

function rgbToHex(rgb: number[]) {
  return (
    "#" +
    rgb.map((value) => Math.max(0, Math.min(255, Math.round(value))))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
  );
}

function mixColor(a: string, b: string, amount: number) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex([
    ar + (br - ar) * amount,
    ag + (bg - ag) * amount,
    ab + (bb - ab) * amount,
  ]);
}

const fillColors = computed(() => {
  if (props.missing) {
    return ["#e2e8f0", "#94a3b8", "#64748b"];
  }
  const base = palette.value.colors;
  const background = base[0];
  const foreground = base[1] || "#0f172a";
  const detail = base[2] || foreground;
  const boostedFg = mixColor(foreground, "#000000", 0.12);
  const softenedDetail = mixColor(detail, foreground, 0.45);
  return [background, boostedFg, softenedDetail];
});

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
  buildSparklePositions(`${finishSeed.value}:sparkle`, 5)
);

const showFinish = computed(() => props.finish && props.finish !== "base");
const finishKind = computed(() => props.finish || "base");

const gradientId = computed(() => `pixel-finish-${props.creature.id}`);
const maskId = computed(() => `pixel-mask-${props.creature.id}`);
const finishMaskId = computed(() => `pixel-finish-mask-${props.creature.id}`);
const shadowId = computed(() => `pixel-shadow-${props.creature.id}`);

const outlineStroke = computed(() => (props.missing ? "#64748b" : "#0f172a"));
const backgroundFill = computed(() =>
  props.missing ? fillColors.value[0] : "transparent"
);
const pixelFill = (cell: number) =>
  cell === bgIndex.value && !props.missing
    ? "transparent"
    : fillColors.value[cell] || fillColors.value[1];
</script>

<template>
  <div
    class="sticker-pixel"
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
          :gradientTransform="`rotate(${finishAngle})`"
        >
          <stop offset="0%" :stop-color="`hsla(${shimmerHue},90%,72%,1)`" />
          <stop offset="50%" :stop-color="`hsla(${shimmerHue + 30},90%,65%,1)`" />
          <stop offset="100%" :stop-color="`hsla(${shimmerHue + 60},90%,60%,1)`" />
        </linearGradient>
        <filter :id="shadowId" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="dilated" />
          <feFlood :flood-color="outlineStroke" flood-opacity="0.9" result="flood" />
          <feComposite in="flood" in2="dilated" operator="in" result="outline" />
          <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.22" result="shadow" />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <mask :id="maskId">
          <rect width="200" height="200" fill="white" />
          <rect v-if="missing" width="200" height="200" fill="black" opacity="0.35" />
        </mask>
        <mask :id="finishMaskId" maskUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="black" />
          <g shape-rendering="crispEdges">
            <template v-for="(row, y) in grid" :key="`mask-row-${y}`">
              <rect
                v-for="(cell, x) in row"
                :key="`mask-px-${x}-${y}`"
                v-if="cell !== bgIndex"
                :x="offset + x * pixelSize"
                :y="offset + y * pixelSize"
                :width="pixelSize"
                :height="pixelSize"
                fill="white"
              />
            </template>
          </g>
        </mask>
      </defs>

      <g :mask="`url(#${maskId})`">
        <rect
          x="18"
          y="18"
          width="164"
          height="164"
          rx="20"
          :fill="backgroundFill"
          :stroke="outlineStroke"
          stroke-width="4"
        />

        <g v-if="showFinish" opacity="0.25" :mask="`url(#${finishMaskId})`">
          <rect
            x="20"
            y="20"
            width="160"
            height="160"
            :fill="`url(#${gradientId})`"
          />
        </g>

        <g :filter="`url(#${shadowId})`" shape-rendering="crispEdges">
          <template v-for="(row, y) in grid" :key="`row-${y}`">
            <rect
              v-for="(cell, x) in row"
              :key="`px-${x}-${y}`"
              :x="offset + x * pixelSize"
              :y="offset + y * pixelSize"
              :width="pixelSize"
              :height="pixelSize"
              :fill="pixelFill(cell)"
            />
          </template>
        </g>
        <g v-if="finishKind === 'sparkle'" opacity="0.6">
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
.sticker-pixel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem;
  background: #fff;
  border-radius: 18px;
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
</style>

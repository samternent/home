<script setup lang="ts">
import { computed } from "vue";
import { buildSparklePositions, hashToRange } from "./stickerbook";
import kitAnimal from "./kits/8bit-animal-archetype.json";
import kitSprites from "./kits/8bit-sprites.json";

type Sticker8Bit = {
  id: string;
  seed: string;
  rarity: string;
  paletteId: string;
  attributes: {
    size: number;
    bodyId: string;
    eyesId: string;
    accessoryId?: string | null;
    frameId?: string | null;
    fxId?: string | null;
  };
};

type Palette = {
  id: string;
  colors: string[];
};

type SpriteLayer = {
  id: string;
  data: string[];
};

const props = defineProps<{
  sticker: Sticker8Bit;
  palettes?: Palette[];
  finish?: string;
  packId?: string;
  kitId?: string;
  missing?: boolean;
  compact?: boolean;
  status?: string;
}>();

const kits = {
  "8bit-sprites": kitSprites,
  "8bit-animal-archetype": kitAnimal,
} as const;

const activeKit = computed(() => {
  if (props.kitId && props.kitId in kits) {
    return kits[props.kitId as keyof typeof kits];
  }
  return kits["8bit-sprites"];
});

const charMap: Record<string, number> = {
  "#": 1,
  "*": 2,
  "+": 3,
};

function decodeLayer(layer: SpriteLayer, size: number) {
  return layer.data.map((row) =>
    row.split("").map((char) => charMap[char] || 0)
  );
}

function applyLayer(
  base: number[][],
  layer: number[][],
  size: number
): number[][] {
  const next = base.map((row) => row.slice());
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (layer[y][x] > 0) next[y][x] = layer[y][x];
    }
  }
  return next;
}

const spriteSize = computed(
  () => props.sticker.attributes.size || activeKit.value.size
);

const palette = computed(() => {
  const pool = props.palettes?.length ? props.palettes : activeKit.value.palettes;
  const match = pool.find((entry) => entry.id === props.sticker.paletteId);
  return (
    match || {
      id: "fallback",
      colors: ["#f8fafc", "#111827", "#475569", "#e2e8f0"],
    }
  );
});

const missingPalette = ["#0f172a", "#334155", "#475569", "#94a3b8"];

const fillColors = computed(() =>
  props.missing ? missingPalette : palette.value.colors
);

function findLayer(list: SpriteLayer[], id?: string | null) {
  if (!id) return null;
  return list.find((entry) => entry.id === id) || null;
}

const bodyLayer = computed(() =>
  findLayer(activeKit.value.bodies as SpriteLayer[], props.sticker.attributes.bodyId)
);
const eyesLayer = computed(() =>
  findLayer(activeKit.value.eyes as SpriteLayer[], props.sticker.attributes.eyesId)
);
const accessoryLayer = computed(() =>
  findLayer(
    activeKit.value.accessories as SpriteLayer[],
    props.sticker.attributes.accessoryId
  )
);
const frameLayer = computed(() =>
  findLayer(activeKit.value.frames as SpriteLayer[], props.sticker.attributes.frameId)
);
const fxLayer = computed(() =>
  findLayer(activeKit.value.fx as SpriteLayer[], props.sticker.attributes.fxId)
);

const baseGrid = computed(() => {
  const size = spriteSize.value;
  let grid = Array.from({ length: size }, () => new Array(size).fill(0));
  const layers = [frameLayer.value, bodyLayer.value, eyesLayer.value, accessoryLayer.value].filter(
    Boolean
  ) as SpriteLayer[];
  for (const layer of layers) {
    grid = applyLayer(grid, decodeLayer(layer, size), size);
  }
  return grid;
});

const fxGrid = computed(() => {
  const size = spriteSize.value;
  if (!fxLayer.value) return null;
  return decodeLayer(fxLayer.value, size);
});

const spriteBounds = 164;
const pixelSize = computed(() => spriteBounds / spriteSize.value);
const offset = computed(() => (200 - spriteBounds) / 2);

const finishSeed = computed(() =>
  props.packId ? `${props.packId}:${props.sticker.id}` : props.sticker.id
);
const finishAngle = computed(() =>
  Math.floor(hashToRange(finishSeed.value, 10, 70))
);
const shimmerHue = computed(() =>
  Math.floor(hashToRange(`${finishSeed.value}:hue`, 180, 320))
);
const mythicPhaseSeconds = computed(() =>
  Math.floor(hashToRange(`${finishSeed.value}:phase`, 0, 9))
);
const sparklePositions = computed(() => {
  const count =
    props.sticker.rarity === "mythic"
      ? 12
      : finishKind.value === "sparkle"
      ? 6
      : 4;
  return buildSparklePositions(`${finishSeed.value}:sparkle`, count);
});

const showFinish = computed(() => props.finish && props.finish !== "base");
const finishKind = computed(() => props.finish || "base");
const showSheen = computed(() =>
  ["foil", "holo", "prismatic"].includes(finishKind.value)
);
const showGlow = computed(() =>
  ["sparkle", "holo", "prismatic"].includes(finishKind.value)
);
const showMythicLayer = computed(() => props.sticker.rarity === "mythic");

const gradientId = computed(() => `sprite-finish-${props.sticker.id}`);
const gradientIdAlt = computed(() => `sprite-finish-alt-${props.sticker.id}`);
const maskId = computed(() => `sprite-mask-${props.sticker.id}`);
const finishMaskId = computed(() => `sprite-finish-mask-${props.sticker.id}`);
const shadowId = computed(() => `sprite-shadow-${props.sticker.id}`);
const glowId = computed(() => `sprite-glow-${props.sticker.id}`);

const outlineStroke = computed(() => (props.missing ? "#334155" : "#0f172a"));
const backgroundFill = computed(() =>
  props.missing ? fillColors.value[0] : "transparent"
);
const pixelFill = (cell: number) =>
  cell === 0 && !props.missing
    ? "transparent"
    : fillColors.value[cell] || fillColors.value[1];
</script>

<template>
  <div
    class="sticker-8bit"
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
          <stop offset="0%" :stop-color="`hsla(${shimmerHue},90%,72%,1)`">
            <animate
              v-if="showMythicLayer"
              attributeName="stop-color"
              :values="`hsla(${shimmerHue},90%,72%,1);hsla(${shimmerHue + 90},90%,70%,1);hsla(${shimmerHue + 180},90%,72%,1);hsla(${shimmerHue},90%,72%,1)`"
              dur="9s"
              :begin="`-${mythicPhaseSeconds}s`"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" :stop-color="`hsla(${shimmerHue + 30},90%,65%,1)`">
            <animate
              v-if="showMythicLayer"
              attributeName="stop-color"
              :values="`hsla(${shimmerHue + 30},90%,65%,1);hsla(${shimmerHue + 120},90%,63%,1);hsla(${shimmerHue + 210},90%,65%,1);hsla(${shimmerHue + 30},90%,65%,1)`"
              dur="9s"
              :begin="`-${mythicPhaseSeconds}s`"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" :stop-color="`hsla(${shimmerHue + 60},90%,60%,1)`">
            <animate
              v-if="showMythicLayer"
              attributeName="stop-color"
              :values="`hsla(${shimmerHue + 60},90%,60%,1);hsla(${shimmerHue + 150},90%,58%,1);hsla(${shimmerHue + 240},90%,60%,1);hsla(${shimmerHue + 60},90%,60%,1)`"
              dur="9s"
              :begin="`-${mythicPhaseSeconds}s`"
              repeatCount="indefinite"
            />
          </stop>
          <animateTransform
            v-if="showSheen"
            attributeName="gradientTransform"
            type="rotate"
            :from="`${finishAngle} 0.5 0.5`"
            :to="`${finishAngle + 360} 0.5 0.5`"
            dur="8s"
            repeatCount="indefinite"
          />
        </linearGradient>
        <linearGradient
          :id="gradientIdAlt"
          gradientTransform="rotate(140)"
        >
          <stop offset="0%" stop-color="rgba(255,255,255,0)" />
          <stop offset="45%" stop-color="rgba(255,255,255,0.12)" />
          <stop offset="55%" stop-color="rgba(255,255,255,0.4)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
          <animateTransform
            v-if="showSheen"
            attributeName="gradientTransform"
            type="rotate"
            from="140 0.5 0.5"
            to="500 0.5 0.5"
            dur="9s"
            repeatCount="indefinite"
          />
        </linearGradient>
        <filter :id="shadowId" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.25" />
        </filter>
        <filter :id="glowId" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0"
          />
          <feBlend in="SourceGraphic" in2="blur" mode="screen" />
        </filter>
        <mask :id="maskId">
          <rect width="200" height="200" fill="white" />
          <rect v-if="missing" width="200" height="200" fill="black" opacity="0.4" />
        </mask>
        <mask :id="finishMaskId" maskUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="black" />
          <g shape-rendering="crispEdges">
            <template v-for="(row, y) in baseGrid" :key="`mask-row-${y}`">
              <template v-for="(cell, x) in row" :key="`mask-px-${x}-${y}`">
                <rect
                  v-if="cell !== 0"
                  :x="offset + x * pixelSize"
                  :y="offset + y * pixelSize"
                  :width="pixelSize"
                  :height="pixelSize"
                  fill="white"
                />
              </template>
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

        <g
          v-if="showGlow || showSheen || showMythicLayer"
          :mask="`url(#${finishMaskId})`"
        >
          <g v-if="showGlow" opacity="0.35">
            <rect
              x="18"
              y="18"
              width="164"
              height="164"
              rx="22"
              :fill="`url(#${gradientId})`"
              :filter="`url(#${glowId})`"
            />
          </g>
          <g v-if="showSheen" opacity="0.35">
            <rect
              x="20"
              y="20"
              width="160"
              height="160"
              :fill="`url(#${gradientId})`"
            />
            <rect
              x="20"
              y="20"
              width="160"
              height="160"
              :fill="`url(#${gradientIdAlt})`"
            />
          </g>
          <g v-if="showMythicLayer" opacity="0.35">
            <rect
              x="16"
              y="16"
              width="168"
              height="168"
              rx="24"
              :fill="`url(#${gradientId})`"
              :filter="`url(#${glowId})`"
            />
            <animate
              attributeName="opacity"
              values="0.28;0.45;0.28"
              dur="8s"
              repeatCount="indefinite"
            />
          </g>
        </g>

        <g :filter="`url(#${shadowId})`" shape-rendering="crispEdges">
          <template v-for="(row, y) in baseGrid" :key="`row-${y}`">
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

        <g v-if="fxGrid" opacity="0.6" shape-rendering="crispEdges">
          <template v-for="(row, y) in fxGrid" :key="`fx-${y}`">
            <template v-for="(cell, x) in row" :key="`fx-${x}-${y}`">
              <rect
                v-if="cell !== 0"
                :x="offset + x * pixelSize"
                :y="offset + y * pixelSize"
                :width="pixelSize"
                :height="pixelSize"
                :fill="fillColors[cell] || fillColors[3]"
              />
            </template>
          </template>
        </g>
        <g
          v-if="finishKind === 'sparkle' || finishKind === 'prismatic' || props.sticker.rarity === 'mythic'"
          opacity="0.7"
        >
          <animateTransform
            v-if="props.sticker.rarity === 'mythic'"
            attributeName="transform"
            type="translate"
            values="0 0; 4 -3; -4 3; 0 0"
            dur="7s"
            repeatCount="indefinite"
          />
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
      <span class="sticker-name">{{ sticker.id }}</span>
      <span class="sticker-rarity">{{ sticker.rarity }}</span>
      <span v-if="status" class="sticker-status">{{ status }}</span>
    </div>
  </div>
</template>

<style scoped>
.sticker-8bit {
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

.sticker-status {
  font-size: 0.6rem;
  color: #0f172a;
  opacity: 0.7;
}

.sticker-missing {
  opacity: 0.6;
  box-shadow: none;
}
</style>

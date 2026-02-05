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
  const pool = props.palettes?.length
    ? props.palettes
    : activeKit.value.palettes;
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
  findLayer(
    activeKit.value.bodies as SpriteLayer[],
    props.sticker.attributes.bodyId
  )
);
const eyesLayer = computed(() =>
  findLayer(
    activeKit.value.eyes as SpriteLayer[],
    props.sticker.attributes.eyesId
  )
);
const accessoryLayer = computed(() =>
  findLayer(
    activeKit.value.accessories as SpriteLayer[],
    props.sticker.attributes.accessoryId
  )
);
const frameLayer = computed(() =>
  findLayer(
    activeKit.value.frames as SpriteLayer[],
    props.sticker.attributes.frameId
  )
);
const fxLayer = computed(() =>
  findLayer(activeKit.value.fx as SpriteLayer[], props.sticker.attributes.fxId)
);

const baseGrid = computed(() => {
  const size = spriteSize.value;
  let grid = Array.from({ length: size }, () => new Array(size).fill(0));
  const layers = [
    frameLayer.value,
    bodyLayer.value,
    eyesLayer.value,
    accessoryLayer.value,
  ].filter(Boolean) as SpriteLayer[];
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
const mythicGradientId = computed(
  () => `sprite-mythic-gradient-${props.sticker.id}`
);
const rareGradientId = computed(
  () => `sprite-rare-gradient-${props.sticker.id}`
);
const backdropDotsId = computed(
  () => `sprite-backdrop-dots-${props.sticker.id}`
);

const outlineStroke = computed(() =>
  props.missing ? "#334155" : "transparent"
);
const backgroundFill = computed(() =>
  props.missing ? fillColors.value[0] : "transparent"
);
const pixelFill = (cell: number) =>
  cell === 0 && !props.missing
    ? "transparent"
    : fillColors.value[cell] || fillColors.value[1];
const rarityBackdrop = computed(() => {
  if (props.missing) return null;
  const rarity = props.sticker?.rarity;
  if (rarity === "mythic") return `url(#${mythicGradientId.value})`;
  if (rarity === "rare") return `url(#${rareGradientId.value})`;
  if (rarity === "uncommon") {
    return "color-mix(in srgb, var(--ui-accent) 14%, var(--ui-bg))";
  }
  return null;
});
const showMythicDots = computed(
  () => !props.missing && props.sticker?.rarity === "mythic"
);
const showMythicGlow = computed(
  () => !props.missing && props.sticker?.rarity === "mythic"
);
const showShimmer = computed(() => {
  if (props.missing) return false;
  return props.sticker?.rarity === "mythic" || props.sticker?.rarity === "rare";
});
const shimmerPhaseSeconds = computed(() =>
  Math.floor(hashToRange(`${finishSeed.value}:shimmer`, 0, 8))
);
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-2 p-2 text-center"
    :class="[
      compact ? 'gap-1 p-1.5' : 'gap-2 p-2',
      missing ? 'opacity-60' : '',
      finishKind !== 'base' ? `finish-${finishKind}` : '',
    ]"
  >
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      :class="[compact ? 'size-[110px]' : 'size-[170px]', 'shrink-0']"
    >
      <defs>
        <linearGradient
          :id="gradientId"
          :gradientTransform="`rotate(${finishAngle})`"
        >
          <stop offset="0%" :stop-color="`hsla(${shimmerHue},90%,72%,1)`">
            <animate
              v-if="showMythicLayer"
              attributeName="stop-color"
              :values="`hsla(${shimmerHue},90%,72%,1);hsla(${
                shimmerHue + 90
              },90%,70%,1);hsla(${
                shimmerHue + 180
              },90%,72%,1);hsla(${shimmerHue},90%,72%,1)`"
              dur="9s"
              :begin="`-${mythicPhaseSeconds}s`"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" :stop-color="`hsla(${shimmerHue + 30},90%,65%,1)`">
            <animate
              v-if="showMythicLayer"
              attributeName="stop-color"
              :values="`hsla(${shimmerHue + 30},90%,65%,1);hsla(${
                shimmerHue + 120
              },90%,63%,1);hsla(${shimmerHue + 210},90%,65%,1);hsla(${
                shimmerHue + 30
              },90%,65%,1)`"
              dur="9s"
              :begin="`-${mythicPhaseSeconds}s`"
              repeatCount="indefinite"
            />
          </stop>
          <stop
            offset="100%"
            :stop-color="`hsla(${shimmerHue + 60},90%,60%,1)`"
          >
            <animate
              v-if="showMythicLayer"
              attributeName="stop-color"
              :values="`hsla(${shimmerHue + 60},90%,60%,1);hsla(${
                shimmerHue + 150
              },90%,58%,1);hsla(${shimmerHue + 240},90%,60%,1);hsla(${
                shimmerHue + 60
              },90%,60%,1)`"
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
        <linearGradient :id="gradientIdAlt" gradientTransform="rotate(140)">
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
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="6"
            flood-color="#0f172a"
            flood-opacity="0.25"
          />
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
          <rect
            v-if="missing"
            width="200"
            height="200"
            fill="black"
            opacity="0.4"
          />
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
        <radialGradient
          :id="mythicGradientId"
          cx="30%"
          cy="25%"
          r="90%"
        >
          <stop
            offset="0%"
            stop-color="color-mix(in srgb, var(--ui-accent) 50%, var(--ui-bg))"
          >
            <animate
              v-if="showMythicGlow"
              attributeName="stop-color"
              values="color-mix(in srgb, var(--ui-accent) 50%, var(--ui-bg));color-mix(in srgb, var(--ui-primary) 46%, var(--ui-bg));color-mix(in srgb, var(--ui-secondary) 44%, var(--ui-bg));color-mix(in srgb, var(--ui-accent) 50%, var(--ui-bg))"
              dur="9s"
              repeatCount="indefinite"
            />
          </stop>
          <stop
            offset="40%"
            stop-color="color-mix(in srgb, var(--ui-primary) 45%, var(--ui-bg))"
          >
            <animate
              v-if="showMythicGlow"
              attributeName="stop-color"
              values="color-mix(in srgb, var(--ui-primary) 45%, var(--ui-bg));color-mix(in srgb, var(--ui-secondary) 40%, var(--ui-bg));color-mix(in srgb, var(--ui-accent) 42%, var(--ui-bg));color-mix(in srgb, var(--ui-primary) 45%, var(--ui-bg))"
              dur="9s"
              repeatCount="indefinite"
            />
          </stop>
          <stop
            offset="70%"
            stop-color="color-mix(in srgb, var(--ui-secondary) 42%, var(--ui-bg))"
          >
            <animate
              v-if="showMythicGlow"
              attributeName="stop-color"
              values="color-mix(in srgb, var(--ui-secondary) 42%, var(--ui-bg));color-mix(in srgb, var(--ui-accent) 48%, var(--ui-bg));color-mix(in srgb, var(--ui-primary) 40%, var(--ui-bg));color-mix(in srgb, var(--ui-secondary) 42%, var(--ui-bg))"
              dur="9s"
              repeatCount="indefinite"
            />
          </stop>
          <stop
            offset="100%"
            stop-color="color-mix(in srgb, var(--ui-accent) 45%, var(--ui-bg))"
          >
            <animate
              v-if="showMythicGlow"
              attributeName="stop-color"
              values="color-mix(in srgb, var(--ui-accent) 45%, var(--ui-bg));color-mix(in srgb, var(--ui-primary) 42%, var(--ui-bg));color-mix(in srgb, var(--ui-secondary) 40%, var(--ui-bg));color-mix(in srgb, var(--ui-accent) 45%, var(--ui-bg))"
              dur="9s"
              repeatCount="indefinite"
            />
          </stop>
          <animateTransform
            v-if="showMythicGlow"
            attributeName="gradientTransform"
            type="rotate"
            from="0 0.5 0.5"
            to="360 0.5 0.5"
            dur="22s"
            repeatCount="indefinite"
          />
        </radialGradient>
        <radialGradient
          :id="rareGradientId"
          cx="35%"
          cy="30%"
          r="85%"
        >
          <stop
            offset="0%"
            stop-color="color-mix(in srgb, var(--ui-primary) 38%, var(--ui-bg))"
          />
          <stop
            offset="45%"
            stop-color="color-mix(in srgb, var(--ui-secondary) 34%, var(--ui-bg))"
          />
          <stop
            offset="75%"
            stop-color="color-mix(in srgb, var(--ui-accent) 32%, var(--ui-bg))"
          />
          <stop
            offset="100%"
            stop-color="color-mix(in srgb, var(--ui-primary) 26%, var(--ui-bg))"
          />
          <animateTransform
            attributeName="gradientTransform"
            type="rotate"
            from="0 0.5 0.5"
            to="-360 0.5 0.5"
            dur="26s"
            repeatCount="indefinite"
          />
        </radialGradient>
        <linearGradient
          :id="`sprite-shimmer-${props.sticker.id}`"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stop-color="rgba(255,255,255,0)" />
          <stop offset="35%" stop-color="rgba(255,255,255,0.0)" />
          <stop offset="46%" stop-color="rgba(255,255,255,0.18)" />
          <stop offset="55%" stop-color="rgba(255,255,255,0.38)" />
          <stop offset="64%" stop-color="rgba(255,255,255,0.18)" />
          <stop offset="70%" stop-color="rgba(255,255,255,0.0)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
          <animateTransform
            v-if="showShimmer"
            attributeName="gradientTransform"
            type="translate"
            values="-1 -1; -1 -1; 1 1; 1 1; -1 -1"
            keyTimes="0;0.35;0.5;0.85;1"
            dur="12s"
            :begin="`-${shimmerPhaseSeconds}s`"
            repeatCount="indefinite"
          />
        </linearGradient>
        <filter
          :id="`sprite-mythic-glow-${props.sticker.id}`"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.7 0"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern
          :id="backdropDotsId"
          patternUnits="userSpaceOnUse"
          width="24"
          height="24"
        >
          <circle cx="4" cy="6" r="1.6" fill="rgba(255,255,255,0.7)" />
          <circle cx="16" cy="14" r="1.2" fill="rgba(255,255,255,0.5)" />
          <circle cx="20" cy="6" r="1" fill="rgba(255,255,255,0.4)" />
          <animateTransform
            attributeName="patternTransform"
            type="translate"
            from="0 0"
            to="24 24"
            dur="8s"
            repeatCount="indefinite"
          />
        </pattern>
      </defs>

      <g :mask="`url(#${maskId})`">
        <rect
          v-if="rarityBackdrop"
          x="14"
          y="14"
          width="172"
          height="172"
          rx="26"
          :fill="rarityBackdrop"
          :filter="
            showMythicGlow
              ? `url(#sprite-mythic-glow-${props.sticker.id})`
              : undefined
          "
        />
        <rect
          v-if="showMythicDots"
          x="14"
          y="14"
          width="172"
          height="172"
          rx="26"
          :fill="`url(#${backdropDotsId})`"
          opacity="0.45"
        />
        <rect
          v-if="showShimmer"
          x="14"
          y="14"
          width="172"
          height="172"
          rx="26"
          :fill="`url(#sprite-shimmer-${props.sticker.id})`"
          opacity="0.45"
        />
        <rect
          x="18"
          y="18"
          width="164"
          height="164"
          rx="20"
          :fill="backgroundFill"
          :stroke="outlineStroke"
          stroke-width="0"
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
          v-if="
            finishKind === 'sparkle' ||
            finishKind === 'prismatic' ||
            props.sticker.rarity === 'mythic'
          "
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

    <div
      v-if="!compact"
      class="flex flex-col items-center uppercase tracking-[0.08em]"
    >
      <span class="text-[11px] font-semibold text-[var(--ui-fg)]">
        {{ sticker.id }}
      </span>
      <span class="text-[10px] text-[var(--ui-fg-muted)]">
        {{ sticker.rarity }}
      </span>
      <span v-if="status" class="text-[9px] text-[var(--ui-fg-muted)] opacity-70">
        {{ status }}
      </span>
    </div>
  </div>
</template>

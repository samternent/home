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
  status?: string;
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
  const match = props.palettes.find(
    (entry) => entry.id === props.creature.paletteId
  );
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
    rgb
      .map((value) => Math.max(0, Math.min(255, Math.round(value))))
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
const mythicGradientId = computed(
  () => `pixel-mythic-gradient-${props.creature.id}`
);
const rareGradientId = computed(
  () => `pixel-rare-gradient-${props.creature.id}`
);
const backdropDotsId = computed(
  () => `pixel-backdrop-dots-${props.creature.id}`
);

const outlineStroke = computed(() =>
  props.missing ? "#64748b" : "transparent"
);
const backgroundFill = computed(() =>
  props.missing ? fillColors.value[0] : "transparent"
);
const pixelFill = (cell: number) =>
  cell === bgIndex.value && !props.missing
    ? "transparent"
    : fillColors.value[cell] || fillColors.value[1];
const rarityBackdrop = computed(() => {
  if (props.missing) return null;
  const rarity = props.creature?.rarity;
  if (rarity === "mythic") return `url(#${mythicGradientId.value})`;
  if (rarity === "rare") return `url(#${rareGradientId.value})`;
  if (rarity === "uncommon") {
    return "color-mix(in srgb, var(--ui-accent) 14%, var(--ui-bg))";
  }
  return null;
});
const showMythicDots = computed(
  () => !props.missing && props.creature?.rarity === "mythic"
);
const showMythicGlow = computed(
  () => !props.missing && props.creature?.rarity === "mythic"
);
const showShimmer = computed(() => {
  if (props.missing) return false;
  return props.creature?.rarity === "mythic" || props.creature?.rarity === "rare";
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
          <stop offset="0%" :stop-color="`hsla(${shimmerHue},90%,72%,1)`" />
          <stop
            offset="50%"
            :stop-color="`hsla(${shimmerHue + 30},90%,65%,1)`"
          />
          <stop
            offset="100%"
            :stop-color="`hsla(${shimmerHue + 60},90%,60%,1)`"
          />
        </linearGradient>
        <filter :id="shadowId" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius="1"
            result="dilated"
          />
          <feFlood
            :flood-color="outlineStroke"
            flood-opacity="0.9"
            result="flood"
          />
          <feComposite
            in="flood"
            in2="dilated"
            operator="in"
            result="outline"
          />
          <feDropShadow
            dx="0"
            dy="5"
            stdDeviation="5"
            flood-color="#0f172a"
            flood-opacity="0.22"
            result="shadow"
          />
          <feMerge>
            <feMergeNode in="outline" />
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <mask :id="maskId">
          <rect width="200" height="200" fill="white" />
          <rect
            v-if="missing"
            width="200"
            height="200"
            fill="black"
            opacity="0.35"
          />
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
          :id="`pixel-shimmer-${props.creature.id}`"
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
        <filter :id="`pixel-mythic-glow-${props.creature.id}`" x="-30%" y="-30%" width="160%" height="160%">
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
          :filter="showMythicGlow ? `url(#pixel-mythic-glow-${props.creature.id})` : undefined"
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
          :fill="`url(#pixel-shimmer-${props.creature.id})`"
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

    <div
      v-if="!compact"
      class="flex flex-col items-center uppercase tracking-[0.08em]"
    >
      <span class="text-[11px] font-semibold text-[var(--ui-fg)]">
        {{ creature.id }}
      </span>
      <span class="text-[10px] text-[var(--ui-fg-muted)]">
        {{ creature.rarity }}
      </span>
      <span v-if="status" class="text-[9px] text-[var(--ui-fg-muted)] opacity-70">
        {{ status }}
      </span>
    </div>
  </div>
</template>

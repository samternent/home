<script setup lang="ts">
import { computed, toRefs } from "vue";
import { buildSparklePositions, hashToRange } from "./stickerbook";

type LetterAttributes = {
  letter: string;
  shape: "round" | "pill";
  eyes: "none" | "dots";
  paletteId: string;
  accent: "none" | "cheeks";
};

const props = defineProps<{
  attributes: LetterAttributes;
  finish?: string;
  packId?: string;
  missing?: boolean;
  compact?: boolean;
}>();

const { attributes } = toRefs(props);

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

const palette = computed(() => {
  const match = palettes.find((entry) => entry.id === attributes.value.paletteId);
  return (
    match || {
      background: "#E2E8F0",
      foreground: "#1F2937",
      accent: "#CBD5F5",
    }
  );
});

const finishSeed = computed(() =>
  props.packId ? `${props.packId}:${attributes.value.letter}` : attributes.value.letter
);
const finishAngle = computed(() =>
  Math.floor(hashToRange(finishSeed.value, 10, 70))
);
const sparklePositions = computed(() =>
  buildSparklePositions(`${finishSeed.value}:sparkle`, 6)
);
const shimmerHue = computed(() =>
  Math.floor(hashToRange(`${finishSeed.value}:hue`, 180, 320))
);

const showFinish = computed(() => props.finish && props.finish !== "base");
const finishKind = computed(() => props.finish || "base");

const gradientId = computed(() => `letter-finish-${attributes.value.letter}`);
const maskId = computed(() => `letter-mask-${attributes.value.letter}`);

const baseBackground = computed(() =>
  props.missing ? "#E2E8F0" : palette.value.background
);
const baseForeground = computed(() =>
  props.missing ? "#94A3B8" : palette.value.foreground
);
const accentColor = computed(() =>
  props.missing ? "#CBD5F5" : palette.value.accent
);
</script>

<template>
  <div
    class="letter-sticker"
    :class="[compact ? 'letter-compact' : 'letter-full', missing ? 'letter-missing' : '']"
  >
    <svg viewBox="0 0 200 200" class="letter-svg" aria-hidden="true">
      <defs>
        <linearGradient
          :id="gradientId"
          :gradientTransform="`rotate(${finishAngle})`"
        >
          <stop offset="0%" :stop-color="`hsla(${shimmerHue},90%,70%,1)`" />
          <stop offset="50%" :stop-color="`hsla(${shimmerHue + 30},90%,65%,1)`" />
          <stop offset="100%" :stop-color="`hsla(${shimmerHue + 60},90%,60%,1)`" />
        </linearGradient>
        <mask :id="maskId">
          <rect width="200" height="200" fill="white" />
          <rect v-if="missing" width="200" height="200" fill="black" opacity="0.4" />
        </mask>
      </defs>

      <g :mask="`url(#${maskId})`">
        <circle
          v-if="attributes.shape === 'round'"
          cx="100"
          cy="100"
          r="82"
          :fill="baseBackground"
        />
        <rect
          v-else
          x="24"
          y="34"
          width="152"
          height="132"
          rx="66"
          :fill="baseBackground"
        />

        <circle
          v-if="attributes.eyes === 'dots'"
          cx="70"
          cy="70"
          r="6"
          :fill="baseForeground"
        />
        <circle
          v-if="attributes.eyes === 'dots'"
          cx="130"
          cy="70"
          r="6"
          :fill="baseForeground"
        />

        <circle
          v-if="attributes.accent === 'cheeks'"
          cx="70"
          cy="120"
          r="10"
          :fill="accentColor"
        />
        <circle
          v-if="attributes.accent === 'cheeks'"
          cx="130"
          cy="120"
          r="10"
          :fill="accentColor"
        />

        <text
          x="100"
          y="118"
          text-anchor="middle"
          dominant-baseline="middle"
          :fill="baseForeground"
          font-size="110"
          font-weight="700"
          font-family="'Trebuchet MS','Comic Sans MS','Verdana',sans-serif"
        >
          {{ attributes.letter }}
        </text>

        <g v-if="showFinish" opacity="0.3">
          <rect
            x="18"
            y="18"
            width="164"
            height="164"
            :fill="`url(#${gradientId})`"
          />
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
  </div>
</template>

<style scoped>
.letter-sticker {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 18px;
  padding: 0.6rem;
  box-shadow:
    0 8px 16px rgba(15, 23, 42, 0.18),
    inset 0 0 0 4px rgba(15, 23, 42, 0.18);
}

.letter-compact {
  padding: 0.4rem;
}

.letter-svg {
  width: 120px;
  height: 120px;
}

.letter-compact .letter-svg {
  width: 94px;
  height: 94px;
}

.letter-missing {
  filter: saturate(0.3);
}
</style>

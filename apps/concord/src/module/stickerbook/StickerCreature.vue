<script setup lang="ts">
import { computed } from "vue";
import { buildSparklePositions, hashToRange, hashToUnit } from "./stickerbook";

type Creature = {
  id: string;
  name: string;
  rarity: string;
  attributes: {
    body: { shape: string; scale: number; wobble: number };
    eyes: string;
    accent: string;
    pattern: { type: string; density: number; symmetry: boolean };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      highlight: string;
    };
  };
};

const props = defineProps<{
  creature: Creature;
  finish?: string;
  packId?: string;
  missing?: boolean;
  compact?: boolean;
  status?: string;
}>();

const bodyShape = computed(() => props.creature.attributes.body.shape);
const colors = computed(() => props.creature.attributes.colors);
const accent = computed(() => props.creature.attributes.accent);
const eyes = computed(() => props.creature.attributes.eyes);
const pattern = computed(() => props.creature.attributes.pattern);

const finishSeed = computed(() =>
  props.packId ? `${props.packId}:${props.creature.id}` : props.creature.id
);
const finishAngle = computed(() =>
  Math.floor(hashToRange(finishSeed.value, 10, 70))
);
const holoOffset = computed(() =>
  Math.floor(hashToRange(`${finishSeed.value}:offset`, 0, 50))
);
const sparklePositions = computed(() =>
  buildSparklePositions(`${finishSeed.value}:sparkle`, 7)
);
const foilOpacity = computed(() =>
  hashToRange(`${finishSeed.value}:foil`, 0.18, 0.35)
);
const shimmerScale = computed(() =>
  hashToRange(`${finishSeed.value}:scale`, 0.9, 1.1)
);

const bodyStroke = computed(() => (props.missing ? "#334155" : "#1f2937"));
const bodyFill = computed(() =>
  props.missing ? "#0f172a" : colors.value.primary
);
const patternFill = computed(() =>
  props.missing ? "#1e293b" : colors.value.secondary
);
const accentFill = computed(() =>
  props.missing ? "#1e293b" : colors.value.accent
);
const highlightFill = computed(() =>
  props.missing ? "#1e293b" : colors.value.highlight
);

const showFinish = computed(() => props.finish && props.finish !== "base");
const finishKind = computed(() => props.finish || "base");

const gradientId = computed(() => `finish-${props.creature.id}`);
const haloId = computed(() => `halo-${props.creature.id}`);
const patternId = computed(() => `pattern-${props.creature.id}`);
const maskId = computed(() => `mask-${props.creature.id}`);
const finishMaskId = computed(() => `finish-mask-${props.creature.id}`);

const showSpots = computed(() => pattern.value.type === "spots");
const showStripes = computed(() => pattern.value.type === "stripes");
const showBlush = computed(() => pattern.value.type === "blush");
const showGradient = computed(() => pattern.value.type === "gradient");

const eyeOffset = computed(() => (eyes.value === "sleepy" ? 6 : 0));
const sparkleAlpha = computed(() =>
  hashToRange(`${finishSeed.value}:sparkle-alpha`, 0.4, 0.75)
);
const holoAlpha = computed(() => (finishKind.value === "holo" ? 0.45 : 0.3));
const prismaticAlpha = computed(() =>
  finishKind.value === "prismatic" ? 0.5 : 0.35
);
const foilAlpha = computed(() =>
  finishKind.value === "foil" ? foilOpacity.value : 0.2
);
const shimmerHue = computed(() =>
  Math.floor(hashToRange(`${finishSeed.value}:hue`, 190, 340))
);
const sparkleScale = computed(() =>
  hashToRange(`${finishSeed.value}:sparkle-scale`, 0.85, 1.2)
);
const shimmerRotation = computed(() =>
  Math.floor(hashToRange(`${finishSeed.value}:rotation`, -12, 12))
);
const patternScale = computed(() =>
  hashToRange(`${finishSeed.value}:pattern`, 0.9, 1.1)
);

const glowOpacity = computed(() =>
  finishKind.value === "prismatic" ? 0.65 : 0.35
);
const glowHue = computed(() =>
  Math.floor(hashToRange(`${finishSeed.value}:glow`, 180, 320))
);
const sparklePulse = computed(() => (hashToUnit(finishSeed.value) > 0.5 ? 1 : -1));
</script>

<template>
  <div
    class="sticker-creature"
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
          <stop offset="0%" :stop-color="`hsla(${shimmerHue},90%,70%,1)`" />
          <stop offset="45%" :stop-color="`hsla(${shimmerHue + 40},90%,65%,1)`" />
          <stop offset="100%" :stop-color="`hsla(${shimmerHue + 80},90%,60%,1)`" />
        </linearGradient>
        <radialGradient :id="haloId">
          <stop offset="0%" :stop-color="`hsla(${glowHue},90%,70%,1)`" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>
        <pattern
          :id="patternId"
          patternUnits="userSpaceOnUse"
          width="24"
          height="24"
          :patternTransform="`scale(${patternScale}) rotate(${finishAngle})`"
        >
          <circle cx="6" cy="6" r="4" :fill="patternFill" />
          <circle cx="18" cy="18" r="4" :fill="patternFill" />
        </pattern>
        <mask :id="maskId">
          <rect width="200" height="200" fill="white" />
          <rect
            v-if="missing"
            width="200"
            height="200"
            fill="black"
            opacity="0.5"
          />
        </mask>
        <mask :id="finishMaskId" maskUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="black" />
          <circle
            v-if="bodyShape === 'round'"
            cx="100"
            cy="110"
            r="78"
            fill="white"
          />
          <rect
            v-else-if="bodyShape === 'squircle'"
            x="30"
            y="40"
            width="140"
            height="140"
            rx="50"
            fill="white"
          />
          <rect
            v-else-if="bodyShape === 'diamond'"
            x="45"
            y="45"
            width="110"
            height="110"
            rx="16"
            fill="white"
            transform="rotate(45 100 100)"
          />
          <path
            v-else-if="bodyShape === 'bean'"
            d="M65 40c35-10 75 15 75 60 0 48-25 75-65 75-44 0-70-28-70-60 0-30 24-63 60-75z"
            fill="white"
          />
          <ellipse
            v-else
            cx="100"
            cy="110"
            rx="78"
            ry="70"
            fill="white"
          />
        </mask>
      </defs>

      <g :mask="`url(#${maskId})`">
        <g v-if="showFinish" :mask="`url(#${finishMaskId})`">
          <g :style="`opacity:${foilAlpha}`">
            <rect
              x="22"
              y="30"
              width="156"
              height="150"
              :fill="`url(#${gradientId})`"
              :transform="`rotate(${shimmerRotation} 100 100) scale(${shimmerScale})`"
            />
          </g>
          <g :style="`opacity:${glowOpacity}`">
            <circle cx="100" cy="110" r="84" :fill="`url(#${haloId})`" />
          </g>
          <g v-if="finishKind === 'holo'" :style="`opacity:${holoAlpha}`">
            <rect
              x="30"
              y="50"
              width="140"
              height="120"
              :fill="`url(#${gradientId})`"
              :transform="`translate(${holoOffset}, ${holoOffset})`"
            />
          </g>
          <g v-if="finishKind === 'prismatic'" :style="`opacity:${prismaticAlpha}`">
            <rect x="25" y="40" width="150" height="140" fill="white" />
          </g>
        </g>

        <circle
          cx="100"
          cy="110"
          r="78"
          :fill="bodyFill"
          :stroke="bodyStroke"
          stroke-width="8"
          v-if="bodyShape === 'round'"
        />
        <rect
          v-else-if="bodyShape === 'squircle'"
          x="30"
          y="40"
          width="140"
          height="140"
          rx="50"
          :fill="bodyFill"
          :stroke="bodyStroke"
          stroke-width="8"
        />
        <rect
          v-else-if="bodyShape === 'diamond'"
          x="45"
          y="45"
          width="110"
          height="110"
          rx="16"
          :fill="bodyFill"
          :stroke="bodyStroke"
          stroke-width="8"
          transform="rotate(45 100 100)"
        />
        <path
          v-else-if="bodyShape === 'bean'"
          d="M65 40c35-10 75 15 75 60 0 48-25 75-65 75-44 0-70-28-70-60 0-30 24-63 60-75z"
          :fill="bodyFill"
          :stroke="bodyStroke"
          stroke-width="8"
        />
        <ellipse
          v-else
          cx="100"
          cy="110"
          rx="78"
          ry="70"
          :fill="bodyFill"
          :stroke="bodyStroke"
          stroke-width="8"
        />

        <rect
          v-if="showGradient"
          x="30"
          y="40"
          width="140"
          height="140"
          :fill="`url(#${gradientId})`"
          opacity="0.25"
        />
        <rect
          v-if="showSpots"
          x="30"
          y="40"
          width="140"
          height="140"
          :fill="`url(#${patternId})`"
          opacity="0.55"
        />
        <g v-if="showStripes" opacity="0.4">
          <rect x="40" y="60" width="120" height="16" :fill="patternFill" />
          <rect x="30" y="92" width="140" height="16" :fill="patternFill" />
          <rect x="40" y="124" width="120" height="16" :fill="patternFill" />
        </g>
        <g v-if="showBlush" opacity="0.55">
          <circle cx="70" cy="120" r="14" :fill="patternFill" />
          <circle cx="130" cy="120" r="14" :fill="patternFill" />
        </g>

        <g v-if="accent === 'horns'">
          <path
            d="M60 48l-20-28 28 8z"
            :fill="accentFill"
            :stroke="bodyStroke"
            stroke-width="6"
          />
          <path
            d="M140 48l20-28-28 8z"
            :fill="accentFill"
            :stroke="bodyStroke"
            stroke-width="6"
          />
        </g>
        <path
          v-else-if="accent === 'fin'"
          d="M152 90c24 6 34 24 30 48-12-10-26-12-44-10z"
          :fill="accentFill"
          :stroke="bodyStroke"
          stroke-width="6"
        />
        <path
          v-else-if="accent === 'leaf'"
          d="M100 22c18 10 34 28 34 44-28 2-50-14-64-30 10-10 20-14 30-14z"
          :fill="accentFill"
          :stroke="bodyStroke"
          stroke-width="6"
        />
        <path
          v-else-if="accent === 'tuft'"
          d="M72 40c10-18 22-20 32-16 10-4 22-2 32 16-16-6-28-4-32-2-4-2-16-4-32 2z"
          :fill="accentFill"
          :stroke="bodyStroke"
          stroke-width="6"
        />
        <path
          v-else
          d="M48 148c-22 8-36 22-36 36 24-6 44-10 58-22z"
          :fill="accentFill"
          :stroke="bodyStroke"
          stroke-width="6"
        />

        <g>
          <ellipse
            cx="78"
            cy="92"
            rx="16"
            ry="20"
            :fill="highlightFill"
          />
          <ellipse
            cx="122"
            cy="92"
            rx="16"
            ry="20"
            :fill="highlightFill"
          />
          <circle
            cx="78"
            :cy="92 + eyeOffset"
            r="8"
            :fill="bodyStroke"
          />
          <circle
            cx="122"
            :cy="92 + eyeOffset"
            r="8"
            :fill="bodyStroke"
          />
          <path
            v-if="eyes === 'spark'"
            d="M92 100l8-8 8 8-8 8z"
            :fill="highlightFill"
          />
          <path
            v-else-if="eyes === 'star'"
            d="M100 106l4-8 8-2-6-6 2-8-8 4-8-4 2 8-6 6 8 2z"
            :fill="highlightFill"
          />
        </g>

        <path
          d="M80 132c14 10 26 10 40 0"
          fill="none"
          :stroke="bodyStroke"
          stroke-width="6"
          stroke-linecap="round"
        />
        <g
          v-if="finishKind === 'sparkle'"
          :style="`opacity:${sparkleAlpha}`"
        >
          <circle
            v-for="(sparkle, index) in sparklePositions"
            :key="`sparkle-${index}`"
            :cx="sparkle.x"
            :cy="sparkle.y"
            :r="sparkle.r"
            :fill="highlightFill"
            :style="`transform: scale(${sparkleScale});`"
          />
        </g>
      </g>
    </svg>

    <div class="sticker-label" v-if="!compact">
      <span class="sticker-name">{{ creature.name }}</span>
      <span class="sticker-rarity">{{ creature.rarity }}</span>
      <span v-if="status" class="sticker-status">{{ status }}</span>
    </div>

    <div
      class="sticker-shine"
      v-if="showFinish"
      :style="`--shine-hue:${shimmerHue}; --shine-direction:${sparklePulse}`"
    ></div>
  </div>
</template>

<style scoped>
.sticker-creature {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  background: linear-gradient(160deg, #fff9e6 0%, #ffe6f2 60%, #d7f7ff 100%);
  border-radius: 18px;
  padding: 0.6rem 0.5rem 0.7rem;
  box-shadow:
    0 8px 18px rgba(15, 23, 42, 0.18),
    inset 0 0 0 4px rgba(15, 23, 42, 0.2);
  transform: rotate(-1deg);
  overflow: hidden;
}

.sticker-compact {
  padding: 0.4rem;
  gap: 0.2rem;
}

.sticker-compact .sticker-svg {
  width: 94px;
  height: 94px;
}

.sticker-full .sticker-svg {
  width: 140px;
  height: 140px;
}

.sticker-svg {
  position: relative;
  z-index: 2;
  width: 120px;
  height: 120px;
  filter: drop-shadow(0 4px 0 rgba(15, 23, 42, 0.35));
}

.sticker-label {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Comic Sans MS", "Trebuchet MS", cursive;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  color: #1f2937;
}

.sticker-name {
  font-weight: 700;
}

.sticker-rarity {
  font-size: 0.55rem;
  opacity: 0.7;
}

.sticker-status {
  font-size: 0.55rem;
  opacity: 0.7;
}

.sticker-shine {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(
      circle at 20% 20%,
      hsla(var(--shine-hue), 90%, 80%, 0.5),
      transparent 55%
    ),
    linear-gradient(
      calc(var(--shine-direction) * 40deg),
      rgba(255, 255, 255, 0.4),
      transparent 55%
    );
  mix-blend-mode: screen;
  opacity: 0.6;
  pointer-events: none;
  animation: sticker-shimmer 3.2s ease-in-out infinite;
}

.sticker-missing {
  filter: saturate(0.4);
  background: linear-gradient(160deg, #0f172a, #1e293b);
}

.sticker-missing .sticker-label {
  color: #94a3b8;
}

@keyframes sticker-shimmer {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  50% {
    transform: translateY(-6px);
    opacity: 0.7;
  }
}
</style>

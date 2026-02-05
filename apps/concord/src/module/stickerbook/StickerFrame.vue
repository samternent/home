<script setup lang="ts">
import { computed } from "vue";
import { hashToRange } from "./stickerbook";

type StickerFrameProps = {
  rarity?: string;
  missing?: boolean;
  compact?: boolean;
  label?: string;
  sublabel?: string;
  status?: string;
  seed?: string;
};

const props = defineProps<StickerFrameProps>();

const isCompact = computed(() => props.compact ?? false);
const sizeClass = computed(() =>
  isCompact.value ? "size-[110px]" : "size-[170px]"
);
const labelClass = computed(() => (isCompact.value ? "hidden" : ""));
const frameSeed = computed(
  () =>
    props.seed || props.label || props.sublabel || props.rarity || "sticker"
);
const frameId = computed(() =>
  Math.floor(hashToRange(frameSeed.value, 0, 1_000_000_000)).toString()
);
const rarity = computed(() => props.rarity || "common");

const showMythicDots = computed(
  () => !props.missing && rarity.value === "mythic"
);
const showMythicGlow = computed(
  () => !props.missing && rarity.value === "mythic"
);
const showShimmer = computed(() => {
  if (props.missing) return false;
  return rarity.value === "mythic" || rarity.value === "rare";
});

const shimmerPhaseSeconds = computed(() =>
  Math.floor(hashToRange(`${frameSeed.value}:shimmer`, 0, 8))
);

const backdropFill = computed(() => {
  if (props.missing) return null;
  if (rarity.value === "mythic") return `url(#mythic-${frameId.value})`;
  if (rarity.value === "rare") return `url(#rare-${frameId.value})`;
  if (rarity.value === "uncommon") {
    return "color-mix(in srgb, var(--ui-accent) 14%, var(--ui-bg))";
  }
  return null;
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-2 p-2 text-center"
    :class="[isCompact ? 'gap-1 p-1.5' : 'gap-2 p-2', missing ? 'opacity-60' : '']"
  >
    <div class="relative" :class="sizeClass">
      <svg
        class="absolute inset-0 size-full"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <defs>
          <radialGradient :id="`mythic-${frameId}`" cx="30%" cy="25%" r="90%">
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
          <radialGradient :id="`rare-${frameId}`" cx="35%" cy="30%" r="85%">
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
          <filter :id="`frame-glow-${frameId}`" x="-30%" y="-30%" width="160%" height="160%">
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
            :id="`dots-${frameId}`"
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
              values="0 0; 24 24"
              dur="8s"
              repeatCount="indefinite"
            />
          </pattern>
          <linearGradient :id="`shimmer-${frameId}`" x1="0" y1="0" x2="1" y2="1">
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
        </defs>
        <rect
          v-if="backdropFill"
          x="14"
          y="14"
          width="172"
          height="172"
          rx="26"
          :fill="backdropFill"
          :filter="showMythicGlow ? `url(#frame-glow-${frameId})` : undefined"
        />
        <rect
          v-if="showMythicDots"
          x="14"
          y="14"
          width="172"
          height="172"
          rx="26"
          :fill="`url(#dots-${frameId})`"
          opacity="0.45"
        />
        <rect
          v-if="showShimmer"
          x="14"
          y="14"
          width="172"
          height="172"
          rx="26"
          :fill="`url(#shimmer-${frameId})`"
          opacity="0.45"
        />
      </svg>
      <div class="relative size-full">
        <slot />
      </div>
    </div>

    <div v-if="!labelClass && (label || sublabel || status)">
      <div class="flex flex-col items-center uppercase tracking-[0.08em]">
        <span v-if="label" class="text-[11px] font-semibold text-[var(--ui-fg)]">
          {{ label }}
        </span>
        <span v-if="sublabel" class="text-[10px] text-[var(--ui-fg-muted)]">
          {{ sublabel }}
        </span>
        <span
          v-if="status"
          class="text-[9px] text-[var(--ui-fg-muted)] opacity-70"
        >
          {{ status }}
        </span>
      </div>
    </div>
  </div>
</template>

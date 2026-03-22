<script setup lang="ts">
import { computed } from "vue";

type StickerCardFrameProps = {
  tone?: "common" | "uncommon" | "rare" | "mythic";
  missing?: boolean;
  compact?: boolean;
  label?: string;
  seed?: string;
  animated?: boolean;
  backdrop?: boolean;
  shimmer?: boolean;
  accentGlow?: boolean;
  accentDots?: boolean;
  accentBorder?: boolean;
};

const props = defineProps<StickerCardFrameProps>();

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashToRange(input: string, min: number, max: number): number {
  const unit = (hashString(input) % 1_000_000) / 1_000_000;
  return min + (max - min) * unit;
}

const isCompact = computed(() => props.compact ?? false);
const frameSeed = computed(() => props.seed || props.label || props.tone || "card");
const frameId = computed(() =>
  Math.floor(hashToRange(frameSeed.value, 0, 1_000_000_000)).toString(),
);
const tone = computed(() => props.tone || "common");
const animated = computed(() => props.animated !== false);
const showBackdrop = computed(() => props.backdrop !== false);

const showAccentDots = computed(
  () =>
    animated.value &&
    !props.missing &&
    tone.value === "mythic" &&
    props.accentDots !== false,
);
const showAccentGlow = computed(
  () =>
    animated.value &&
    !props.missing &&
    tone.value === "mythic" &&
    props.accentGlow !== false,
);
const showAccentBorder = computed(
  () =>
    animated.value &&
    !props.missing &&
    tone.value === "mythic" &&
    props.accentBorder !== false,
);
const mythicBorderDelay = computed(() => {
  const seconds = hashToRange(`${frameSeed.value}:border`, -6, 0);
  return `${seconds.toFixed(2)}s`;
});
const showShimmer = computed(() => Boolean(props.shimmer) && !props.missing);
const shimmerPhaseSeconds = computed(() =>
  Math.floor(hashToRange(`${frameSeed.value}:shimmer`, 0, 8)),
);

const backdropFill = computed(() => {
  if (!showBackdrop.value || props.missing) return null;
  if (tone.value === "mythic") return `url(#mythic-${frameId.value})`;
  if (tone.value === "rare") return `url(#rare-${frameId.value})`;
  if (tone.value === "uncommon") {
    return "color-mix(in srgb, var(--ui-accent) 14%, var(--ui-bg))";
  }
  return "color-mix(in srgb, var(--ui-accent) 14%, var(--ui-bg))";
});
</script>

<template>
  <div
    class="flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg text-center"
    :class="[isCompact ? 'gap-2' : 'gap-3', !missing ? 'shadow' : '']"
  >
    <div
      :class="[
        'sticker-frame-card relative w-full overflow-hidden rounded-[1.15rem]',
        { 'shimmer-border mythic-border': showAccentBorder },
        missing ? 'blur-[2px] grayscale' : '',
      ]"
      :style="showAccentBorder ? { '--mythic-border-delay': mythicBorderDelay } : undefined"
    >
      <svg
        class="absolute inset-0 h-full w-full"
        viewBox="0 0 100 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient :id="`mythic-${frameId}`" cx="30%" cy="25%" r="90%">
            <stop offset="0%" stop-color="color-mix(in srgb, var(--ui-accent) 50%, var(--ui-bg))">
              <animate
                v-if="showAccentGlow"
                attributeName="stop-color"
                values="color-mix(in srgb, var(--ui-accent) 50%, var(--ui-bg));color-mix(in srgb, var(--ui-primary) 46%, var(--ui-bg));color-mix(in srgb, var(--ui-secondary) 44%, var(--ui-bg));color-mix(in srgb, var(--ui-accent) 50%, var(--ui-bg))"
                dur="9s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="40%" stop-color="color-mix(in srgb, var(--ui-primary) 45%, var(--ui-bg))">
              <animate
                v-if="showAccentGlow"
                attributeName="stop-color"
                values="color-mix(in srgb, var(--ui-primary) 45%, var(--ui-bg));color-mix(in srgb, var(--ui-secondary) 40%, var(--ui-bg));color-mix(in srgb, var(--ui-accent) 42%, var(--ui-bg));color-mix(in srgb, var(--ui-primary) 45%, var(--ui-bg))"
                dur="9s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="70%" stop-color="color-mix(in srgb, var(--ui-secondary) 42%, var(--ui-bg))">
              <animate
                v-if="showAccentGlow"
                attributeName="stop-color"
                values="color-mix(in srgb, var(--ui-secondary) 42%, var(--ui-bg));color-mix(in srgb, var(--ui-accent) 48%, var(--ui-bg));color-mix(in srgb, var(--ui-primary) 40%, var(--ui-bg));color-mix(in srgb, var(--ui-secondary) 42%, var(--ui-bg))"
                dur="9s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stop-color="color-mix(in srgb, var(--ui-accent) 45%, var(--ui-bg))">
              <animate
                v-if="showAccentGlow"
                attributeName="stop-color"
                values="color-mix(in srgb, var(--ui-accent) 45%, var(--ui-bg));color-mix(in srgb, var(--ui-primary) 42%, var(--ui-bg));color-mix(in srgb, var(--ui-secondary) 40%, var(--ui-bg));color-mix(in srgb, var(--ui-accent) 45%, var(--ui-bg))"
                dur="9s"
                repeatCount="indefinite"
              />
            </stop>
            <animateTransform
              v-if="showAccentGlow"
              attributeName="gradientTransform"
              type="rotate"
              from="0 0.5 0.5"
              to="360 0.5 0.5"
              dur="22s"
              repeatCount="indefinite"
            />
          </radialGradient>
          <radialGradient :id="`rare-${frameId}`" cx="35%" cy="30%" r="85%">
            <stop offset="0%" stop-color="color-mix(in srgb, var(--ui-primary) 38%, var(--ui-bg))" />
            <stop offset="45%" stop-color="color-mix(in srgb, var(--ui-secondary) 34%, var(--ui-bg))" />
            <stop offset="75%" stop-color="color-mix(in srgb, var(--ui-accent) 32%, var(--ui-bg))" />
            <stop offset="100%" stop-color="color-mix(in srgb, var(--ui-primary) 26%, var(--ui-bg))" />
            <animateTransform
              v-if="animated"
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
          <pattern :id="`dots-${frameId}`" patternUnits="userSpaceOnUse" width="24" height="24">
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
            <stop offset="35%" stop-color="rgba(255,255,255,0)" />
            <stop offset="46%" stop-color="rgba(255,255,255,0.18)" />
            <stop offset="55%" stop-color="rgba(255,255,255,0.38)" />
            <stop offset="64%" stop-color="rgba(255,255,255,0.18)" />
            <stop offset="70%" stop-color="rgba(255,255,255,0)" />
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
          x="1"
          y="1"
          width="98"
          height="148"
          rx="4"
          :fill="backdropFill"
          :filter="showAccentGlow ? `url(#frame-glow-${frameId})` : undefined"
        />
        <rect
          v-if="showAccentDots"
          x="1"
          y="1"
          width="100"
          height="150"
          rx="4"
          :fill="`url(#dots-${frameId})`"
          opacity="0.45"
        />
        <rect
          v-if="showShimmer"
          x="1"
          y="1"
          width="100"
          height="150"
          rx="4"
          :fill="`url(#shimmer-${frameId})`"
          opacity="0.45"
        />
      </svg>

      <div class="relative z-10 flex h-full flex-col overflow-hidden" :class="[!missing ? '' : 'opacity-40']">
        <div class="bg-[var(--ui-bg)]/92 p-2 text-center uppercase text-[var(--ui-fg-muted)]">
          <span class="block truncate font-semibold text-[var(--ui-fg)]">
            {{ label || "Sticker" }}
          </span>
        </div>
        <div class="relative mx-auto w-full">
          <div class="relative size-full overflow-hidden">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sticker-frame-card {
  container-type: inline-size;
}

.shimmer-border {
  position: relative;
  overflow: hidden;
}

.shimmer-border::before {
  content: "";
  position: absolute;
  inset: -200%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    #fff4c2 60deg,
    #f6f2d7 120deg,
    #ffef9a 180deg,
    transparent 240deg
  );
  animation: shimmer-spin 4s linear infinite;
  animation-delay: var(--mythic-border-delay, 0s);
  opacity: 0.6;
  filter: blur(2px);
}

@keyframes shimmer-spin {
  to {
    transform: rotate(360deg);
  }
}

.mythic-border::before {
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 241, 201, 0.7) 60deg,
    rgba(208, 186, 118, 0.6) 120deg,
    rgba(255, 248, 220, 0.7) 180deg,
    transparent 240deg
  );
}
</style>

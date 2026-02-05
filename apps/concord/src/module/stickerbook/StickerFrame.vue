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
const showLabels = computed(
  () => !!(props.label || props.sublabel || props.status)
);
const frameSeed = computed(
  () => props.seed || props.label || props.sublabel || props.rarity || "sticker"
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
const showMythicBorder = computed(
  () => !props.missing && rarity.value === "mythic"
);
const mythicBorderDelay = computed(() => {
  const seconds = hashToRange(`${frameSeed.value}:border`, -6, 0);
  return `${seconds.toFixed(2)}s`;
});
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
    class="flex flex-col items-center justify-center gap-2 text-center max-w-[180px]"
    :class="[isCompact ? 'gap-2' : 'gap-3', missing ? 'opacity-60' : '']"
  >
    <div
      :class="[
        'relative w-full bg-[var(--ui-surface)]  bg-opacity-10 aspect-4/6 border border-[var(--ui-border)] rounded-sm overflow-hidden',
        { 'shimmer-border mythic-border p-0.5': showMythicBorder },
      ]"
      :style="
        showMythicBorder
          ? { '--mythic-border-delay': mythicBorderDelay }
          : undefined
      "
    >
      <svg
        class="absolute inset-0 h-full w-full"
        viewBox="0 0 100 150"
        preserveAspectRatio="none"
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
          <filter
            :id="`frame-glow-${frameId}`"
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
          <linearGradient
            :id="`shimmer-${frameId}`"
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
        </defs>
        <rect
          v-if="backdropFill"
          x="1"
          y="1"
          width="98"
          height="148"
          rx="6"
          :fill="backdropFill"
          :filter="showMythicGlow ? `url(#frame-glow-${frameId})` : undefined"
        />
        <rect
          v-if="showMythicDots"
          x="1"
          y="1"
          width="100"
          height="150"
          rx="6"
          :fill="`url(#dots-${frameId})`"
          opacity="0.45"
        />
        <rect
          v-if="showShimmer"
          x="1"
          y="1"
          width="100"
          height="150"
          rx="6"
          :fill="`url(#shimmer-${frameId})`"
          opacity="0.45"
        />
      </svg>
      <div
        class="flex flex-col relative z-10 rounded-sm h-full overflow-hidden"
      >
        <div
          class="flex flex-col items-center justify-between gap-2 uppercase tracking-[0.16em] bg-[var(--ui-bg)] bg-opacity-90 px-2 py-1 text-[9px] text-[var(--ui-fg-muted)]"
        >
          <span v-if="sublabel">{{ sublabel }}</span>
          <span v-else>series</span>
          <span v-if="status" class="text-[9px] opacity-70">{{ status }}</span>
        </div>
        <div class="relative mx-auto w-full">
          <div class="relative size-full overflow-hidden">
            <slot />
          </div>
        </div>
        <div
          v-if="showLabels"
          class="mt-2 bg-[var(--ui-bg)] flex flex-1 items-center justify-between gap-2 bg-[color-mix(in srgb, var(--ui-bg) 90%, transparent)] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]"
        >
          <span class="font-semibold text-[var(--ui-fg)]">
            {{ label || "Sticker" }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
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
}
@keyframes shimmer-spin {
  to {
    transform: rotate(360deg);
  }
}
.shimmer-border.silver::before {
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    #f5f5f5 60deg,
    #cfd8dc 120deg,
    #ffffff 180deg,
    transparent 240deg
  );
}
.shimmer-border::before {
  opacity: 0.6;
  filter: blur(2px);
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

.mythic-border.silver::before {
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(233, 240, 248, 0.7) 60deg,
    rgba(193, 205, 220, 0.6) 120deg,
    rgba(248, 251, 255, 0.7) 180deg,
    transparent 240deg
  );
}
</style>

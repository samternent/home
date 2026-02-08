<script setup lang="ts">
import { computed } from "vue";
import StickerFrame from "../stickerbook/StickerFrame.vue";
import type { PackPalette16, Sticker } from "./sticker-types";
import CanvasSticker16 from "./CanvasSticker16.vue";

type PixPaxStickerCardProps = {
  sticker: Sticker;
  palette: PackPalette16;
  compact?: boolean;
  missing?: boolean;
  animated?: boolean;
  animatedBackground?: boolean;
  sparkles?: boolean;
  glow?: boolean;
  shimmer?: boolean;
  finishFx?: boolean;
};

const props = withDefaults(defineProps<PixPaxStickerCardProps>(), {
  compact: true,
  missing: false,
  animated: true,
  animatedBackground: true,
  sparkles: false,
  glow: true,
  shimmer: true,
  finishFx: true,
});

const frameRarity = computed(() => {
  if (props.sticker.meta.shiny) {
    return "mythic";
  }
  switch (props.sticker.meta.rarity) {
    case "epic":
      return "uncommon";
    default:
      return "common";
  }
});

const finish = computed(() => props.sticker.meta.finish);

const finishClass = computed(() => {
  if (props.missing || !props.finishFx) return "";
  if (finish.value === "holo") return "finish-holo";
  if (finish.value === "gold") return "finish-gold";
  if (finish.value === "silver") return "finish-silver";
  return "";
});

const displayLabel = computed(() => props.sticker.meta.name);
const displayStatus = computed(() => (props.missing ? "unowned" : "owned"));
const showAtmosphere = computed(
  () => props.animated && props.animatedBackground && !props.missing,
);
const showSparkles = computed(
  () => props.animated && props.sparkles && !props.missing,
);
const showGlow = computed(() => props.glow && !props.missing);
const finishOverlayClass = computed(() => {
  if (finishClass.value === "finish-holo") {
    return "bg-[linear-gradient(130deg,rgba(255,255,255,0)_24%,rgba(173,255,247,0.16)_38%,rgba(255,226,140,0.2)_50%,rgba(194,213,255,0.14)_62%,rgba(255,255,255,0)_76%)] mix-blend-screen";
  }
  if (finishClass.value === "finish-gold") {
    return "bg-[radial-gradient(circle_at_50%_10%,rgba(255,224,130,0.26)_0%,rgba(255,197,91,0.1)_38%,transparent_72%)] mix-blend-screen";
  }
  if (finishClass.value === "finish-silver") {
    return "bg-[radial-gradient(circle_at_54%_12%,rgba(239,247,255,0.25)_0%,rgba(195,212,229,0.1)_38%,transparent_72%)] mix-blend-screen";
  }
  return "";
});
</script>

<template>
  <StickerFrame
    :rarity="frameRarity"
    :compact="props.compact"
    :label="displayLabel"
    :sublabel="sticker.meta.collectionName"
    :status="displayStatus"
    :seed="sticker.meta.id"
    :missing="props.missing"
    :animated="props.animated"
    :backdrop="props.animatedBackground"
    :shimmer="props.shimmer"
    :mythic-glow="props.glow"
    :mythic-dots="props.sparkles"
    :mythic-border="props.glow"
  >
    <div
      class="relative h-auto w-full aspect-square overflow-hidden rounded-[0.2rem] [container-type:inline-size] isolate"
    >
      <div
        v-if="showAtmosphere"
        class="pointer-events-none absolute inset-0 z-[4] animate-[atmoDrift_12s_ease-in-out_infinite_alternate] bg-[radial-gradient(circle_at_18%_22%,color-mix(in_srgb,var(--ui-accent)_35%,transparent)_0%,transparent_46%),radial-gradient(circle_at_78%_70%,color-mix(in_srgb,var(--ui-primary)_28%,transparent)_0%,transparent_52%)] opacity-80"
        aria-hidden="true"
      ></div>
      <div
        v-if="showSparkles"
        class="pointer-events-none absolute inset-[-8%] z-[5] animate-[sparkleFloat_7.5s_linear_infinite] mix-blend-screen bg-[radial-gradient(circle_at_24%_28%,rgba(255,255,255,0.45)_0_2%,transparent_3%),radial-gradient(circle_at_72%_34%,rgba(255,255,255,0.35)_0_1.8%,transparent_3%),radial-gradient(circle_at_56%_76%,rgba(255,255,255,0.38)_0_2.2%,transparent_3.2%),radial-gradient(circle_at_18%_80%,rgba(255,255,255,0.3)_0_1.4%,transparent_2.6%)] opacity-65"
        aria-hidden="true"
      ></div>
      <CanvasSticker16
        :art="sticker.art"
        :palette="props.palette"
        class="relative z-[10] size-full mx-auto"
      />
      <div
        v-if="finishClass"
        :class="[
          'pointer-events-none absolute inset-0 z-[4]',
          finishOverlayClass,
        ]"
        aria-hidden="true"
      />
    </div>
  </StickerFrame>
</template>

<style scoped>
@keyframes sparkleFloat {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0.55;
  }
  50% {
    transform: translateY(-2.5%) scale(1.02);
    opacity: 0.75;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.55;
  }
}

@keyframes atmoDrift {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-2%, 2%, 0);
  }
}
</style>

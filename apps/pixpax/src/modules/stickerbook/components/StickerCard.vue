<script setup lang="ts">
import { computed } from "vue";
import type {
  PixpaxPublicCollectionBundle,
  PixpaxPublicCollectionCard,
} from "@/modules/api/client";
import StickerPixelArt from "./StickerPixelArt.vue";
import StickerCardFrame from "./StickerCardFrame.vue";
import { getStickerLabel, isStickerShiny } from "@/modules/stickerbook/pixel";

const props = withDefaults(
  defineProps<{
    bundle: PixpaxPublicCollectionBundle;
    card: PixpaxPublicCollectionCard;
    missing?: boolean;
    highlighted?: boolean;
    quantity?: number | null;
    compact?: boolean;
  }>(),
  {
    missing: false,
    highlighted: false,
    quantity: null,
    compact: false,
  },
);

const label = computed(() => getStickerLabel(props.card));
const shiny = computed(() => isStickerShiny(props.card));
const frameTone = computed(() => (shiny.value ? "mythic" : "common"));
const showAtmosphere = computed(() => !props.missing);
const showSparkles = computed(() => !props.missing && shiny.value);
const showFinishOverlay = computed(() => shiny.value);
const showShimmer = computed(() => !props.missing);
</script>

<template>
  <article
    class="group flex flex-col items-center gap-2"
    :class="props.compact ? 'w-34 sm:w-38' : 'w-40 sm:w-46 md:w-52'"
  >
    <StickerCardFrame
      :tone="frameTone"
      :compact="props.compact"
      :label="label"
      :seed="props.card.cardId"
      :missing="props.missing"
      :animated="true"
      :backdrop="true"
      :shimmer="showShimmer"
      :accent-glow="shiny"
      :accent-dots="showSparkles"
      :accent-border="shiny"
    >
      <div
        class="relative isolate aspect-square w-full overflow-hidden rounded-[0.35rem] [container-type:inline-size]"
        :class="props.highlighted ? 'ring-1 ring-[color-mix(in_srgb,var(--ui-primary)_35%,transparent)]' : ''"
      >
        <div
          v-if="showAtmosphere"
          class="pointer-events-none absolute inset-0 z-[4] animate-[atmoDrift_12s_ease-in-out_infinite_alternate] bg-[radial-gradient(circle_at_18%_22%,color-mix(in_srgb,var(--ui-accent)_35%,transparent)_0%,transparent_46%),radial-gradient(circle_at_78%_70%,color-mix(in_srgb,var(--ui-primary)_28%,transparent)_0%,transparent_52%)] opacity-80"
          aria-hidden="true"
        />
        <div
          v-if="showSparkles"
          class="pointer-events-none absolute inset-[-8%] z-[5] animate-[sparkleFloat_7.5s_linear_infinite] mix-blend-screen bg-[radial-gradient(circle_at_24%_28%,rgba(255,255,255,0.45)_0_2%,transparent_3%),radial-gradient(circle_at_72%_34%,rgba(255,255,255,0.35)_0_1.8%,transparent_3%),radial-gradient(circle_at_56%_76%,rgba(255,255,255,0.38)_0_2.2%,transparent_3.2%),radial-gradient(circle_at_18%_80%,rgba(255,255,255,0.3)_0_1.4%,transparent_2.6%)] opacity-65"
          aria-hidden="true"
        />
        <StickerPixelArt
          :bundle="props.bundle"
          :card="props.card"
          :faded="props.missing"
          class="relative z-[10] size-full mx-auto"
        />
        <div
          v-if="showFinishOverlay"
          class="pointer-events-none absolute inset-0 z-[4] bg-[linear-gradient(130deg,rgba(255,255,255,0)_24%,rgba(173,255,247,0.16)_38%,rgba(255,226,140,0.2)_50%,rgba(194,213,255,0.14)_62%,rgba(255,255,255,0)_76%)] mix-blend-screen"
          aria-hidden="true"
        />
      </div>

      <div
        v-if="props.quantity"
        class="absolute bottom-3 right-3 rounded-full bg-[rgba(20,18,23,0.76)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-fg)] ring-1 ring-[rgba(255,255,255,0.14)] backdrop-blur-sm"
      >
        x{{ props.quantity }}
      </div>
    </StickerCardFrame>

    <p
      v-if="props.missing"
      class="m-0 text-[10px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
    >
      Missing
    </p>
  </article>
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

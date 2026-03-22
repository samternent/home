<script setup lang="ts">
import { computed } from "vue";
import type { PixpaxPublicCollectionCard } from "@/modules/api/client";
import { decodeStickerPixelArt, getStickerPalette } from "@/modules/stickerbook/pixel";
import type { PixpaxPublicCollectionBundle } from "@/modules/api/client";

const props = defineProps<{
  bundle: PixpaxPublicCollectionBundle;
  card: PixpaxPublicCollectionCard;
  faded?: boolean;
}>();

const art = computed(() => decodeStickerPixelArt(props.card));
const palette = computed(() => getStickerPalette(props.bundle));
const cellSize = computed(() => 100 / Math.max(art.value?.size || 16, 1));
</script>

<template>
  <div
    class="relative aspect-square w-full overflow-hidden rounded-[0.55rem]"
    :class="props.faded ? 'opacity-50 grayscale-[0.7]' : ''"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.14)_0%,transparent_22%),radial-gradient(circle_at_72%_75%,rgba(255,214,120,0.14)_0%,transparent_24%)] mix-blend-screen"
    />
    <svg
      v-if="art"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      class="size-full image-render-pixel drop-shadow-[0_10px_20px_rgba(0,0,0,0.18)]"
      shape-rendering="crispEdges"
    >
      <rect width="100" height="100" fill="transparent" />
      <rect
        v-for="(pixel, index) in art.pixels"
        :key="`${props.card.cardId}-${index}`"
        :x="(index % art.size) * cellSize"
        :y="Math.floor(index / art.size) * cellSize"
        :width="cellSize"
        :height="cellSize"
        :fill="palette.colors[pixel] || 'transparent'"
      />
    </svg>
    <div
      v-else
      class="flex size-full items-center justify-center bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-primary)_18%,transparent),transparent)] text-[10px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]"
    >
      No art
    </div>
  </div>
</template>

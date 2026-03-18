<script setup lang="ts">
import { computed } from "vue";
import CanvasSticker16 from "../CanvasSticker16.vue";
import type { PackPalette16, StickerArt16 } from "../sticker-types";
import type { PixPaxKitLayer } from "./types";

const props = defineProps<{
  layers: PixPaxKitLayer[];
  palette: PackPalette16;
  class?: any;
}>();

const EMPTY_ART_16: StickerArt16 = {
  v: 1,
  w: 16,
  h: 16,
  fmt: "idx4",
  px: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
};

const fallbackArt = computed<StickerArt16>(() => {
  const layer = Array.isArray(props.layers) ? props.layers[0] : null;
  const gridB64 = String(layer?.renderPayload?.gridB64 || "").trim();
  const gridSize = Number(layer?.renderPayload?.gridSize || 16);
  if (gridB64 && gridSize === 16) {
    return {
      v: 1,
      w: 16,
      h: 16,
      fmt: "idx4",
      px: gridB64,
    };
  }
  return EMPTY_ART_16;
});
</script>

<template>
  <CanvasSticker16 :art="fallbackArt" :palette="props.palette" :class="props.class" />
</template>

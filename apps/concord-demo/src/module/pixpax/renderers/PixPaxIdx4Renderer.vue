<script setup lang="ts">
import CanvasSticker16 from "../CanvasSticker16.vue";
import type { PackPalette16, StickerArt16 } from "../sticker-types";

const props = defineProps<{
  art: StickerArt16;
  palette: PackPalette16;
  class?: any;
}>();
</script>

<template>
  <CanvasSticker16 :art="props.art" :palette="props.palette" :class="props.class" />
</template>

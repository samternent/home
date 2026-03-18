<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import type { PackPalette16 } from "../sticker-types";
import PixPaxIdx4Renderer from "./PixPaxIdx4Renderer.vue";
import PixPaxKitRenderer from "./PixPaxKitRenderer.vue";
import type { PixPaxArtInput, PixPaxArtRendererKind } from "./types";

const props = defineProps<{
  art: PixPaxArtInput;
  palette: PackPalette16;
  class?: any;
}>();

const rendererByKind: Record<PixPaxArtRendererKind, Component> = {
  idx4: PixPaxIdx4Renderer,
  kit: PixPaxKitRenderer,
};

const resolvedRenderer = computed(() => rendererByKind[props.art.kind] || PixPaxIdx4Renderer);
</script>

<template>
  <component
    :is="resolvedRenderer"
    v-if="props.art.kind === 'idx4'"
    :art="props.art.art"
    :palette="props.palette"
    :class="props.class"
  />
  <component
    :is="resolvedRenderer"
    v-else
    :layers="props.art.layers"
    :palette="props.palette"
    :class="props.class"
  />
</template>

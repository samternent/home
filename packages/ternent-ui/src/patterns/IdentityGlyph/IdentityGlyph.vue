<script setup lang="ts">
import { computed } from "vue";
import type {
  IdentityGlyphAlgorithm,
  IdentityGlyphInput,
  IdentityGlyphSize,
} from "./identityGlyph.types";
import {
  createIdentityGlyphModel,
  getIdentityGlyphPaletteValues,
  resolveIdentityGlyphSize,
} from "./identityGlyph.utils";

const props = withDefaults(
  defineProps<{
    algorithm?: IdentityGlyphAlgorithm;
    identity: IdentityGlyphInput;
    size?: number | IdentityGlyphSize;
    title?: string;
  }>(),
  {
    algorithm: "glyph:v1",
    size: "sm",
    title: undefined,
  },
);

const pixelSize = computed(() => resolveIdentityGlyphSize(props.size));
const model = computed(() => createIdentityGlyphModel(props.identity, props.algorithm));
const paletteValues = computed(() => getIdentityGlyphPaletteValues(model.value.palette));
const accessibleTitle = computed(
  () => props.title ?? `Identity glyph ${model.value.shortIdentity}`,
);
</script>

<template>
  <svg
    :width="pixelSize"
    :height="pixelSize"
    :viewBox="`0 0 ${model.grid.length} ${model.grid.length}`"
    xmlns="http://www.w3.org/2000/svg"
    shape-rendering="crispEdges"
    role="img"
    :aria-label="accessibleTitle"
    :data-glyph-algorithm="model.algorithm"
    :data-glyph-fallback="String(model.fallback)"
  >
    <title>{{ accessibleTitle }}</title>
    <template v-for="(row, y) in model.grid" :key="`glyph-row-${y}`">
      <rect
        v-for="(cell, x) in row"
        :key="`glyph-cell-${x}-${y}`"
        :x="x"
        :y="y"
        width="1"
        height="1"
        :fill="paletteValues[cell] ?? model.palette.background"
      />
    </template>
  </svg>
</template>

<script setup>
import { computed, h, useAttrs } from "vue";
import useGlyph from "./useGlyph";

const props = defineProps({
  identity: {
    type: String,
    required: true,
  },
  variant: {
    type: Number,
    default: 0,
  },
});

const attrs = useAttrs();
const { grid, colors, isReady } = useGlyph(
  computed(() => props.identity),
  computed(() => props.variant)
);

const glyphVNode = computed(() => {
  const size = grid.value.length || 1;
  const rects = [];

  if (isReady.value) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = grid.value[y][x] ?? 0;
        const color = colors.value[index] || [220, 220, 220];

        rects.push(
          h("rect", {
            x,
            y,
            width: 1,
            height: 1,
            fill: `rgb(${color.join(",")})`,
          })
        );
      }
    }
  }

  const svgAttrs = { ...attrs };
  if ("size" in svgAttrs) {
    delete svgAttrs.size;
  }

  return h(
    "svg",
    {
      viewBox: `0 0 ${size} ${size}`,
      width: "100%",
      height: "100%",
      xmlns: "http://www.w3.org/2000/svg",
      "shape-rendering": "crispEdges",
      ...svgAttrs,
    },
    rects
  );
});
</script>
<template>
  <component :is="glyphVNode" />
</template>

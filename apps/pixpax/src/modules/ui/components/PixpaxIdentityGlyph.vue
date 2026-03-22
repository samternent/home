<script setup lang="ts">
import { computed, h, useAttrs } from "vue";
import { usePixpaxGlyph } from "./usePixpaxGlyph";

const props = withDefaults(
  defineProps<{
    identity: string;
    size?: "xs" | "sm" | "md" | "lg";
  }>(),
  {
    size: "sm",
  },
);

const attrs = useAttrs();
const { grid, colors, isReady } = usePixpaxGlyph(computed(() => props.identity));

const pixelSize = computed(() => {
  if (props.size === "xs") return "1.25rem";
  if (props.size === "md") return "2.5rem";
  if (props.size === "lg") return "3.5rem";
  return "2rem";
});

const glyphVNode = computed(() => {
  const size = grid.value.length || 1;
  const rects = [];

  if (isReady.value) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = grid.value[y]?.[x] ?? 0;
        const color = colors.value[index] || [220, 220, 220];
        rects.push(
          h("rect", {
            x,
            y,
            width: 1,
            height: 1,
            fill: `rgb(${color.join(",")})`,
          }),
        );
      }
    }
  }

  return h(
    "svg",
    {
      viewBox: `0 0 ${size} ${size}`,
      width: "100%",
      height: "100%",
      xmlns: "http://www.w3.org/2000/svg",
      "shape-rendering": "crispEdges",
      ...attrs,
    },
    rects,
  );
});
</script>

<template>
  <div
    class="overflow-hidden rounded-[0.9rem] shadow-[0_8px_22px_rgba(0,0,0,0.16)]"
    :style="{ width: pixelSize, height: pixelSize }"
    :key="identity"
  >
    <component :is="glyphVNode" />
  </div>
</template>

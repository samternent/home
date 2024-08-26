<script setup>
import { shallowRef, computed } from "vue";
import { useLocalStorage, useElementSize } from "@vueuse/core";
import SResizer from "./SResizer.vue";

const props = defineProps({
  minContentWidth: {
    type: Number,
    default: 600,
  },
  minSidebarWidth: {
    type: Number,
    default: 400,
  },
});
const resizeContainer = shallowRef(null);
const dragPosition = useLocalStorage(
  "routes/RoutePortfolioSweetShop/dragPosition",
  600
);
const isDragging = shallowRef(false);

const { width: containerWidth } = useElementSize(resizeContainer);
const width = computed(() => `${dragPosition.value}px`);

const isResizable = computed(
  () => containerWidth.value > props.minContentWidth + props.minSidebarWidth
);
</script>
<template>
  <div
    class="flex h-full relative w-full"
    ref="resizeContainer"
    :class="{
      'pointer-events-none select-none': isDragging,
      'flex-col overflow-auto': !isResizable,
    }"
  >
    <div
      :class="{ 'overflow-auto flex h-full w-full': isResizable }"
      :style="isResizable ? { width, minWidth: `${minContentWidth}px` } : {}"
    >
      <slot />
    </div>
    <div
      class="flex flex-1 relative border-l border-base-200"
      :style="isResizable ? { minWidth: `${minSidebarWidth}px` } : {}"
    >
      <SResizer
        v-if="isResizable"
        v-model:position="dragPosition"
        v-model:dragging="isDragging"
        :container="resizeContainer"
      />
      <div class="p-2 flex flex-col h-full w-full">
        <slot name="sidebar" />
      </div>
    </div>
  </div>
</template>

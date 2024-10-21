<script setup>
import { shallowRef, computed, watch, onMounted } from "vue";
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
  identifier: {
    type: String,
    default: "SResizablePanels",
  },
  type: {
    type: String,
    default: "primary",
    validator: (value) => ["primary", "secondary", "accent"].includes(value),
  },
});

const contentWidth = defineModel("contentWidth", {
  type: Number,
  default: 600,
});
const sidebarWidth = defineModel("sideBarWidth", {
  type: Number,
  default: 400,
});

const resizeContainer = shallowRef(null);
const dragPosition = useLocalStorage(
  `routes/${props.identifier}/dragPosition`,
  600
);
const isDragging = shallowRef(false);
const contentEl = shallowRef(null);
const sidebarEl = shallowRef(null);

const { width: containerWidth } = useElementSize(resizeContainer);
const { width: contentWidthEl } = useElementSize(contentEl);
const { width: sidebarWidthEl } = useElementSize(sidebarEl);
const width = computed(() => `${dragPosition.value}px`);

watch([contentWidthEl, sidebarWidthEl], () => {
  contentWidth.value = contentWidthEl.value;
  sidebarWidth.value = sidebarWidthEl.value;
});

onMounted(() => {
  contentWidth.value = contentWidthEl.value;
  sidebarWidth.value = sidebarWidthEl.value;
});

const isResizable = computed(
  () => containerWidth.value > props.minContentWidth + props.minSidebarWidth
);
</script>
<template>
  <div
    class="flex relative w-full overflow-hidden"
    ref="resizeContainer"
    :class="{
      'pointer-events-none select-none': isDragging,
      'flex-col overflow-auto': !isResizable,
    }"
  >
    <div
      ref="contentEl"
      class="z-10"
      :class="{ 'overflow-auto flex h-full w-full': isResizable }"
      :style="isResizable ? { width, minWidth: `${minContentWidth}px` } : {}"
    >
      <slot />
    </div>
    <div
      ref="sidebarEl"
      class="flex flex-1 relative border-l border-base-200"
      :style="isResizable ? { minWidth: `${minSidebarWidth}px` } : {}"
    >
      <SResizer
        v-if="isResizable"
        v-model:position="dragPosition"
        v-model:dragging="isDragging"
        :container="resizeContainer"
        :type="type"
      />
      <div class="flex flex-col h-full w-full overflow-auto z-10">
        <slot name="sidebar" />
      </div>
    </div>
  </div>
</template>

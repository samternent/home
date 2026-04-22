<script setup lang="ts">
import { useLocalStorage, useWindowSize } from "@vueuse/core";
import type { PropType } from "vue";
import { PanelChrome } from "ternent-ui/patterns";

defineProps({
  container: {
    type: Object as PropType<HTMLElement | null>,
    default: typeof document !== "undefined" ? document.body : null,
  },
});

const { width } = useWindowSize();

const isDragging = useLocalStorage("isBottomPanelDragging", false);
const isBottomPanelExpanded = useLocalStorage("isBottomPanelExpanded", false);
const bottomPanelHeight = useLocalStorage(
  "bottomPanelHeight",
  width.value < 500 ? 620 : 320,
);
</script>
<template>
  <PanelChrome
    v-model:open="isBottomPanelExpanded"
    v-model:height="bottomPanelHeight"
    v-model:dragging="isDragging"
    :container="container"
    title="Console"
  >
    <template #header>
      <slot name="panel-control" />
    </template>

    <slot />
  </PanelChrome>
</template>

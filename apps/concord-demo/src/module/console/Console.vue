<script setup lang="ts">
import { onMounted, shallowRef, watch } from "vue";
import type { Component, PropType } from "vue";
import { useLocalStorage, useWindowSize } from "@vueuse/core";
import { Button } from "ternent-ui/primitives";

defineProps({
  container: {
    type: Object as PropType<HTMLElement | null>,
    default: null,
  },
  tone: {
    type: String,
    default: "default",
  },
});

const { width } = useWindowSize();

const SResizer = shallowRef<Component | null>(null);

onMounted(async () => {
  const { SResizer: Resizer } = await import("ternent-ui/components");
  SResizer.value = Resizer;
});

const dragPosition = useLocalStorage("routes/RouteLedger/dragPosition", 600);
const isDragging = shallowRef(false);

const isBottomPanelExpanded = useLocalStorage("isBottomPanelExpanded", false);
const bottomPanelHeight = useLocalStorage(
  "bottomPanelHeight",
  width.value < 500 ? 620 : 320
);

watch(dragPosition, (value) => {
  if (value > 200) {
    bottomPanelHeight.value = value;
  }
});
</script>
<template>
  <section
    class="flex flex-col z-20 relative"
    :class="{
      'h-8': !isBottomPanelExpanded,
      'transition-all': !isDragging,
    }"
    :style="`${isBottomPanelExpanded && `height: ${bottomPanelHeight}px`}`"
  >
    <component
      :is="SResizer"
      v-if="SResizer && isBottomPanelExpanded"
      direction="horizontal"
      v-model:position="dragPosition"
      v-model:dragging="isDragging"
      :container="container"
      type="primary"
    />

    <!-- Panel Control + Indicator -->
    <div
      class="flex justify-between px-2 h-8 border-y relative z-30 py-1 border-[var(--ui-border)]"
      :class="{
        'text-[var(--ui-on-critical)] bg-[var(--ui-critical)]':
          tone === 'danger',
        'bg-[var(--ui-surface)]': tone === 'default',
      }"
    >
      <div class="flex-1 items-center flex justify-between">
        <slot name="panel-control" />
      </div>

      <div class="flex items-center justify-center">
        <Button
          aria-label="Toggle Bottom Panel"
          :aria-pressed="isBottomPanelExpanded"
          @click="isBottomPanelExpanded = !isBottomPanelExpanded"
          variant="plain-secondary"
          class="mr-2"
          size="micro"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 transition-transform duration-300 transform-gpu"
            :class="isBottomPanelExpanded ? 'rotate-0' : 'rotate-180'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </Button>
      </div>
    </div>

    <div class="flex-1 flex overflow-auto">
      <slot />
    </div>
  </section>
</template>

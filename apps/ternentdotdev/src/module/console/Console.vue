<script setup>
import { shallowRef, watch } from "vue";
import { useLocalStorage, useWindowSize } from "@vueuse/core";
import { SResizer, SButton } from "ternent-ui/components";

defineProps({
  container: {
    type: HTMLElement,
    default: document.body,
  },
});

const { width } = useWindowSize();

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
    class="flex flex-col z-40 relative"
    :class="{
      'h-8': !isBottomPanelExpanded,
      'transition-all': !isDragging,
    }"
    :style="`${isBottomPanelExpanded && `height: ${bottomPanelHeight}px`}`"
  >
    <SResizer
      v-if="isBottomPanelExpanded"
      direction="horizontal"
      v-model:position="dragPosition"
      v-model:dragging="isDragging"
      :container="container"
      type="primary"
    />

    <!-- Panel Control + Indicator -->
    <div
      class="flex justify-between px-micro h-8 border-b border-muted bg-surface relative z-50 py-1"
    >
      <div class="flex-1 items-center flex justify-between">
        <slot name="panel-control" />
      </div>

      <div class="flex items-center justify-center">
        <SButton
          aria-label="Toggle Bottom Panel"
          :aria-pressed="isBottomPanelExpanded"
          @click="isBottomPanelExpanded = !isBottomPanelExpanded"
          variant="ghost"
          size="nano"
          class="mr-micro"
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
        </SButton>
      </div>
    </div>

    <div class="flex-1 flex overflow-auto">
      <slot />
    </div>
  </section>
</template>

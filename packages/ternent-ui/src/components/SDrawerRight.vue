<script setup>
import { shallowRef, computed } from "vue";
import { useElementBounding } from "@vueuse/core";
import SResizer from "./SResizer.vue";
import SButton from "./SButton.vue";

const props = defineProps({
  title: {
    type: String,
    default: "Drawer",
  },
  container: {
    type: HTMLElement,
    default: document.body,
  },
});

const isOpen = defineModel({
  type: Boolean,
  default: false,
});

const dragPosition = shallowRef();
const isDragging = shallowRef(false);

const { width: containerWidth, left: containerLeft } = useElementBounding(
  props.container
);

const width = computed(() => {
  const width = containerWidth.value - dragPosition.value;

  if (width > containerWidth.value - 20) {
    return `${containerWidth.value}px`;
  }

  return `${containerWidth.value - dragPosition.value}px`;
});
</script>
<template>
  <div
    v-if="isOpen"
    class="absolute top-0 right-0 z-40 bg-base-100 border-l border-base-300 shadow-2xl bottom-0 min-w-[450px] p-4"
    :style="{ width }"
  >
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold">{{ title }}</h2>

      <SButton class="btn-sm" @click="isOpen = false">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </SButton>
    </div>
    <SResizer
      v-model:position="dragPosition"
      v-model:dragging="isDragging"
      :container="container"
      direction="vertical"
    />
    <div class="my-2 h-full overflow-auto">
      <slot />
    </div>
  </div>
</template>
<style scoped></style>

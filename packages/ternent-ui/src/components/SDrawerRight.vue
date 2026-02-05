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
    type: Object,
    default: null,
  },
  width: {
    type: String,
    default: "450px",
  }
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

const drawerWidth = computed(() => {
  if (dragPosition.value) {
    const width = containerWidth.value - dragPosition.value;
    if (width > containerWidth.value - 20) {
      return `${containerWidth.value}px`;
    }
    return `${containerWidth.value - dragPosition.value}px`;
  }
  return props.width;
});
</script>
<template>
  <!-- Backdrop overlay -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
      @click="isOpen = false"
    />
  </Transition>

  <!-- Drawer panel -->
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-200 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed top-0 right-0 z-50 bg-base-100 shadow-2xl bottom-0 flex flex-col"
      :style="{ width: drawerWidth, minWidth: '400px', maxWidth: '90vw' }"
    >
      <!-- Enhanced header with gradient and better typography -->
      <div class="flex items-center justify-between p-6 border-b border-base-200/60 bg-gradient-to-r from-base-100 to-base-50">
        <div>
          <h2 class="text-xl font-semibold text-base-content">{{ title }}</h2>
          <div class="w-12 h-1 bg-primary rounded-full mt-1"></div>
        </div>

        <SButton 
          type="ghost" 
          size="sm" 
          icon
          @click="isOpen = false"
          class="hover:bg-base-200 hover:rotate-90 transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </SButton>
      </div>

      <!-- Resizer handle -->
      <SResizer
        v-model:position="dragPosition"
        v-model:dragging="isDragging"
        :container="container"
        direction="vertical"
        class="hover:bg-primary/20 transition-colors duration-200"
      />

      <!-- Content area with improved scrolling -->
      <div class="flex-1 overflow-auto">
        <div class="relative">
          <!-- Subtle top fade -->
          <div class="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-base-100 to-transparent pointer-events-none z-10"></div>
          
          <!-- Slot content -->
          <slot />
          
          <!-- Subtle bottom fade -->
          <div class="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-base-100 to-transparent pointer-events-none z-10"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

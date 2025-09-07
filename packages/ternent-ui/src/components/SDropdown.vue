<script setup>
import { shallowRef, computed } from "vue";
import { onClickOutside } from "@vueuse/core";

const props = defineProps({
  position: {
    type: String,
    default: "bottom-right", // bottom-right, bottom-left, top-right, top-left
  },
  width: {
    type: String,
    default: "w-64",
  },
  offset: {
    type: String,
    default: "top-12",
  }
});

const dropdownRef = shallowRef();
const showMenu = shallowRef(false);

const positionClasses = computed(() => {
  const positions = {
    'bottom-right': 'right-0 top-12',
    'bottom-left': 'left-0 top-12',
    'top-right': 'right-0 bottom-12',
    'top-left': 'left-0 bottom-12',
  };
  return positions[props.position] || positions['bottom-right'];
});

onClickOutside(dropdownRef, () => {
  showMenu.value = false;
});

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function closeMenu() {
  showMenu.value = false;
}
</script>
<template>
  <div class="flex relative" ref="dropdownRef">
    <slot name="activator" :showMenu="toggleMenu" :closeMenu="closeMenu" :isOpen="showMenu" />

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="showMenu"
        :class="[
          'absolute bg-base-100 z-50 flex flex-col overflow-hidden text-left',
          'shadow-xl border border-base-300 rounded-2xl backdrop-blur-md',
          'ring-1 ring-base-content/5',
          positionClasses,
          props.width
        ]"
      >
        <!-- Content with relative positioning -->
        <div class="relative">
          <slot :closeMenu="closeMenu" />
        </div>
      </div>
    </Transition>
  </div>
</template>

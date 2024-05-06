<script setup>
import { shallowRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import SButton from "./SButton.vue";

defineProps({
  buttonText: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const showMenu = shallowRef(false);
const dropdownRef = shallowRef(null);

onClickOutside(dropdownRef, () => {
  showMenu.value = false;
});

function selectItem(item) {
  emit("update:modelValue", item);
  showMenu.value = false;
}
</script>
<template>
  <div class="relative" ref="dropdownRef">
    <SButton @click="showMenu = !showMenu" class="btn-xs font-light">
      {{ buttonText }}

      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-4 h-4 ml-2 inline group-hover:inline opacity-40"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
        />
      </svg>
    </SButton>

    <div
      v-if="showMenu"
      class="absolute bg-base-100 z-20 left-0 top-12 flex flex-col text-left shadow-lg w-64 h-96 overflow-auto"
    >
      <ul class="item p-2">
        <li
          class="flex font-light p-2 hover:bg-base-200 cursor-pointer"
          v-for="item in items"
          :key="`theme-${item}`"
          @click="selectItem(item)"
        >
          <slot name="item" :item="item">
            {{ item }}
          </slot>
        </li>
      </ul>
    </div>
  </div>
</template>

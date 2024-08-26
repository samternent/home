<script setup>
import { shallowRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import SButton from "./SButton.vue";

defineProps({
  buttonText: {
    type: String,
    default: undefined,
  },
  items: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    default: undefined,
  },
  position: {
    type: String,
    default: "bottom",
    validator: (value) => ["top", "bottom", "right", "left"].includes(value),
  },
});

const emit = defineEmits(["update:modelValue", "select"]);

const showMenu = shallowRef(false);
const dropdownRef = shallowRef(null);

onClickOutside(dropdownRef, () => {
  showMenu.value = false;
});

function selectItem(item) {
  emit("update:modelValue", item);
  emit("select", item);
  showMenu.value = false;
}

function openMenu() {
  showMenu.value = true;
}
function closeMenu() {
  showMenu.value = false;
}
</script>
<template>
  <div class="relative" ref="dropdownRef">
    <slot name="activator" v-bind="{ openMenu }">
      <SButton @click="showMenu = !showMenu" class="btn-xs text-sm font-light">
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
    </slot>
    <div
      v-if="showMenu"
      class="absolute bg-base-200 text-base-content z-20 flex flex-col text-left shadow-lg w-64 max-h-96 overflow-auto"
      :class="{
        'bottom-0': position === 'top',
        'top-[100%] left-0': position === 'bottom',
        'left-[110%] top-[50%]': position === 'right',
        'left-0 top-[100%]': position === 'left',
      }"
    >
      <ul class="item p-2">
        <li v-for="item in items" :key="`theme-${item.value}`">
          <slot name="item" v-bind="{ item, closeMenu }">
            <RouterLink
              v-if="item.to"
              :to="item.to"
              @click.prevent="selectItem(item)"
              class="flex font-light p-2 hover:bg-base-200 cursor-pointer"
              :class="{
                '!bg-primary !bg-opacity-10':
                  item.value || item.name === modelValue,
              }"
            >
              {{ item.name }}
            </RouterLink>
            <SButton
              class="justify-start w-full rounded-0 font-light p-2 hover:bg-primary bg-opacity-0 hover:bg-opacity-10 cursor-pointer"
              :class="{
                '!bg-primary !bg-opacity-10':
                  item.value === modelValue || item.name === modelValue,
              }"
              v-else
              @click="selectItem(item)"
              >{{ item.name }}</SButton
            >
          </slot>
        </li>
      </ul>
    </div>
  </div>
</template>

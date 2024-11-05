<script setup>
import { shallowRef } from "vue";
import { onClickOutside } from "@vueuse/core";

const dropdownRef = shallowRef();
const showMenu = shallowRef(false);

onClickOutside(dropdownRef, () => {
  showMenu.value = false;
});
</script>
<template>
  <div class="flex relative" ref="dropdownRef">
    <slot name="activator" :showMenu="() => (showMenu = true)" />

    <div
      v-if="showMenu"
      class="absolute bg-base-100 z-20 right-0 top-12 flex flex-col overflow-hidden text-left shadow-lg w-64"
    >
      <slot />
    </div>
  </div>
</template>

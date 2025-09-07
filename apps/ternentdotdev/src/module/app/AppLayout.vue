<script setup>
import { shallowRef } from "vue";
import SideNav from "../side-nav/SideNav.vue";

const contentArea = shallowRef();
</script>
<template>
  <div
    ref="contentArea"
    class="flex-1 w-full relative bg-base-100 mx-auto h-full flex overflow-hidden z-10"
  >
    <SideNav />

    <slot name="drawer" />
    <div class="flex flex-col flex-1 h-full w-full overflow-auto">
      <slot name="nav" />
      <slot />
      <slot name="console" v-bind="{ container: contentArea }" />
    </div>
  </div>
</template>

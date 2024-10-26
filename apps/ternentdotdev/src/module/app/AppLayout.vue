<script setup>
import SideNav from "../side-nav/SideNav.vue";
</script>
<template>
  <div
    class="flex-1 w-full relative bg-base-100 mx-auto h-full flex overflow-hidden z-10"
  >
    <SideNav />

    <slot name="drawer" />
    <div class="flex flex-col flex-1 h-full w-full overflow-auto">
      <slot name="nav" />
      <slot />
    </div>
  </div>
</template>

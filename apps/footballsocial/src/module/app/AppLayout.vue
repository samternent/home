<script setup>
import { useWindowScroll } from "@vueuse/core";

const { x, y } = useWindowScroll();
</script>
<template>
  <div>
    <div class="sticky top-0 z-10">
      <slot name="banner" />
    </div>
    <div class="bg-base-100 max-w-4xl w-full mx-auto min-h-screen">
      <div
        class="flex border-b border-base-300 items-center sticky top-0 z-20 bg-base-100 justify-between transition-all duration-300"
        :class="{ 'shadow-md': y > 0 }"
      >
        <slot name="header" />
      </div>
      <slot name="content"> </slot>
      <div class="fadeInUp-animation">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
<style scoped>
@keyframes fadeInUp {
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0%);
    opacity: 1;
  }
}

.fadeInUp-animation {
  animation: 1.5s fadeInUp;
}
</style>

<script setup>
// import { computed } from "vue";
import { useWindowScroll } from "@vueuse/core";

const { x, y } = useWindowScroll();

// const scrollPercentage = computed(() => {
//   return Math.round(
//     (y.value /
//       (document.body.scrollHeight - document.documentElement.clientHeight)) *
//       100
//   );
// });
</script>
<template>
  <div>
    <div class="sticky top-0 z-10">
      <slot name="banner" />
    </div>
    <div class="bg-base-100 max-w-4xl w-full mx-auto min-h-screen">
      <div
        class="flex border-b border-base-300 items-center sticky top-0 z-20 bg-base-100 justify-between transition-shadow duration-300"
        :class="{ 'shadow-md': y > 0 }"
      >
        <!-- <div
          :style="`width: ${scrollPercentage}%; `"
          class="absolute left-0 top-0 h-1 bg-primary bg-opacity-80 transition-all z-10"
        ></div> -->
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
.pagescroll {
  background-image: url(spectrum.svg);
  background-repeat: no-repeat;
  background-size: var(--scrollPos) 0.2em;
  background-position: left bottom 3px;
  transition: background-size 0.2s ease;
}
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

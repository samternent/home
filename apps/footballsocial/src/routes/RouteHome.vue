<script setup>
import { useRouter } from "vue-router";
import { useLocalStorage } from "@vueuse/core";

const router = useRouter();
const lastLeague = useLocalStorage("lastLeague", "PL");
router.push({
  path: `/leagues/${!lastLeague.value ? "PL" : lastLeague.value}`,
});
</script>
<template>
  <div
    class="w-screen h-screen"
  >
    
  </div>
</template>
<style>
.animate-gradient {
  background-size: 200%;
  animation: animatedgradient 10s ease infinite alternate;
}

@keyframes animatedgradient {
  0% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 50% 100%;
  }
}
</style>

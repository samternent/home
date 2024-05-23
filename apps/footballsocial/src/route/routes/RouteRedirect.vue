<script setup>
import { useRouter } from "vue-router";
import { useLocalStorage } from "@vueuse/core";

const router = useRouter();
const lastLeague = useLocalStorage("lastLeague", "EC");
router.push({
  path: `/l/${!lastLeague.value ? "EC" : lastLeague.value}`,
});
</script>
<template>
  <div class="w-screen h-screen overflow-auto max-h-screen"></div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import { useLocalStorage } from "@vueuse/core";

const router = useRouter();
const lastLeague = useLocalStorage("lastLeague", "PL");

// router.push({ path: `/leagues/${lastLeague.value || "PL"}` });
</script>
<template>
  <h1>2023/24 Premier League Season</h1>
  <h2>Sat, 12 Aug 2023 – Sun, 19 May 2024</h2>
</template>

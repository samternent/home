<script setup>
import { watch } from "vue";
import { useRouter } from "vue-router";
import { useCompetitionLoader } from "@/module/football-data/useCompetitionLoader";

const router = useRouter();
const { items: competition } = useCompetitionLoader();

watch(
  competition,
  () => {
    if (competition.value.currentSeason?.currentMatchday) {
      router.push(
        `/l/${competition.value.code}/predictions/${competition.value.currentSeason?.currentMatchday}`
      );
    }
  },
  { immediate: true }
);
</script>
<template><div>redirecting...</div></template>

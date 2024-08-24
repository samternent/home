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
<template>
  <div
    class="flex flex-col gap-4 flex-1 justify-center font-bold items-center text-4xl my-12"
  >
    THE SEASON HAS NOT YET STARTED.
    <p class="text-2xl">PLEASE CHECK BACK LATER.</p>
  </div>
</template>

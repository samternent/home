<script setup>
import PredictionsList from "@/module/predict/PredictionsList.vue";
import { useCompetitionLoader } from "@/module/football-data/useCompetitionLoader";

const props = defineProps({
  gameweek: {
    type: String,
    default: null,
  },
});

const { items: competition } = useCompetitionLoader();
</script>
<template>
  <div class="flex flex-col w-full">
    <PredictionsList
      v-if="competition"
      :competitionCode="competition.code"
      :currentGameweek="Number(gameweek)"
      :currentSeason="competition.currentSeason?.id"
      @selected="
        (fixture) =>
          $router.push(
            `/l/${competition?.code}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import PredictionsList from "../../components/PredictionsList.vue";
import PredictionsResults from "../../components/PredictionsResults.vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: null,
  },
});
const { items: competition, hasItems: hasCompetition } = useCompetitionLoader();
const isCup = computed(() => competition.value.type === "CUP");
</script>
<template>
  <div class="flex">
    <PredictionsList
    v-if="competition && !isCup"
    :username="username"
    :competitionCode="competition?.code"
    :currentGameweek="competition?.currentSeason?.currentMatchday"
    @selected="
      (fixture) =>
        $router.push(
          `/leagues/${competition?.code}/discussions/new?fixture=${fixture?.id}`
        )
    "
  />
  <!-- <div class="w-96 hidden lg:block">
    <PredictionsResults
    v-if="competition && !isCup"
    :username="username"
    :competitionCode="competition?.code"
    :currentGameweek="competition?.currentSeason?.currentMatchday"
    @selected="
      (fixture) =>
        $router.push(
          `/leagues/${competition?.code}/discussions/new?fixture=${fixture?.id}`
        )
    "
  />
  </div> -->
  </div>
</template>

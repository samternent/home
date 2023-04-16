<script setup>
import { computed } from "vue";
import PredictionsList from "../../components/PredictionsList.vue";
import CupFixtures from "../../components/CupFixtures.vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

defineProps({
  username: {
    type: String,
    default: null,
  },
});
const { items: competition, hasItems: hasCompetition } = useCompetitionLoader();
const isCup = computed(() => competition.value.type === "CUP");
</script>
<template>
  <div class="py-2 mx-auto mb-24">
    <div class="my-8">
      <h1
        class="text-6xl text-white font-bold tracking-tighter shadow-text text-center"
        v-if="competition"
      >
        {{ competition.name }}.
      </h1>
      <h2
        class="text-3xl text-white font-light tracking-tighter shadow-text text-center"
        v-if="competition"
      >
        gameweek
        {{ competition?.currentSeason?.currentMatchday + 1 }} predictor.
      </h2>
    </div>
    <CupFixtures
      v-if="competition && isCup"
      :competitionCode="competition?.code"
      :currentGameweek="competition?.currentSeason?.currentMatchday"
      @selected="
        (fixture) =>
          $router.push(
            `/leagues/${competition?.code}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
    <PredictionsList
      v-if="competition && !isCup"
      :username="username"
      :competitionCode="competition?.code"
      :currentGameweek="competition?.currentSeason?.currentMatchday + 1"
      @selected="
        (fixture) =>
          $router.push(
            `/leagues/${competition?.code}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
  </div>
</template>

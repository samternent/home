<script setup>
import { watch } from 'vue';
import PredictionsResults from "../../components/PredictionsResults.vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";
import { calculatePredictionTable } from "../../composables/usePredictionService";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: null,
  },
  showGameweekResults: {
    type: String,
    default: null,
  },
});
const { items: competition } = useCompetitionLoader();

watch(competition, (_competition) => {
  if (_competition?.currentSeason.currentMatchday) {
    calculatePredictionTable(_competition.code, _competition.currentSeason.currentMatchday);
  }
}, { immediate: true });
</script>
<template>
  <div class="w-full">
    <ul
      class="flex max-w-[100vw] overflow-x-auto h-auto pb-2 mb-2 overflow-y-hidden"
    >
      <li>
        <RouterLink
          :to="`/leagues/${competitionCode}/table`"
          class="mx-2 py-1 uppercase hover:border-indigo-900 dark:text-white border-b-4 border-transparent"
          :class="{
            '!border-indigo-600': !showGameweekResults,
          }"
        >
          Season
        </RouterLink>
      </li>
      <li>
        <RouterLink
          :to="`/leagues/${competitionCode}/table/gameweek`"
          class="mx-2 py-1 uppercase hover:border-indigo-900 dark:text-white border-b-4 border-transparent"
          :class="{
            '!border-indigo-600': showGameweekResults,
          }"
        >
          Gameweek {{ competition?.currentSeason.currentMatchday }}
        </RouterLink>
      </li>
    </ul>
    <PredictionsResults
      v-if="competition && showGameweekResults"
      :competitionCode="competition?.code"
      :gameweek="competition?.currentSeason.currentMatchday"
    />
    <PredictionsResults
      v-else-if="competition"
      :competitionCode="competition?.code"
    />
    <div class="p-4 mt-6 text-zinc-200">
      <h3 class="text-xl font-light text-white">Rules</h3>
      <ul class="text-sm font-light my-2">
        <li>* 1 point for a correct home score</li>
        <li>* 1 point for a correct away score</li>
        <li>* 2 points for a correct result (W/L/D)</li>
        <li>* 3 points for a correct score</li>
      </ul>
      <p class="text-lg font-light my-8 text-white">
        Rules and point system are subject to change.
      </p>
    </div>
  </div>
</template>

<script setup>
import { watch, shallowRef, computed } from "vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";
import { usePredictionService } from "../../composables/usePredictionService";

import { STabs } from "ternent-ui/components";

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
    type: Boolean,
    default: false,
  },
});
const { items: competition } = useCompetitionLoader();
const predictionsReady = shallowRef(false);
const { calculatePredictionTable } = usePredictionService();

watch(
  competition,
  async (_competition) => {
    if (
      _competition?.currentSeason.currentMatchday &&
      _competition.code === props.competitionCode
    ) {
      predictionsReady.value = false;
      await calculatePredictionTable(
        _competition.code,
        _competition.currentSeason.currentMatchday
      );

      predictionsReady.value = true;
    }
  },
  { immediate: true }
);

const tabs = computed(() => [
  {
    title: "Season",
    path: `/leagues/${props.competitionCode}/table/season`,
  },
  {
    title: "Gameweek",
    path: `/leagues/${props.competitionCode}/table/gameweek`,
  },
]);
</script>
<template>
  <div class="w-full">
    <STabs :items="tabs" :path="$route.path" :exact="true" />
    <div class="w-full my-4 min-h-screen">
      <RouterView v-if="predictionsReady && competition" />
      <div v-else class="w-full pt-10">
        <div
          v-for="i in 10"
          :key="i"
          class="skeleton m-2 my-2 rounded flex-1 h-10 w-full"
        />
      </div>
    </div>
    <div class="collapse mt-16 rounded-none">
      <input type="checkbox" aria-label="Rules" />
      <div
        class="collapse-title text-xl lg:text-2xl bg-base-content text-base-100 anton-regular"
      >
        Rules
      </div>
      <div class="collapse-content bg-base-300">
        <ul class="text-base font-light my-8">
          <li>- 1 point for a correct home score</li>
          <li>- 1 point for a correct away score</li>
          <li>- 2 points for a correct result (W/L/D)</li>
          <li>- 3 points for a correct score</li>
        </ul>
        <p class="text-lg font-thin mt-4 mb-2">
          *Rules and point system are subject to change.
        </p>
      </div>
    </div>
  </div>
</template>

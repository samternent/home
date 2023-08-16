<script setup>
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
const { items: competition} = useCompetitionLoader();
</script>
<template>
  <!-- <div class="flex items-center flex-col justify-center w-full">
    <p class="text-2xl font-thin my-8">
      This page is still under construction.
    </p>
    <img :src="PlayerSvg" class="h-96 w-96 mx-auto" />
    <p class="text-lg font-thin my-8">
      all predictions are stored and will be added to the table upon release.
    </p>
  </div> -->
  <PredictionsResults
    v-if="competition"
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
</template>

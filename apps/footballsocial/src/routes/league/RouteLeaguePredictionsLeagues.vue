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
</template>

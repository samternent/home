<script setup>
import { shallowRef, unref} from "vue";
import { calculatePredictionTable } from "../../composables/usePredictionService";

const competitionCode = shallowRef("PL");
const gameweek = shallowRef(1);

function calculateResults() {
  calculatePredictionTable(unref(competitionCode), unref(gameweek));
}
</script>
<template>
  <div class="flex mx-auto max-w-4xl w-full">
    <input v-model="competitionCode" />
    <input v-model="gameweek" />
    <button @click="calculateResults">Calculate</button>
  </div>
</template>

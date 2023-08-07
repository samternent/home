<script setup>
import { computed } from "vue";
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
</template>

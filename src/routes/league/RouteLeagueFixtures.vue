<script setup>
import { inject } from "vue";
import FixturesList from "../../components/FixturesList.vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";
const { items: competition, hasItems: hasCompetition } = useCompetitionLoader();
</script>
<template>
  <div class="py-2">
    <FixturesList
      v-if="competition"
      :competitionCode="competition?.code"
      :currentGameweek="competition?.currentSeason?.currentMatchday"
      :currentStage="competition?.currentSeason?.currentStage || 'GROUP_STAGE'"
      @selected="
        (fixture) =>
          $router.push(
            `/leagues/${competition?.code}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
  </div>
</template>

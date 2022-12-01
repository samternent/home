<script setup>
import { computed } from "vue";
import FixturesList from "../../components/FixturesList.vue";
import CupFixtures from "../../components/CupFixtures.vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";
const { items: competition, hasItems: hasCompetition } = useCompetitionLoader();
const isCup = computed(() => competition.value.type === "CUP");
</script>
<template>
  <div class="py-2">
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
    <FixturesList
      v-if="competition && !isCup"
      :competitionCode="competition?.code"
      :currentGameweek="competition?.currentSeason?.currentMatchday"
      @selected="
        (fixture) =>
          $router.push(
            `/leagues/${competition?.code}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
  </div>
</template>

<script setup>
import { inject } from "vue";
import FixturesList from "../../components/FixturesList.vue";
const competition = inject("competition");
</script>
<template>
  <div class="py-2">
    <FixturesList
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

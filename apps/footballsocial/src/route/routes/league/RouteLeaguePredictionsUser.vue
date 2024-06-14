<script setup>
import PredictionsList from "@/module/predict/PredictionsList.vue";
import { useCompetitionLoader } from "@/module/football-data/useCompetitionLoader";

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

const { items: competition } = useCompetitionLoader();

const backPath = window.localStorage.getItem("lastLeagueTablePath");
</script>
<template>
  <div class="flex flex-col w-full">
    <div v-if="username" class="my-1">
      <RouterLink
        :to="`/l/${competitionCode}/table${backPath ? `/${backPath}` : ''}`"
        class="btn btn-ghost btn-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 inline mr-2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>

        Back
      </RouterLink>
    </div>
    <PredictionsList
      v-if="competition"
      :username="username"
      :competitionCode="competition.code"
      :currentGameweek="competition.currentSeason?.currentMatchday"
      :currentSeason="competition.currentSeason?.id"
      @selected="
        (fixture) =>
          $router.push(
            `/l/${competition?.code}/discussions/new?fixture=${fixture?.id}`
          )
      "
    />
  </div>
</template>

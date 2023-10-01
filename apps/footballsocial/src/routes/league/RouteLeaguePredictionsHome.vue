<script setup>
import { computed } from "vue";
import PredictionsList from "../../components/PredictionsList.vue";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";
import { useCurrentUser } from "../../composables/useCurrentUser";

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
const isCup = computed(() => competition.value.type === "CUP");

const backPath = window.localStorage.getItem("lastLeagueTablePath");
</script>
<template>
  <div class="flex flex-col w-full">
    <div v-if="username" class="text-zinc-300 mb-6">
      <RouterLink
        :to="`/leagues/${competitionCode}/table${
          backPath ? `/${backPath}` : ''
        }`"
        class="pb-2 hover:text-zinc-100 transition-all"
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
  </div>
</template>

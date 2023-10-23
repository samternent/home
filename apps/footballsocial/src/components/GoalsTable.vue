<script setup>
import { toRefs, computed } from "vue";
import useScorersLoader from "../api/football-data/useCompetitionScorersLoader";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
});

const { competitionCode } = toRefs(props);
const {
  items: scorer,
  loading: scorerLoading,
  loaded: scorerLoaded,
} = useScorersLoader(competitionCode);

const hasScorers = computed(() => !scorerLoading.value && scorerLoaded.value);
const scorerData = computed(() => scorer.value?.scorers);
</script>
<template>
  <h2 class="text-2xl my-4 font-light px-2">Top Scorers</h2>
  <div class="shadow md:rounded-lg text-sm md:text-base max-w-[100vw]">
    <table class="w-full text-sm md:text-base">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="text-left p-1 pb-2 min-w-10 w-10 min-w-[24px]">&nbsp;</th>
          <th class="text-left p-1 pb-2 w-32 md:w-64">
            <abbr title="Current team" class="font-thin">Team</abbr>
          </th>
          <th class="text-left p-1 pb-2 w-10 md:w-64">
            <abbr title="Player" class="font-thin">Player</abbr>
          </th>
          <th class="text-center p-1 pb-2">
            <abbr title="Goals scored" class="font-thin">
              <span class="hidden md:inline">Goals</span
              ><span class="md:hidden">G</span>
            </abbr>
          </th>
          <th class="text-center p-1 pb-2">
            <abbr title="Assists" class="font-thin"
              ><span class="hidden md:inline">Assists</span
              ><span class="md:hidden">A</span></abbr
            >
          </th>
        </tr>
      </thead>
      <tbody v-if="hasScorers" class="font-light">
        <tr v-for="row in scorerData" :key="row.position">
          <td class="text-left p-2">
            <img
              :alt="row.team.name"
              :src="row.team.crest"
              class="w-8 aspect-square"
            />
          </td>
          <td class="text-left p-1 truncate">
            <RouterLink
              :to="`/leagues/${competitionCode}/teams/${row.team.id}`"
            >
              <span class="hidden md:inline">{{ row.team.name }}</span
              ><span class="md:hidden">{{ row.team.shortName }}</span>
            </RouterLink>
          </td>
          <td class="text-left p-1 truncate w-32">
            <RouterLink
              :to="`/leagues/${competitionCode}/players/${row.player.id}`"
              >{{ row.player.name }}</RouterLink
            >
          </td>
          <td class="text-center p-1">{{ row.goals || 0 }}</td>
          <td class="text-center p-1">{{ row.assists || 0 }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="!hasScorers">
      <div
        v-for="i in 10"
        :key="i"
        class="animate-pulse m-2 rounded flex-1 h-8"
      />
    </div>
  </div>
</template>

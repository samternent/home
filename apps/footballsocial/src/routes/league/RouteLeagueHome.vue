<script setup>
import { computed, toRefs, watch, provide, shallowRef } from "vue";

import { useIntersectionObserver, useLocalStorage } from "@vueuse/core";
import { useTitle } from "@vueuse/core";

import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  gameweek: {
    type: Number,
    default: null,
  },
  season: {
    type: String,
    default: null,
  },
});

const { competitionCode, gameweek, season } = toRefs(props);
const title = useTitle();

const { items: competition, hasItems: hasCompetition } = useCompetitionLoader();

const crestMap = {
  DED: "ED",
};
const crest = computed(
  () => crestMap[competitionCode.value] || competitionCode.value
);
const tabs = shallowRef(["discussions", "table", "fixtures", "predictions"]);

watch(
  competition,
  (_competition) => {
    if (_competition?.name) {
      title.value = `${_competition.name}  - Football Social`;
    }
  },
  { immediate: true }
);
</script>
<template>
  <div
    v-if="competition?.type === 'LEAGUE'"
    class="bg-indigo-800 bg-opacity-20 border border-indigo-900 p-4 my-10 md:mt-2 rounded items-center flex flex-col md:flex-row justify-between"
  >
    <div class="text-lg font-light">
      <span class="text-xl font-medium text-pink-600 mr-2">NEW</span>Enter your
      Gameweek
      {{ competition?.currentSeason?.currentMatchday + 1 }} predictions.
    </div>
    <RouterLink
      :to="`/leagues/${competitionCode}/predictions`"
      class="mx-auto mt-4 md:m-0 px-4 py-2 uppercase bg-pink-600 hover:bg-pink-700 text-white font-light"
    >
      Enter Now!
    </RouterLink>
  </div>
  <ul class="flex my-4">
    <li v-for="t in tabs" :key="`${t}`">
      <RouterLink
        :to="`/leagues/${competitionCode}/${t}`"
        class="px-4 py-3 uppercase hover:bg-indigo-900 text-white border-b-4 border-transparent"
        active-class="bg-indigo-900 !border-indigo-600"
      >
        {{ t }}
      </RouterLink>
    </li>
  </ul>
  <RouterView />
  <div class="flex justify-center mt-16 mx-16 items-end transition-all">
    <img
      alt=""
      class="h-96 w-96 opacity-80 transition-all w-"
      src="../../assets/game-day.svg"
    />
  </div>
</template>

<script setup>
import { computed, toRefs, watch, shallowRef } from "vue";
import { onBeforeRouteUpdate, useRouter } from "vue-router";
import { useTitle, useLocalStorage } from "@vueuse/core";
import { competitions } from "../../utils/competitions";
import { provideCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

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

const router = useRouter();

const {
  items: competition,
  loading: competitionLoading,
  loaded: competitionLoaded,
} = provideCompetitionLoader(competitionCode);

const lastLeague = useLocalStorage("lastLeague", "PL");

watch(
  competition,
  (_competition) => {
    title.value = `${_competition?.name} - Football Social`;
    lastLeague.value = _competition?.code;
  },
  { immediate: true }
);

function gotoCompetition(e) {
  router.push({ path: `/leagues/${e.target.value}` });
}
</script>
<template>
  <div class="md:px-2 lg:px-4 flex-1 max-w-4xl mx-auto pt-0 w-full z-10" v-if="competition">
    <Teleport to="#HeaderControls">
      <div
        class="dark:text-white text-right text-sm border rounded border-zinc-700"
        v-if="competition"
      >
        <select
          :value="competition.code"
          class="capitalize p-1 rounded bg-inherit"
          @change="gotoCompetition"
        >
          <option
            v-for="competition in competitions"
            :key="competition.code"
            :value="competition.code"
          >
            {{ competition.name }}
          </option>
        </select>
      </div>
    </Teleport>
    <div class="flex w-full p-2 md:p-0 md:mt-4  text-white bg-gradient-to-r from-blue-400 to-teal-500 rounded shadow">
      <div class="mx-2 h-28 w-28 p-2 my-2 mt-4 inline-block rounded-lg">
        <img :src="competition?.emblem" />
      </div>
      <div
        class="px-3 p-2 font-thin ml-6 dark:bg-zinc900 rounded-lg flex-1 mt-4 mb-2 flex flex-col justify-center"
      >
        <p class="shadow-texttext-5xl md:text-6xl font-extrabold leading-tighter tracking-tighter py-1">{{ competition?.name }}.</p>
        <p class="flex items-center">
          <img
            v-if="competition"
            class="h-5 opacity-90 rounded mr-2 shadow-lg"
            :src="competition?.area?.flag"
          />
          <span class="font-light tracking-tighter">{{ competition?.area?.name }}</span>
        </p>
      </div>
    </div>
    <RouterView :competitionCode="competitionCode" :key="competitionCode" />
  </div>
  <div v-else class="flex-1 h-screen"></div>
</template>

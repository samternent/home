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
  <div
    class="md:px-2 lg:px-4 flex-1 max-w-4xl mx-auto pt-0 w-full z-10"
    v-if="competition"
  >
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
    <div class="flex w-full p-2 md:p-0 md:mt-4 text-white">
      <div
        class="px-3 p-2 font-thin dark:bg-zinc900 rounded-lg flex-1 flex flex-col justify-center"
      >
      <div class="flex items-start">
        <h1
          class="inline-block bg-gradient-to-r from-white to-90% to-indigo-500 bg-clip-text text-transparent tracking-tighter text-5xl font-black bg-300% animate-gradient"
        >
          Football Social<span class="text-pink-700">.</span>
        </h1>
        <span class="bg-indigo-800 text-pink-100 px-4 rounded-full mx-4 font-light text-sm">beta</span>
      </div>
        <div
          class="text-2xl tracking-tightest font-light"
        >
          {{ competition?.name }}.
        </div>
        <p
          class="text-xl md:text-2xl font-light leading-tighter tracking-tighter text-zinc-200"
        ></p>
        <p class="flex items-center py-4">
          <img
            v-if="competition"
            class="h-5 opacity-90 rounded mr-2 shadow-lg"
            :src="competition?.area?.flag"
          />
          <span class="font-light tracking-tighter">{{
            competition?.area?.name
          }}</span>
        </p>
      </div>
    </div>
    <RouterView :competitionCode="competitionCode" :key="competitionCode" />
  </div>
  <div v-else class="flex-1 h-screen"></div>
</template>

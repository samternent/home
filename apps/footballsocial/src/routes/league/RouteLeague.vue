<script setup>
import { computed, toRefs, watch, shallowRef } from "vue";
import { onBeforeRouteUpdate, useRouter } from "vue-router";
import { useTitle, useLocalStorage } from "@vueuse/core";
import { competitions } from "../../utils/competitions";
import { provideCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

import TBrandHeader from "ternent/ui/TBrandHeader";

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
    class="md:px-2 lg:px-4 flex-1 max-w-7xl mx-auto pt-0 w-full z-10"
    v-if="competition"
  >
    <Teleport to="#HeaderControls">
      <div
        class="text-right text-sm border rounded border-zinc-700"
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
    <div class="flex w-full p-2">
      <div
        class="px-1 p-2 font-thin rounded-lg flex-1 flex flex-col justify-center"
      >
        <div class="flex items-start">
          <TBrandHeader>Football Social</TBrandHeader>
        </div>
        <div class="text-lg tracking-tightest font-light">
          {{ competition?.name }}.
        </div>
        <p
          class="text-xl md:text-2xl font-light leading-tighter tracking-tighter text-zinc-200"
        ></p>
        <p class="flex items-center py-2">
          <img
            v-if="competition"
            class="h-4 opacity-90 rounded mr-2 shadow-lg"
            :src="competition?.area?.flag"
          />
          <span class="font-light tracking-tighter header">{{
            competition?.area?.name
          }}</span>
        </p>
      </div>
    </div>
    <RouterView :competitionCode="competitionCode" :key="competitionCode" />
  </div>
  <div v-else class="flex-1 h-screen"></div>
</template>

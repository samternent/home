<script setup>
import { toRefs, watch } from "vue";
import { useTitle, useLocalStorage } from "@vueuse/core";
import { provideCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

import { SBrandHeader, SSpinner, SHeader } from "ternent-ui/components";

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

const { competitionCode } = toRefs(props);
const title = useTitle();

const { items: competition, error } = provideCompetitionLoader(competitionCode);

const lastLeague = useLocalStorage("lastLeague", "PL");

watch(
  competition,
  (_competition) => {
    title.value = `${_competition?.name} - Football Social`;
    lastLeague.value = _competition?.code;
  },
  { immediate: true }
);
</script>
<template>
  <div
    class="md:px-2 lg:px-4 flex-1 max-w-6xl mx-auto pt-0 w-full"
    v-if="competition"
  >
    <SHeader>
      <div
        class="px-1 p-2 font-thin rounded-lg flex-1 flex flex-col justify-center"
      >
        <div class="flex text-lg tracking-tightest font-light">
          {{ competition?.name }},
          <span class="font-light tracking-tighter header ml-1">
            {{ competition?.area?.name }}
          </span>
          <img
            v-if="competition"
            class="h-3 opacity-90 rounded ml-2 shadow-lg"
            :src="competition?.area?.flag"
          />
        </div>
        <p
          class="text-xl md:text-2xl font-light leading-tighter tracking-tighter text-zinc-200"
        ></p>
      </div>
    </SHeader>
    <RouterView :competitionCode="competitionCode" :key="competitionCode" />
  </div>
  <div v-else-if="error" class="flex-1 h-screen mx-auto max-w-4xl w-full">
    <h1 class="text-4xl font-bold">{{ error.message }}</h1>
    <p>Sorry, we messed up.</p>
    <p>{{ error.config.baseURL }}</p>
    <p>{{ error.config.method }}</p>
    <p>{{ error.config.url }}</p>
  </div>
  <div v-else class="flex flex-1 h-screen w-full justify-center items-center">
    <SSpinner />
  </div>
</template>

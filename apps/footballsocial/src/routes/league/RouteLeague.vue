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
  <div class="md:px-2 lg:px-4 flex-1 max-w-4xl mx-auto pt-0 w-full h-screen">
    <SHeader>
      <div
        class="px-1 p-2 font-thin rounded-lg flex-1 flex flex-col justify-center mb-2"
      >
        <SBrandHeader>Football Social</SBrandHeader>
        <div class="flex text-lg tracking-tightest font-light items-center">
          {{ competition?.name }},
          <span class="font-light tracking-tighter header ml-1">
            {{ competition?.area?.name }}
          </span>
        </div>
        <p
          class="text-xl md:text-2xl font-light leading-tighter tracking-tighter text-zinc-200"
        ></p>
      </div>
    </SHeader>
    <RouterView :competitionCode="competitionCode" :key="competitionCode" />
    <div
      v-if="error"
      class="absolute min-h-screen flex-1 h-screen mx-auto max-w-6xl w-full"
    >
      <h1 class="text-4xl font-bold">{{ error.message }}</h1>
      <p>Sorry, we messed up.</p>
      <p>{{ error.config.baseURL }}</p>
      <p>{{ error.config.method }}</p>
      <p>{{ error.config.url }}</p>
    </div>
  </div>
</template>

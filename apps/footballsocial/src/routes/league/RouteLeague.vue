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
  <div class="md:px-2 lg:px-4 flex-1 max-w-3xl mx-auto pt-0 w-full z-10">
    <Teleport to="#HeaderControls">
      <div
        class="text-white text-right text-sm border rounded border-zinc-700"
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
    <h1
      class="text-white tracking-tighter font-bold tracking text-5xl my-8"
      v-if="competition"
    >
      {{ competition.name }}.
    </h1>
    <h1 v-else class="font-thin mb-2">
      <div class="bg-[#3c3c3c] animate-pulse m-2 rounded flex-1 h-6 w-64" />
    </h1>
    <RouterView :competitionCode="competitionCode" :key="competitionCode" />
  </div>
</template>

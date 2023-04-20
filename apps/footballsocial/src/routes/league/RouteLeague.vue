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
    <div class="flex w-full px-2 md:p-0">
      <div class="dark:bg-zinc50 mx-auto p-2 my-2 mt-4 inline-block rounded-lg">
        <img class="h-16" :src="competition?.emblem" />
      </div>
      <div
        class="px-3 p-2 font-thin ml-6 dark:bg-zinc900 rounded-lg flex-1 mt-4 mb-2 flex flex-col justify-center"
      >
        <p class="text-2xl py-1 font-thin">{{ competition?.name }}</p>
        <p class="flex items-center">
          <img
            v-if="competition"
            class="h-4 mr-2"
            :src="competition?.area.flag"
          />
          <span>{{ competition?.area.name }}</span>
        </p>
      </div>
    </div>
    <RouterView :competitionCode="competitionCode" :key="competitionCode" />
  </div>
</template>

<script setup>
import { computed, toRefs, watch, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { useTitle, useLocalStorage } from "@vueuse/core";
import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

import { STabs } from "ternent-ui/components";

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
const route = useRoute();

const { items: competition, hasItems: hasCompetition } = useCompetitionLoader();

const tabs = computed(() => [
  {
    title: "Predictions",
    path: `/leagues/${competitionCode.value}/predictions`,
  },
  { title: "Table", path: `/leagues/${competitionCode.value}/table` },
  // { title: "Leagues", path: `/leagues/${competitionCode.value}/leagues` },
  // {
  //   title: "Discussions",
  //   path: `/leagues/${competitionCode.value}/discussions`,
  // },
]);

watch(
  competition,
  (_competition) => {
    if (_competition?.name) {
      title.value = `${_competition.name} - Football Social`;
    }
  },
  { immediate: true }
);

const dismissEurosBanner = useLocalStorage(
  "footballsocial/dissmissEurosBanner",
  false
);
</script>
<template>
  <!-- Banner -->
  <div
    v-if="!dismissEurosBanner && competitionCode !== 'EC'"
    class="bg-base-content text-base-100 w-full mb-8 p-8 flex flex-col relative border-t-2 border-primary"
  >
    <div
      @click="dismissEurosBanner = true"
      class="cursor-pointer absolute right-2 top-2 opacity-60 hover:opacity-100 transition-opacity"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <div class="justify-between flex flex-col lg:flex-row items-bottom">
      <p class="text-xl font-light p-b flex-1">
        The
        <span class="transition-all font-bold tracking-tighter">
          European Championships</span
        >
        are coming!
      </p>

      <div class="w-full lg:w-64 px-4 flex justify-center items-center my-4 lg:my-0">
        <RouterLink
          to="/leagues/EC/predictions"
          class="btn btn-success w-full"
          >Place Euros predictions</RouterLink
        >
      </div>
    </div>
    <p class="text-sm font-light tracing-tight">
      TIP: You can change competition at any time by clicking the league name in
      the header.
    </p>
  </div>
  <STabs :items="tabs" :path="route.path" />
  <div class="flex mb-16 w-full mt-4">
    <RouterView />
  </div>
</template>

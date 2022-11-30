<script setup>
import { computed, toRefs, watch, shallowRef } from "vue";
import { onBeforeRouteUpdate } from "vue-router";
import { useTitle, useLocalStorage } from "@vueuse/core";

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

const {
  items: competition,
  loading: competitionLoading,
  loaded: competitionLoaded,
} = provideCompetitionLoader(competitionCode);

const competitions = shallowRef([
  {
    name: "Premier League",
    code: "PL",
  },
  {
    name: "Championship",
    code: "ELC",
  },
]);

watch(
  competition,
  (_competition) => {
    title.value = `${_competition?.name} - Football Social`;
  },
  { immediate: true }
);
const lastLeaguePath = useLocalStorage("lastLeaguePath");
onBeforeRouteUpdate((to) => {
  lastLeaguePath.value = to.path;
});
</script>
<template>
  <RouterView :competitionCode="competitionCode" />
</template>

<script setup>
// import { computed, shallowRef } from "vue";
// import { useCompetitionLoader } from "../../api/football-data/useCompetitionLoader";

// const props = defineProps({
//   competitionCode: {
//     type: String,
//     required: true,
//   },
//   username: {
//     type: String,
//     default: null,
//   },
// });
// const { items: competition } = useCompetitionLoader();
// const tabs = computed(() => [
//   { title: "Predictions", to: "play" },
//   { title: "Leagues", to: "leagues" },
// ]);

// const overrideGameweek = shallowRef();
// const gameweek = computed(
//   () =>
//     overrideGameweek.value || competition.value?.currentSeason?.currentMatchday
// );

// function setGameweek(_gameweek) {
//   overrideGameweek.value = _gameweek;
// }
</script>
<template>
  <RouterView />
</template>


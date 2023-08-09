<script setup>
import { toRefs, computed, shallowRef, reactive, unref, onMounted } from "vue";
import useFixturesLoader from "../api/football-data/useCompetitionFixturesLoader";
import {
  addPrediction,
  getPredictions,
} from "../composables/usePredictionService";
import { useCurrentUser } from "../composables/useCurrentUser";
import Predictor from "./Predictor.vue";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  currentGameweek: {
    type: Number,
    default: null,
  },
  stage: {
    type: String,
    default: null,
  },
  size: {
    type: String,
    default: "md",
  },
  username: {
    type: String,
    default: null,
  },
});

const { competitionCode, currentGameweek, stage } = toRefs(props);
const overrideGameweek = shallowRef();
const gameweek = computed(
  () => overrideGameweek.value || currentGameweek.value
);

const {
  items: fixtures,
  meta,
  loading: fixturesLoading,
  loaded: fixturesLoaded,
} = useFixturesLoader(competitionCode, stage, gameweek);

const hasFixtures = computed(
  () => !fixturesLoading.value && fixturesLoaded.value
);
const predictions = shallowRef({});
const serverPredictions = shallowRef(null);
const predictionsLoaded = shallowRef(false);
const lockedPredictions = shallowRef([]);

async function loadPredictions() {
  const { data } = await getPredictions(
    props.username || profile.value?.username,
    unref(competitionCode),
    unref(gameweek)
  );

  predictions.value = data.results;

  predictionsLoaded.value = true;
}

onMounted(loadPredictions);

const { profile } = useCurrentUser();

async function savePredictions() {
  await addPrediction(
    profile.value.username,
    unref(predictions),
    unref(competitionCode),
    unref(gameweek)
  );
  loadPredictions();
}

const isDirty = computed(
  () => serverPredictions.value !== JSON.stringify(unref(predictions))
);
</script>
<template>
  <table class="w-full text-sm md:text-base" v-if="predictions">
    <thead class="h-10 font-light">
      <tr class="font-thin text-center text-white">
        <th class="w-10">&nbsp;</th>
        <th class="text-left">
          <abbr title="Teams in Competition">User</abbr>
        </th>
        <th class="w-6">
          <abbr title="Correct Home Score">HS</abbr>
        </th>
        <th class="w-8">
          <abbr title="Correct Away Score">AS</abbr>
        </th>
        <th class="w-8">
          <abbr title="Correct Match Result">MR</abbr>
        </th>
        <th class="w-8">
          <abbr title="Correct Match Score">MS</abbr>
        </th>
        <th class="w-10">
          <abbr title="Points">PTS</abbr>
        </th>
      </tr>
    </thead>
    <tbody class="font-light">
      <tr
        class="border-b border-b-zinc-800 transition-all text-white"
      >
        <td class="text-center text-md p-2 text-white bg-[#3c3c3c ]">

        </td>
        <td class="text-left p-1">
          {{ profile.username }}
        </td>
        <td class="text-center p-1">{{ predictions.totalHomeGoals }}</td>
        <td class="text-center p-1">{{ predictions.totalAwayGoals }}</td>
        <td class="text-center p-1">{{ predictions.totalCorrectResult }}</td>
        <td class="text-center p-1">{{ predictions.correctScore }}</td>
        <td class="text-center p-1">{{ predictions.points }}</td>
      </tr>
    </tbody>
  </table>
  <div v-else class="w-full">
    <div
      v-for="i in 20"
      :key="i"
      class="bg-[#1e1e1e] animate-pulse my-2 rounded flex-1 h-12 w-full"
    />
  </div>
</template>
<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.9s ease;
  transition-duration: 0.2s;
}

.v-enter-from,
.v-leave-to {
  opacity: 1;
}
</style>

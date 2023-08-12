<script setup>
import { toRefs, computed, shallowRef, unref } from "vue";
import { watchThrottled } from "@vueuse/core";
import useFixturesLoader from "../api/football-data/useCompetitionFixturesLoader";
import {
  addPrediction,
  getPredictions,
} from "../composables/usePredictionService";
import { useCurrentUser } from "../composables/useCurrentUser";
import CountdownTimer from "./CountdownTimer.vue";
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

const { competitionCode, currentGameweek, stage, username } = toRefs(props);
const overrideGameweek = shallowRef();
const gameweek = computed(
  () => overrideGameweek.value || currentGameweek.value
);

const {
  items: fixtures,
} = useFixturesLoader(competitionCode, stage, gameweek);

const predictions = shallowRef({});
const serverPredictions = shallowRef(null);
const predictionsLoaded = shallowRef(false);
const lockedPredictions = shallowRef([]);

async function loadPredictions() {
  lockedPredictions.value = [];
  predictions.value = {};
  serverPredictions.value = null;

  const { data } = await getPredictions(
    props.username || profile.value?.username,
    unref(competitionCode),
    unref(gameweek)
  );

  data.predictions?.forEach((prediction) => {
    lockedPredictions.value = [
      ...lockedPredictions.value,
      prediction.fixtureId,
    ];

    predictions.value = {
      ...predictions.value,
      [prediction.fixtureId]: {
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
      },
    };

    serverPredictions.value = JSON.stringify(predictions.value);
  });

  predictionsLoaded.value = true;
}

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

function updatePrediction(prediction, fixture) {
  predictions.value = {
    ...predictions.value,
    [fixture.id]: prediction,
  };
}

const isDirty = computed(
  () => serverPredictions.value !== JSON.stringify(predictions.value)
);

watchThrottled([gameweek, competitionCode, username], loadPredictions, {
  throttle: 500,
  immediate: true,
});

const predictionsList = computed(
  () =>
    fixtures.value?.map((fixture) => ({
      ...fixture,
      prediction: predictions.value[fixture.id],
    })) || []
);

const hasPredictions = computed(() => {
  if (!serverPredictions.value) return false;
  return Object.keys(JSON.parse(serverPredictions.value)).length > 0;
});

const hidePredictions = computed(() => {
  return !!(
    props.username &&
    profile.value?.username !== props.username
  );
});
</script>
<template>
  <div class="w-full flex flex-col mx-auto" v-if="predictionsLoaded">
    <CountdownTimer
      :gameweek="gameweek"
      :kickOff="predictionsList[0]?.utcDate"
    />
    <div class="text-center my-0 flex flex-col">
      <span
        class="text-xl p-2 font-thin mx-4 bg-indigo-500 rounded-b bg-opacity-30"
        v-if="hasPredictions"
        >{{ username ? `${username}s` : "Your" }} predictions are in!</span
      >
      <span
        class="text-lg p-2 font-thin text-indigo-300 mx-4 bg-indigo-500 rounded-b  bg-opacity-30"
        v-else
        >predictions not yet made.</span
      >
    </div>

    <div
      v-for="(fixture, i) in predictionsList"
      :key="fixture.id"
      class="mx-auto w-full flex-1"
    >
      <Predictor
        :fixture="fixture"
        :size="size"
        :disabled="
          new Date(fixture.utcDate).getTime() < new Date().getTime() ||
          ['IN_PLAY', 'FINISHED'].includes(fixture.status) ||
          !profile?.username ||
          (username && profile?.username !== username) ||
          false
        "
        :hidePredictions="hidePredictions && new Date(fixture.utcDate).getTime() > new Date().getTime()"
        :showDate="fixture.utcDate !== fixtures[i - 1]?.utcDate"
        :prediction="fixture.prediction"
        @update:prediction="
          (prediction) => updatePrediction(prediction, fixture)
        "
        @click="(fixture) => $emit('selected', fixture)"
      />
    </div>
    <div class="text-center mt-8 flex flex-col items-end">
      <button
        :disabled="!isDirty"
        v-if="profile && (!username || profile.username === username)"
        @click="savePredictions"
        class="bg-green-700 font-thin w-64 text-xl uppercase disabled:opacity-20 rounded p-2 my-2"
      >
        Save predictions
      </button>
    </div>
  </div>

  <div v-else class="flex flex-col h-screen w-full pr-4 pt-1">
    <div
      v-for="i in 10"
      :key="i"
      class="bg-[#1e1e1e] animate-pulse m-2 my-4 rounded flex-1 h-20 w-full"
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

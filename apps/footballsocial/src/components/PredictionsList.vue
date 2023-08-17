<script setup>
import { toRefs, computed, shallowRef, unref } from "vue";
import { Interval, DateTime } from "luxon";
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

const { items: fixtures } = useFixturesLoader(competitionCode, stage, gameweek);

const predictions = shallowRef({});
const serverPredictions = shallowRef(null);
const predictionsLoaded = shallowRef(false);
const lockedPredictions = shallowRef([]);
const predictionsToUpdate = shallowRef({});

async function loadPredictions() {
  lockedPredictions.value = [];
  predictions.value = {};
  serverPredictions.value = null;
  predictionsToUpdate.value = {};

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
    unref(predictionsToUpdate),
    unref(competitionCode),
    unref(gameweek)
  );
  loadPredictions();
}

function updatePrediction(prediction, fixture) {
  if (
    prediction.homeScore === predictions.value[fixture.id]?.homeScore &&
    prediction.awayScore === predictions.value[fixture.id]?.awayScore
  ) {
    // already the same as the server
    return;
  }
  predictionsToUpdate.value = {
    ...predictionsToUpdate.value,
    [fixture.id]: prediction,
  };
}

const isDirty = computed(() => {
  return Object.keys(predictionsToUpdate.value).length > 0;
});

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
  return !!(props.username && profile.value?.username !== props.username);
});

function setGameweek(_gameweek) {
  overrideGameweek.value = _gameweek;
}

const gameweekPoints = computed(() => {
  return predictionsList.value?.reduce((acc, fixture) => {
    const timeDiff = Interval.fromDateTimes(
      DateTime.now(),
      DateTime.fromISO(fixture.utcDate)
    ).length();

    if (!isNaN(timeDiff) || timeDiff < 1 || !fixture.prediction) {
      return acc;
    }

    let points = 0;
    if (fixture.prediction?.homeScore === fixture.score.fullTime.home) {
      points += 1;
    }

    if (fixture.prediction?.awayScore === fixture?.score.fullTime.away) {
      points += 1;
    }

    if (
      fixture.prediction?.homeScore === fixture?.score.fullTime.home &&
      fixture.prediction?.awayScore === fixture?.score.fullTime.away
    ) {
      points += 3;
    }

    if (
      fixture.prediction?.homeScore > fixture.prediction?.awayScore &&
      fixture?.score.winner === "HOME_TEAM"
    ) {
      points += 2;
    }
    if (
      fixture.prediction?.awayScore > fixture.prediction?.homeScore &&
      fixture?.score.winner === "AWAY_TEAM"
    ) {
      points += 2;
    }
    if (
      fixture.prediction?.awayScore === fixture.prediction?.homeScore &&
      fixture?.score.winner === "DRAW"
    ) {
      points += 2;
    }
    return points + acc;
  }, 0);
});
</script>
<template>
  <div class="w-full flex flex-col mx-auto" v-if="predictionsLoaded">
    <div
      class="uppercase text-center font-light flex justify-between bg-gradient-to-r from-indigo-800 to-indigo-900 rounded-t text-white py-2 px-2"
      :class="{
        'text-indigo-300 bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-b bg-opacity-30':
          gameweek < currentGameweek,
      }"
    >
      <button
        @click="setGameweek(gameweek - 1)"
        :disabled="gameweek <= 1"
        :class="{
          'opacity-20': gameweek <= 1,
        }"
        :aria-label="`Gameweek ${gameweek - 1}`"
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
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>
      <CountdownTimer
        :gameweek="gameweek"
        :currentGameweek="currentGameweek"
        :kickOff="predictionsList[0]?.utcDate"
      />
      <button
        @click="setGameweek(gameweek + 1)"
        :aria-label="`Gameweek ${gameweek + 1}`"
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
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
    </div>
    <div class="text-center my-0 flex flex-col">
      <span
        class="text-xl font-thin bg-gradient-to-r from-green-900 to-green-700 py-1"
        :class="{
          ' bg-opacity-50': gameweek < currentGameweek,
        }"
        v-if="gameweekPoints"
        >{{ username ? `${username} scored` : "You scored" }}
        {{ gameweekPoints }} points</span
      >
      <span
        class="text-xl font-thin bg-indigo-900 bg-opacity-70 py-1"
        v-else-if="hasPredictions"
        >{{ username ? `${username}s` : "Your" }} predictions are in!</span
      >
      <span class="text-lg font-thin py-1 bg-indigo-500 bg-opacity-30" v-else
        >{{ username ? `${username}s` : "Your" }} predictions are not in
        yet.</span
      >
    </div>

    <div v-for="(fixture, i) in predictionsList" :key="fixture.id">
      <div
        v-if="fixture?.status !== 'POSTPONED'"
        class="mx-auto w-full flex-1 mb-2 bg-zinc-900 overflow-hidden"
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
          :hidePredictions="
            hidePredictions &&
            new Date(fixture.utcDate).getTime() > new Date().getTime()
          "
          :showDate="fixture.utcDate !== fixtures[i - 1]?.utcDate"
          :prediction="fixture.prediction"
          @update:prediction="
            (prediction) => updatePrediction(prediction, fixture)
          "
          @click="(fixture) => $emit('selected', fixture)"
        />
      </div>
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

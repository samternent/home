<script setup>
import { toRefs, computed, shallowRef, unref } from "vue";
import { Interval, DateTime } from "luxon";
import { watchThrottled } from "@vueuse/core";
import useFixturesLoader from "../api/football-data/useCompetitionFixturesLoader";
import { usePredictionService } from "../composables/usePredictionService";
import { useCurrentUser } from "../composables/useCurrentUser";
import { PredictionCard } from "../module/prediction";
import { getCompetitionGameweeks } from "../utils/competitions";
import SetUsername from "../components/SetUsername.vue";

import { SCountdown, SButton, SAlert } from "ternent-ui/components";

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

const { addPrediction, getPredictions } = usePredictionService();
const { competitionCode, currentGameweek, stage, username } = toRefs(props);
const overrideGameweek = shallowRef(currentGameweek.value);
const gameweek = computed(
  () => overrideGameweek.value || currentGameweek.value
);

const gameweeks = computed(() =>
  getCompetitionGameweeks(props.competitionCode)
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
  predictionsLoaded.value = false;

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

const { user, profile } = useCurrentUser();

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

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatKickoff(utcDate) {
  const date = DateTime.fromISO(utcDate);
  return `${weekdays[date.weekday - 1]}, ${date.toLocaleString(
    DateTime.DATETIME_MED
  )}`;
}

const alertMessage = computed(() =>
  gameweekPoints.value
    ? `${gameweekPoints.value} points scored.`
    : `${username.value ? `${username.value}s` : "Your"} predictions are in!`
);
</script>
<template>
  <div class="w-full flex flex-col mx-auto max-w-6xl" v-if="predictionsLoaded">
    <div
      class="my-1 flex items-center justify-between px-2 md:px-0 font-light"
      v-if="gameweekPoints > -1"
    >
      <select
        v-model="overrideGameweek"
        aria-label="Gameweek"
        class="select select-bordered select-sm mr-4"
      >
        <option v-for="gw in gameweeks" :key="`gameweek${gw}`" :value="gw">
          Gameweek {{ gw }}
        </option>
      </select>
      <SCountdown :time="predictionsList[0]?.utcDate" />
    </div>

    <SAlert v-if="hasPredictions || gameweekPoints" :message="alertMessage">
      <template #icon>🎉</template>
    </SAlert>

    <div class="flex flex-col w-full">
      <div
        v-for="(fixture, i) in predictionsList"
        :key="fixture.id"
        class="w-full flex flex-row"
      >
        <div
          v-if="fixture?.status !== 'POSTPONED'"
          class="mb-2 flex-1 overflow-hidden"
        >
          <div
            v-if="fixture.utcDate !== predictionsList[i - 1]?.utcDate"
            class="p-2 text-xl font-light"
          >
            {{ formatKickoff(fixture.utcDate) }}
          </div>
          <PredictionCard
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
    </div>
    <div class="text-center mt-8 flex flex-col items-end">
      <template v-if="user && !profile?.username">
        <SetUsername />
      </template>
      <SButton
        :disabled="!isDirty"
        v-else-if="profile && (!username || profile.username === username)"
        @click="savePredictions"
        type="success"
      >
        Save predictions
      </SButton>
    </div>
  </div>

  <div v-else class="flex flex-col h-screen w-full pr-4 pt-1">
    <div
      v-for="i in 10"
      :key="i"
      class="skeleton m-2 my-4 rounded flex-1 h-20 w-full"
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

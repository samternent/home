<script setup>
import { computed, shallowRef, unref, watch } from "vue";
import { Interval, DateTime } from "luxon";
import useFixturesLoader from "../api/football-data/useCompetitionFixturesLoader";
import { usePredictionService } from "../composables/usePredictionService";
import { useCurrentUser } from "../composables/useCurrentUser";
import { PredictionCard } from "../module/prediction";
import { getCompetitionGameweeks } from "../utils/competitions";

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
const competitionCode = computed(() => props.competitionCode);
const currentGameweek = computed(() => props.currentGameweek);
const stage = computed(() => props.stage);
const username = computed(() => props.username);
const overrideGameweek = shallowRef(currentGameweek.value);
const gameweek = computed(
  () => overrideGameweek.value || currentGameweek.value
);

const gameweeks = computed(() =>
  getCompetitionGameweeks(props.competitionCode)
);
const { user, profile } = useCurrentUser();

const { items: fixtures } = useFixturesLoader(competitionCode, stage, gameweek);

const predictions = shallowRef({});
const serverPredictions = shallowRef(null);
const predictionsLoaded = shallowRef(false);
const predictionsLoading = shallowRef(false);
const lockedPredictions = shallowRef([]);
const predictionsToUpdate = shallowRef({});

async function loadPredictions() {
  lockedPredictions.value = [];
  predictions.value = {};
  serverPredictions.value = null;
  predictionsToUpdate.value = {};
  predictionsLoaded.value = false;
  predictionsLoading.value = true;

  try {
    if (!profile.value && !username.value) {
      predictionsLoaded.value = false;
      predictionsLoading.value = false;
      return;
    }

    const { data } = await getPredictions(
      username.value || profile.value?.username,
      competitionCode.value,
      gameweek.value
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
    });
    serverPredictions.value = JSON.stringify(predictions.value);

    predictionsLoaded.value = true;
    predictionsLoading.value = false;
  } catch (e) {
    predictionsLoaded.value = false;
    predictionsLoading.value = false;
  }
}

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

watch(
  [gameweek, competitionCode, profile, username],
  () => {
    if (
      gameweek.value &&
      competitionCode.value &&
      (profile.value || username.value)
    ) {
      loadPredictions();
    }
  },
  {
    immediate: true,
  }
);

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

function formatKickOff(utcDate) {
  const date = DateTime.fromISO(utcDate);
  return `${weekdays[date.weekday - 1]}, ${date.toLocaleString(
    DateTime.DATE_MED
  )}`;
}

const alertMessage = computed(() =>
  gameweekPoints.value
    ? `${gameweekPoints.value} points scored.`
    : `${username.value ? `${username.value}s` : "Your"} predictions are in!`
);

function isSameDay(date1, date2) {
  return DateTime.fromISO(date1).hasSame(DateTime.fromISO(date2), "day");
}
</script>
<template>
  <div class="w-full flex flex-col mx-auto max-w-6xl">
    <div
      class="my-1 flex items-center justify-between px-2 md:px-0 font-light"
      v-if="gameweekPoints > -1"
    >
      <select
        v-model="overrideGameweek"
        aria-label="Gameweek"
        class="select select-bordered select-sm mr-4"
      >
        <option
          v-for="gw in gameweeks"
          :key="`gameweek_${competitionCode}_${gw}`"
          :value="gw"
        >
          Gameweek {{ gw }}
        </option>
      </select>
      <SCountdown v-if="fixtures" :time="fixtures[0]?.utcDate" />
      <div v-else class="skeleton h-14 w-64"></div>
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
            v-if="!isSameDay(fixture.utcDate, predictionsList[i - 1]?.utcDate)"
            class="p-2 px-2 font-light my-4 bg-primary text-primary-content inline-block border-b-2 border-secondary"
          >
            {{ formatKickOff(fixture.utcDate) }}
          </div>
          <PredictionCard
            :fixture="fixture"
            :size="size"
            :disabled="
              new Date(fixture.utcDate).getTime() < new Date().getTime() ||
              ['IN_PLAY', 'FINISHED'].includes(fixture.status) ||
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
    <div
      class="text-center mt-8 flex flex-col items-end"
      v-if="predictionsLoaded && fixtures.length"
    >
      <SButton
        :disabled="!isDirty"
        v-if="profile && (!username || profile.username === username)"
        @click="savePredictions"
        type="success"
      >
        Save predictions
      </SButton>
    </div>
    <div
      v-else-if="predictionsLoading || !fixtures.length"
      class="w-full pr-4 pt-10"
    >
      <div
        v-for="i in 10"
        :key="i"
        class="skeleton m-2 my-8 rounded flex-1 h-48 w-full"
      />
    </div>
    <div v-else class="w-full pr-4 pt-6">
      <div class="flex text-4xl justify-center items-center my-10">
        <SButton
          aria-label="Login"
          v-if="!user"
          to="/auth/login"
          class="text-2xl font-light"
          type="primary"
        >
          Login
        </SButton>
        <span class="font-light text-2xl mx-2">or</span>
        <SButton
          aria-label="Join"
          v-if="!user"
          to="/auth/signup"
          class="text-2xl font-light"
          type="secondary"
        >
          Join
        </SButton>
      </div>
    </div>
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

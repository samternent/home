<script setup>
import { computed, shallowRef, unref, watch } from "vue";
import { Interval, DateTime } from "luxon";
import useFixturesLoader from "../football-data/useCompetitionFixturesLoader";
import { usePredictionService } from "./usePredictionService";
import { useCurrentUser } from "../auth/useCurrentUser";
import PredictionCard from "../predict/PredictionCard.vue";
import { getCompetitionGameweeks } from "@/utils/competitions";

import { SCountdown, SButton, SAlert } from "ternent-ui/components";
import { useCompetitionLoader } from "@/module/football-data/useCompetitionLoader";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  currentGameweek: {
    type: Number,
    default: null,
  },
  currentSeason: {
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

const stages = {
  EC: {
    1: null,
    2: null,
    3: null,
    4: "LAST_16",
    5: "QUARTER_FINALS",
    6: "SEMI_FINALS",
    7: "FINAL",
  },
};

const competitionCode = computed(() => props.competitionCode);
const currentSeason = computed(() => props.currentSeason);
const username = computed(() => props.username);
const gameweek = computed(() => props.currentGameweek);
const stage = computed(() => stages[props.competitionCode]?.[gameweek.value]);

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
      unref(currentSeason),
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
    unref(currentSeason),
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

    const homeScoreResult = fixture?.score.extraTime
      ? fixture?.score.regularTime.home + fixture?.score.extraTime.home
      : fixture?.score.fullTime.home;

    const awayScoreResult = fixture?.score.extraTime
      ? fixture?.score.regularTime.away + fixture?.score.extraTime.away
      : fixture?.score.fullTime.away;

    if (!isNaN(timeDiff) || timeDiff < 1 || !fixture.prediction) {
      return acc;
    }

    let points = 0;
    if (fixture.prediction?.homeScore === homeScoreResult) {
      points += 1;
    }

    if (fixture.prediction?.awayScore === awayScoreResult) {
      points += 1;
    }

    if (
      fixture.prediction?.homeScore === homeScoreResult &&
      fixture.prediction?.awayScore === awayScoreResult
    ) {
      points += 3;
    }

    if (
      fixture.prediction?.awayScore === fixture.prediction?.homeScore &&
      (fixture?.score.winner === "DRAW" ||
        fixture?.score.duration === "PENALTY_SHOOTOUT")
    ) {
      points += 2;
    } else if (
      fixture.prediction?.homeScore > fixture.prediction?.awayScore &&
      fixture?.score.winner === "HOME_TEAM" &&
      fixture?.score.duration !== "PENALTY_SHOOTOUT"
    ) {
      points += 2;
    } else if (
      fixture.prediction?.awayScore > fixture.prediction?.homeScore &&
      fixture?.score.winner === "AWAY_TEAM" &&
      fixture?.score.duration !== "PENALTY_SHOOTOUT"
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

const alertMessage = computed(() => {
  if (!serverPredictions.value) {
    return ``;
  }
  if (!hasPredictions.value) {
    return "Predictions not made";
  }
  if (gameweekPoints.value) {
    return `${!props.username ? "You" : props.username} scored ${
      gameweekPoints.value
    } points 🎉 `;
  }
  if (hasPredictions.value) {
    if (props.username) {
      return `${props.username} has made their predictions`;
    }
    return "Your predictions are in 🙌";
  }
});

function isSameDay(date1, date2) {
  return DateTime.fromISO(date1).hasSame(DateTime.fromISO(date2), "day");
}

const firstKickOff = computed(() => {
  return DateTime.fromISO(fixtures.value[0]?.utcDate);
});
const hasKickOffStarted = computed(() => {
  return DateTime.fromISO(firstKickOff.value) < DateTime.now();
});
const hasNextWeekPredictions = computed(() => {
  return gameweeks.value.includes(gameweek.value + 1);
});
const hasLastWeekPredictions = computed(() => {
  return gameweeks.value.includes(gameweek.value - 1);
});

function formatStage(stage) {
  const stages = {
    LAST_16: "Last 16",
    QUARTER_FINALS: "Quarter Finals",
    SEMI_FINALS: "Semi Finals",
    FINAL: "Final",
  };
  return stages[stage];
}
</script>
<template>
  <div class="w-full flex flex-col mx-auto max-w-6xl">
    <div
      class="flex items-center justify-between px-2 md:px-0 font-light my-4"
      v-if="gameweekPoints > -1 && !username"
    >
      <div class="flex items-center">
        <SButton
          v-if="hasLastWeekPredictions"
          :to="`/l/${competitionCode}/predictions/${gameweek - 1}`"
          type="ghost"
          class="rounded-full btn-sm mr-4 hidden md:flex"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </SButton>
        <select
          v-if="gameweeks.length"
          :value="gameweek"
          aria-label="Gameweek"
          class="select select-bordered select-sm mr-4"
          @change="
            (a) =>
              $router.push(
                `/l/${competitionCode}/predictions/${a.target.value}`
              )
          "
        >
          <option
            v-for="gw in gameweeks"
            :key="`gameweek_${competitionCode}_${gw}`"
            :value="gw"
          >
            <span class="uppercase">{{
              formatStage(stages[competitionCode]?.[gw]) || `Gameweek ${gw}`
            }}</span>
          </option>
        </select>
        <SButton
          v-if="hasNextWeekPredictions"
          :to="`/l/${competitionCode}/predictions/${gameweek + 1}`"
          type="ghost"
          class="rounded-full btn-sm mr-4 hidden md:flex"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </SButton>
      </div>
      <div class="flex justify-center items-end flex-col gap-2">
        <SCountdown
          v-if="fixtures[0]?.utcDate && !hasKickOffStarted"
          :time="fixtures[0]?.utcDate"
        />
      </div>
    </div>
    <div
      v-if="alertMessage"
      role="alert"
      class="flex h-16 bg-base-300 !rounded-0 p-4 justify-between items-center my-6"
    >
      <span class="text-xl font-light tracking-tighter">{{
        alertMessage
      }}</span>
      <SButton
        v-if="hasNextWeekPredictions && hasPredictions && !username"
        :to="`/l/${competitionCode}/predictions/${gameweek + 1}`"
        type="primary"
        class="btn-sm"
        >Play next week</SButton
      >
    </div>
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
            class="px-2 md:py-2 text-sm md:text-base font-medium my-4 inline-block border-b-2 border-primary"
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

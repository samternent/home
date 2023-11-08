<script setup>
import { shallowRef, computed, watch, toRefs } from "vue";
import { DateTime, Interval } from "luxon";

const props = defineProps({
  fixture: {
    type: Object,
    required: true,
  },
  size: {
    type: String,
    default: "md",
  },
  hideCrests: {
    type: Boolean,
    default: false,
  },
  prediction: {
    type: Object,
    default: () => {},
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  showDate: {
    type: Boolean,
    default: false,
  },
  hidePredictions: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["click", "update:prediction"]);

const hasStarted = computed(() => {
  const timeDiff = Interval.fromDateTimes(
    DateTime.now(),
    DateTime.fromISO(props.fixture.utcDate)
  ).length();
  if (isNaN(timeDiff)) {
    return true;
  }
  return timeDiff < 1;
});

const homeScore = shallowRef();
const awayScore = shallowRef();

const { prediction } = toRefs(props);
watch(
  prediction,
  (_prediction) => {
    homeScore.value =
      props.hidePredictions && !hasStarted.value ? "0" : _prediction?.homeScore;
    awayScore.value =
      props.hidePredictions && !hasStarted.value ? "0" : _prediction?.awayScore;
  },
  { immediate: true }
);
watch([homeScore, awayScore], ([_homeScore, _awayScore]) => {
  if (_homeScore === undefined || _awayScore === undefined) {
    return;
  }
  emit("update:prediction", { homeScore: _homeScore, awayScore: _awayScore });
});

const homeScorePrediction = computed(() => {
  if (props.prediction?.homeScore === props.fixture?.score.fullTime.home) {
    return true;
  }
});
const awayScorePrediction = computed(() => {
  if (props.prediction?.awayScore === props.fixture?.score.fullTime.away) {
    return true;
  }
});
const scorePrediction = computed(() => {
  if (
    props.prediction?.homeScore === props.fixture?.score.fullTime.home &&
    props.prediction?.awayScore === props.fixture?.score.fullTime.away
  ) {
    return true;
  }
});
const resultPrediction = computed(() => {
  if (
    props.prediction?.homeScore > props.prediction?.awayScore &&
    props.fixture?.score.winner === "HOME_TEAM"
  ) {
    return true;
  }
  if (
    props.prediction?.awayScore > props.prediction?.homeScore &&
    props.fixture?.score.winner === "AWAY_TEAM"
  ) {
    return true;
  }
  if (
    props.prediction?.awayScore === props.prediction?.homeScore &&
    props.fixture?.score.winner === "DRAW"
  ) {
    return true;
  }

  return false;
});
</script>
<template>
  <div
    class="flex flex-col w-full bg-default border border-light rounded-tr-lg rounded-bl-lg overflow-hidden"
    :class="{
      'text-xl': size === 'lg',
      'text-base ': size === 'md',
    }"
  >
    <div
      class="flex justify-between border-b border-light bg-surface text-white"
    >
      <div class="flex text-xs">
        <span v-if="fixture.status === 'IN_PLAY'" class="px-4 py-2 bg-success"
          >In play</span
        >
        <span
          v-else-if="fixture.status === 'PAUSED'"
          class="px-4 py-2 bg-success"
          >Half time</span
        >
        <span v-else-if="!!fixture.score?.winner" class="px-4 py-2 bg-success"
          >Finished</span
        >
        <span
          v-else-if="fixture.status === 'POSTPONED'"
          class="px-4 py-2 bg-success"
          >POSTPONED</span
        >
        <span
          v-else-if="fixture.status === 'TIMED'"
          class="px-4 py-2 bg-success"
          >Scheduled</span
        >
      </div>
      <div class="flex text-xs p-2" v-if="hasStarted">
        <div
          v-if="scorePrediction"
          class="px-3 rounded mx-1 bg-green-600 text-green-300"
        >
          MS +3
        </div>
        <div
          v-if="resultPrediction"
          class="mx-1 px-3 rounded bg-green-500 text-green-800"
        >
          MR +2
        </div>
        <div
          v-if="homeScorePrediction"
          class="mx-1 px-3 rounded bg-green-400 text-green-700"
        >
          HS +1
        </div>
        <div
          v-if="awayScorePrediction"
          class="mx-1 px-3 rounded bg-green-400 text-green-700"
        >
          AS +1
        </div>
      </div>
    </div>

    <div
      class="flex flex-col flex-1 w-full px-2 justify-between items-center truncate text-sm sm:text-base p-2"
    >
      <div class="flex w-full">
        <div
          class="flex-1 flex items-center truncate my-1 lg:text-xl md:font-light pr-2"
        >
          <img
            v-if="!hideCrests"
            :alt="fixture.homeTeam.name"
            :src="fixture.homeTeam.crest || '/blank.png'"
            class="w-10 h-10 sm:w-14 sm:h-14 mr-2 lg:mr-4"
          />
          <span class="hidden md:inline truncate">{{
            fixture.homeTeam.name
          }}</span
          ><span class="md:hidden truncate">{{
            fixture.homeTeam.shortName
          }}</span>
        </div>
        <div class="flex flex-row text-center justify-center items-center">
          <input
            :disabled="disabled"
            v-model="homeScore"
            type="number"
            min="0"
            max="9"
            class="text-center text-2xl w-12 h-12 rounded pl-4 font-medium border-light border"
            :class="{
              'blur-md': hidePredictions && !hasStarted,
              '': disabled,
            }"
          />
          <span
            v-if="hasStarted"
            class="text-xl rounded font-medium mr-2 ml-4"
            :class="{
              '': fixture.score?.fullTime?.home != homeScore,
              '': fixture.score?.fullTime?.home == homeScore,
            }"
            >{{ fixture.score?.fullTime?.home }}</span
          >
        </div>
      </div>

      <div class="flex w-full">
        <div
          class="flex-1 flex items-center truncate my-1 lg:text-xl md:font-light pr-2"
        >
          <img
            v-if="!hideCrests"
            :alt="fixture.awayTeam.name"
            :src="fixture.awayTeam.crest || '/blank.png'"
            class="w-10 h-10 sm:w-14 sm:h-14 mr-2 lg:mr-4"
          />
          <span class="hidden md:inline truncate">{{
            fixture.awayTeam.name
          }}</span
          ><span class="md:hidden truncate">{{
            fixture.awayTeam.shortName
          }}</span>
        </div>
        <div class="flex flex-row text-center justify-center items-center">
          <input
            :disabled="disabled"
            v-model="awayScore"
            type="number"
            min="0"
            max="9"
            class="text-center text-2xl w-12 h-12 rounded pl-4 font-medium border-light border"
            :class="{
              'blur-md': hidePredictions && !hasStarted,
              '': disabled,
            }"
          />
          <span
            v-if="hasStarted"
            class="text-xl rounded font-medium mr-2 ml-4"
            :class="{
              '': fixture.score?.fullTime?.away != awayScore,
              '': fixture.score?.fullTime?.away == awayScore,
            }"
            >{{ fixture.score?.fullTime?.away }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

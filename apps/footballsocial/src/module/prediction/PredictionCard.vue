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
    class="card bg-base-200 rounded-tl-md rounded-tr-lg rounded-bl-lg overflow-hidden p-2"
  >
    <div
      class="flex justify-between bg-neutral text-neutral-content rounded-md p-2"
    >
      <div class="flex text-xs">
        <span v-if="fixture.status === 'IN_PLAY'">In play</span>
        <span v-else-if="fixture.status === 'PAUSED'">Half time</span>
        <span v-else-if="!!fixture.score?.winner">Finished</span>
        <span v-else-if="fixture.status === 'POSTPONED'">POSTPONED</span>
        <span v-else-if="fixture.status === 'TIMED'">Scheduled</span>
      </div>
      <div class="flex text-xs" v-if="hasStarted">
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
        <div v-if="scorePrediction" class="ml-2">⭐</div>
      </div>
    </div>

    <div
      class="flex flex-col flex-1 w-full justify-between items-center truncate text-sm sm:text-base p-1"
    >
      <div class="flex w-full">
        <div
          class="flex-1 flex items-center truncate my-1 lg:text-xl md:font-light pr-2"
        >
          <img
            v-if="!hideCrests"
            width="60"
            height="60"
            :alt="fixture.homeTeam.name"
            :src="fixture.homeTeam.crest || '/blank.png'"
            class="w-10 h-10 sm:w-14 sm:h-14 mr-2 lg:mr-4"
          />
          <span class="md:!inline hidden truncate">{{
            fixture.homeTeam.name
          }}</span
          ><span class="md:hidden truncate">{{
            fixture.homeTeam.shortName
          }}</span>
        </div>
        <div class="flex flex-row text-center justify-center items-center my-1">
          <input
            :disabled="disabled"
            v-model="homeScore"
            type="number"
            min="0"
            max="9"
            aria-label="Home score"
            class="bg-base-100 text-center text-xl h-12 rounded px-2 font-medium input input-bordered"
            :class="{
              'blur-md': hidePredictions && !hasStarted,
              '': disabled,
            }"
          />
          <span
            v-if="hasStarted"
            class="text-xl rounded font-medium mx-2 w-10"
            :class="{
              '': fixture.score?.fullTime?.home != homeScore,
              '': fixture.score?.fullTime?.home == homeScore,
            }"
            >{{ fixture.score?.fullTime?.home }}</span
          >
        </div>
      </div>

      <div class="flex w-full gap-2">
        <div
          class="flex-1 flex items-center truncate my-1 lg:text-xl md:font-light pr-2"
        >
          <img
            v-if="!hideCrests"
            :alt="fixture.awayTeam.name"
            :src="fixture.awayTeam.crest || '/blank.png'"
            width="60"
            height="60"
            class="w-12 h-12 sm:w-14 sm:h-14 mr-2 lg:mr-4"
          />
          <span class="hidden md:!block truncate">{{
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
            aria-label="Away score"
            class="bg-base-100 text-center text-xl h-12 rounded px-2 font-medium input input-bordered"
            :class="{
              'blur-md': hidePredictions && !hasStarted,
              '': disabled,
            }"
          />
          <span
            v-if="hasStarted"
            class="text-xl rounded font-medium mx-2 w-10"
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

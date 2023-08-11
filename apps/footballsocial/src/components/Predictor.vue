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

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const kickOff = computed(() => {
  const date = DateTime.fromISO(props.fixture.utcDate);
  return `${weekdays[date.weekday - 1]}, ${date.toLocaleString(
    DateTime.DATETIME_MED
  )}`;
});
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
    homeScore.value = props.hidePredictions && !hasStarted.value ? "0" : _prediction?.homeScore;
    awayScore.value = props.hidePredictions && !hasStarted.value  ? "0" : _prediction?.awayScore;
  },
  { immediate: true }
);
watch(
  [homeScore, awayScore],
  ([_homeScore, _awayScore]) => {
    emit("update:prediction", { homeScore: _homeScore, awayScore: _awayScore });
  },
  { immediate: true }
);

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
    class="flex flex-col relative transition-all font-light items-center w-full border-x-[transparent] border-transparent border-x-4"
    :class="{
      'border-l-4 border-l-green-900':
        fixture.score?.winner?.includes('HOME_TEAM'),
      'border-r-4 border-r-green-900':
        fixture.score?.winner?.includes('AWAY_TEAM'),
      'border-l-4 border-l-red-900':
        fixture.score?.winner?.includes('AWAY_TEAM'),
      'border-r-4 border-r-red-900':
        fixture.score?.winner?.includes('HOME_TEAM'),
      'text-xl': size === 'lg',
      'text-base ': size === 'md',
    }"
  >
    <div class="flex flex-col items-center justify-center">
      <span v-if="showDate" class="w-full font-thin dark:bg-zinc900 p-2 my-2">{{
        kickOff
      }}</span>
      <span
        v-if="fixture.status === 'IN_PLAY'"
        class="absolute left-0 text-xs px-4 m-1 bg-green-600 rounded-full dark:text-white"
        >In play</span
      >
      <span
        v-if="fixture.status === 'PAUSED'"
        class="absolute left-0 text-xs px-4 m-1 bg-orange-900 rounded-full dark:text-white"
        >Half time</span
      >
      <span
        v-if="fixture.status === 'POSTPONED'"
        class="absolute left-0 text-xs px-4 m-1 bg-red-800 rounded-full dark:text-white"
        >POSTPONED</span
      >
    </div>

    <div
      class="flex flex-1 w-full px-2 justify-between items-center truncate text-sm sm:text-base dark:bg-[#1e1e1e] hover:dark:bg-[#232323] p-2"
    >
      <div
        class="flex-1 flex items-center truncate my-1 lg:text-xl md:font-light"
        :class="{ 'justify-between': !hideCrests, 'justify-end': hideCrests }"
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
      <div class="flex flex-col">
        <div
          v-if="resultPrediction"
          class="mx-auto px-3 text-sm bg-green-500 bg-opacity-50 -mt-3 rounded-b"
        >
          correct result
        </div>
        <div class="flex">
          <div class="flex flex-row text-center justify-center items-center">
            <input
              :disabled="disabled"
              v-model="homeScore"
              type="number"
              min="0"
              max="9"
              class="text-center text-2xl w-12 h-12 rounded ml-2 font-bold"
              :class="{
                'blur-md bg-transparent': hidePredictions && !hasStarted,
              }"
            />
            <span
              v-if="hasStarted"
              class="text-2xl rounded font-thin mr-2 ml-4"
              :class="{
                'text-red-300':
                  fixture.score?.fullTime?.home != homeScore,
                'text-green-300':
                  fixture.score?.fullTime?.home == homeScore,
              }"
              >{{ fixture.score?.fullTime?.home }}</span
            >
          </div>
          <span class="mx-4 font-thin text-4xl text-[#6a6a6a]">v</span>
          <div class="flex flex-row text-center justify-center items-center">
            <span
              v-if="hasStarted"
              class="text-2xl rounded font-thin ml-2 mr-4"
              :class="{
                'text-green-300':
                  fixture.score?.fullTime?.away == awayScore,
                'text-red-300':
                  fixture.score?.fullTime?.away != awayScore,
              }"
              >{{ fixture.score?.fullTime?.away }}</span
            >
            <input
              v-model="awayScore"
              :disabled="disabled"
              type="number"
              min="0"
              max="9"
              class="text-center text-2xl w-12 h-12 mr-2 rounded font-bold"
              :class="{
                'blur-md bg-transparent': hidePredictions && !hasStarted,
              }"
            />
          </div>
        </div>
      </div>
      <div
        class="flex-1 flex items-center truncate my-1 lg:text-xl md:font-lighgt"
        :class="{ 'justify-between': !hideCrests, 'justify-start': hideCrests }"
      >
        <span class="hidden md:inline truncate">{{
          fixture.awayTeam.name
        }}</span
        ><span class="md:hidden truncate">{{
          fixture.awayTeam.shortName
        }}</span>
        <img
          v-if="!hideCrests"
          :alt="fixture.awayTeam.name"
          :src="fixture.awayTeam.crest || '/blank.png'"
          class="w-10 h-10 sm:w-14 sm:h-14 ml-2 lg:ml-4"
        />
      </div>
    </div>
  </div>
</template>

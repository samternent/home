<script setup>
import { shallowRef, computed, watch } from "vue";
import { DateTime } from "luxon";

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

const homeScore = shallowRef(props.prediction?.homeScore || 0);
const awayScore = shallowRef(props.prediction?.awayScore || 0);

watch(
  [homeScore, awayScore],
  ([_homeScore, _awayScore]) => {
    emit("update:prediction", { homeScore: _homeScore, awayScore: _awayScore });
  },
  { immediate: true }
);
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
      'text-2xl': size === 'lg',
      'text-base ': size === 'md',
    }"
  >
    <span v-if="showDate" class="w-full py-4 font-medium">{{ kickOff }}</span>
    <div
      class="flex flex-1 w-full px-2 justify-between items-center truncate text-sm sm:text-base bg-[#1e1e1e] hover:bg-[#232323] p-4 rounded"
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
        <span class="hidden md:inline">{{ fixture.homeTeam.name }}</span
        ><span class="md:hidden">{{ fixture.homeTeam.shortName }}</span>
      </div>
      <input
        :disabled="disabled"
        v-model="homeScore"
        type="number"
        min="0"
        max="9"
        class="text-center text-2xl w-12 h-12 ml-4 rounded font-bold"
      />
      <span class="mx-6 font-thin text-4xl text-[#6a6a6a]">v</span>
      <input
        v-model="awayScore"
        :disabled="disabled"
        type="number"
        min="0"
        max="9"
        class="text-center text-2xl w-12 h-12 mr-4 rounded font-bold"
      />
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
    <div
      class="text-xs hidden text-[#aeaeae] font-medium md:inline"
      v-if="size !== 'sm' && fixture.referees.length"
    >
      Referee:
      <span v-for="(referee, i) in fixture.referees" :key="referee.id">
        {{ referee.name }}<span v-if="i < fixture.referees.length - 1">, </span>
      </span>
    </div>
  </div>
</template>
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
    class="flex flex-col relative py-0 bg-[#1e1e1e] hover:bg-[#232323] transition-all font-light items-center w-full border-x-[transparent] border-transparent border-x-4"
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
    <span
      class="text-xs w-full px-4 py-1 text-[#d3d3d3] bg-[#232323] font-medium uppercase text-center"
      >{{ kickOff }}</span
    >
    <div
      class="flex flex-1 w-full px-2 justify-between items-center truncate text-sm sm:text-base"
    >
      <div
        class="flex-1 flex items-center truncate"
        :class="{ 'justify-between': !hideCrests, 'justify-end': hideCrests }"
      >
        <img
          v-if="!hideCrests"
          :alt="fixture.homeTeam.name"
          :src="fixture.homeTeam.crest || '/blank.png'"
          class="w-10 h-10 sm:w-14 sm:h-14 mr-2 lg:mr-4"
        />
        <RouterLink
          v-if="fixture.homeTeam.id"
          @click.stop
          class="league-link text-[#e3e3e3] font-medium text-right truncate"
          :to="`/leagues/${fixture.competition.code}/teams/${fixture.homeTeam.id}`"
        >
          <span class="hidden md:inline">{{ fixture.homeTeam.name }}</span
          ><span class="md:hidden">{{ fixture.homeTeam.shortName }}</span>
        </RouterLink>
        <div
          v-else
          class="league-link text-[#e3e3e3] font-medium text-right truncate"
        >
          TBD
        </div>
      </div>
      <input
        v-model="homeScore"
        type="number"
        min="0"
        max="9"
        class="text-center text-2xl w-12 h-12 ml-4"
      />
      <span class="mx-6 font-thin text-4xl text-[#6a6a6a]">v</span>
      <input
        v-model="awayScore"
        type="number"
        min="0"
        max="9"
        class="text-center text-2xl w-12 h-12 mr-4"
      />
      <div
        class="flex-1 flex items-center truncate my-1"
        :class="{ 'justify-between': !hideCrests, 'justify-start': hideCrests }"
      >
        <RouterLink
          v-if="fixture.awayTeam.id"
          @click.stop
          class="league-link text-[#e3e3e3] font-medium text-right truncate"
          :to="`/leagues/${fixture.competition.code}/teams/${fixture.awayTeam.id}`"
        >
          <span class="hidden md:inline truncate">{{
            fixture.awayTeam.name
          }}</span
          ><span class="md:hidden truncate">{{
            fixture.awayTeam.shortName
          }}</span>
        </RouterLink>
        <div
          v-else
          class="league-link text-[#e3e3e3] font-medium text-right truncate"
        >
          TBD
        </div>
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

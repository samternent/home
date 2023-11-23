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
});

defineEmits(["click"]);

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

const selected = shallowRef(false);
const comment = shallowRef("");
</script>
<template>
  <div
    class="flex flex-col relative p-2 transition-all font-light items-center w-full border-x-[transparent] border-transparent border-x-4"
    :class="{
      'border-l-4': fixture.score?.winner?.includes('HOME_TEAM'),
      'border-r-4': fixture.score?.winner?.includes('AWAY_TEAM'),
      'border-l-4': fixture.score?.winner?.includes('AWAY_TEAM'),
      'border-r-4': fixture.score?.winner?.includes('HOME_TEAM'),
      'text-2xl': size === 'lg',
      'text-base ': size === 'md',
      'text-sm ': size === 'sm',
    }"
    @click="$emit('click', fixture)"
  >
    <span
      v-if="fixture.status === 'IN_PLAY'"
      class="absolute left-0 text-xs px-4 m-1 rounded-full"
      >In play</span
    >
    <span
      v-if="fixture.status === 'POSTPONED'"
      class="absolute left-0 text-xs px-4 m-1 rounded-full"
      >POSTPONED</span
    >
    <span class="text-xs w-full px-4 py-1 font-medium uppercase text-center">{{
      kickOff
    }}</span>
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
          class="league-link font-medium text-right truncate"
          :to="`/leagues/${fixture.competition.code}/teams/${fixture.homeTeam.id}`"
        >
          <span class="hidden md:inline">{{ fixture.homeTeam.name }}</span
          ><span class="md:hidden">{{ fixture.homeTeam.shortName }}</span>
        </RouterLink>
        <div v-else class="league-link font-medium text-right truncate">
          TBD
        </div>
      </div>
      <span class="mx-6 font-thin text-4xl" v-if="!fixture.score?.winner"
        >v</span
      >
      <div
        class="flex items-center font-medium text-2xl justify-between my-2"
        v-else
      >
        <span class="flex-1 p-2 ml-2">{{ fixture.score.fullTime.home }}</span>
        -
        <span class="flex-1 p-2 mr-2">{{ fixture.score.fullTime.away }}</span>
      </div>
      <div
        class="flex-1 flex items-center truncate my-1"
        :class="{ 'justify-between': !hideCrests, 'justify-start': hideCrests }"
      >
        <RouterLink
          v-if="fixture.awayTeam.id"
          @click.stop
          class="league-link font-medium text-right truncate"
          :to="`/leagues/${fixture.competition.code}/teams/${fixture.awayTeam.id}`"
        >
          <span class="hidden md:inline truncate">{{
            fixture.awayTeam.name
          }}</span
          ><span class="md:hidden truncate">{{
            fixture.awayTeam.shortName
          }}</span>
        </RouterLink>
        <div v-else class="league-link font-medium text-right truncate">
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
      class="text-xs hidden font-medium md:inline"
      v-if="size !== 'sm' && fixture.referees.length"
    >
      Referee:
      <span v-for="(referee, i) in fixture.referees" :key="referee.id">
        {{ referee.name }}<span v-if="i < fixture.referees.length - 1">, </span>
      </span>
    </div>
  </div>
</template>

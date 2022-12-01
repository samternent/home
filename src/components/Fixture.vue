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
    class="flex flex-col relative py-0 bg-[#1e1e1e] hover:bg-[#232323] transition-all font-light items-center w-full border-x-[transparent] border-transparent border-x-4"
    :class="{
      'bg-yellow-100 hover:bg-yellow-200': selected,
      'border-l-4 border-l-green-900':
        fixture.score.winner?.includes('HOME_TEAM'),
      'border-r-4 border-r-green-900':
        fixture.score.winner?.includes('AWAY_TEAM'),
      'border-l-4 border-l-red-900':
        fixture.score.winner?.includes('AWAY_TEAM'),
      'border-r-4 border-r-red-900':
        fixture.score.winner?.includes('HOME_TEAM'),
      'text-2xl': size === 'lg',
      'text-base ': size === 'md',
    }"
    @click="$emit('click', fixture)"
  >
    <span
      v-if="fixture.status === 'IN_PLAY'"
      class="absolute left-0 text-xs px-4 m-1 bg-green-600 rounded-full text-white"
      >In play</span
    >
    <span
      v-if="fixture.status === 'POSTPONED'"
      class="absolute left-0 text-xs px-4 m-1 bg-red-800 rounded-full text-white"
      >POSTPONED</span
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
          :src="fixture.homeTeam.crest || '/public/blank.png'"
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
      <span
        class="mx-6 font-thin text-4xl text-[#6a6a6a]"
        v-if="!fixture.score.winner"
        >v</span
      >
      <div
        class="flex items-center font-medium text-[#6a6a6a] text-2xl justify-between my-2"
        v-else
      >
        <span class="flex-1 p-2 text-white ml-2">{{
          fixture.score.fullTime.home
        }}</span>
        -
        <span class="flex-1 p-2 text-white mr-2">{{
          fixture.score.fullTime.away
        }}</span>
      </div>
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
          :src="fixture.awayTeam.crest || '/public/blank.png'"
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
  <div
    v-if="selected"
    class="relative bg-gray-100 flex flex-col min-h-52 shadow-inner p-2"
  >
    <div class="text-lg p-2 flex w-full justify-end">
      <span class="mx-1">👍 <span class="text-xs text-gray-400">0</span></span>
      <span class="mx-1">❤️ <span class="text-xs text-gray-400">0</span></span>
      <span class="mx-1">😂 <span class="text-xs text-gray-400">0</span></span>
      <span class="mx-1">😯 <span class="text-xs text-gray-400">0</span></span>
      <span class="mx-1">😢 <span class="text-xs text-gray-400">0</span></span>
      <span class="mx-1">😡 <span class="text-xs text-gray-400">0</span></span>
    </div>
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="bg-blue-50 border text-gray-700 p-2 rounded mb-1 text-xs"
    >
      {{ comment.comment }}
    </div>
    <textarea
      v-model="comment"
      class="bg-white rounded-lg p-2 block my-2 h-32 resize-none text-sm md:text-base font-light"
      placeholder="Comment"
    />
    <div class="p-2 flex justify-between items-center">
      <span class="text-xs text-blue-500"
        >@{{ fixture.homeTeam.name.replace(/ /g, "") }} @{{
          fixture.awayTeam.name.replace(/ /g, "")
        }}
        #match</span
      >
      <button
        aria-label="Post"
        @click="addComment"
        class="bg-green-500 px-4 py-1 rounded text-white"
      >
        Post
      </button>
    </div>
    <div></div>
  </div>
</template>

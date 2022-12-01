<script setup>
import { toRefs, computed, shallowRef, watch } from "vue";
import useFixturesLoader from "../api/football-data/useCompetitionFixturesLoader";
import Fixture from "./Fixture.vue";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  currentGameweek: {
    type: Number,
    required: true,
  },
  currentStage: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: "md",
  },
});

const { competitionCode, currentGameweek, currentStage } = toRefs(props);
const overrideGameweek = shallowRef();
const gameweek = computed(
  () => overrideGameweek.value || currentGameweek.value
);

const {
  items: fixtures,
  loading: fixturesLoading,
  loaded: fixturesLoaded,
} = useFixturesLoader(competitionCode, currentStage, gameweek);

const hasFixtures = computed(
  () => !fixturesLoading.value && fixturesLoaded.value
);
const fixturesResults = computed(
  () => fixtures.value?.FINISHED.reverse() || []
);

function setGameweek(_gameweek) {
  overrideGameweek.value = _gameweek;
}
</script>
<template>
  <div>
    <div
      class="flex items-center justify-center w-full bg-indigo-900 h-10 text-sm md:text-base font-medium mb-2"
    >
      <button
        @click="setGameweek(gameweek - 1)"
        :disabled="gameweek <= 1"
        :aria-label="`Gameweek ${gameweek - 1}`"
      >
        <svg
          class="w-4 h-4 md:w-5 md:h-5 fill-white"
          stroke="currentColor"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M640 0l-512 512 512 512 192-192-320-320 320-320-192-192z" />
        </svg>
      </button>
      <h2 class="px-2 mx-6 font-bold uppercase text-center text-white">
        Gameweek {{ gameweek }}
      </h2>
      <button
        @click="setGameweek(gameweek + 1)"
        :aria-label="`Gameweek ${gameweek + 1}`"
      >
        <svg
          class="w-4 h-4 md:w-5 md:h-5 fill-white"
          stroke="currentColor"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M320 0l-192 192 320 320-320 320 192 192 512-512-512-512z" />
        </svg>
      </button>
    </div>
    <div class="w-full">
      <Transition>
        <div v-if="hasFixtures">
          <div v-for="fixture in fixtures" :key="fixture.id" class="py-3">
            <Fixture
              :fixture="fixture"
              :size="size"
              @click="(fixture) => $emit('selected', fixture)"
            />
          </div>
        </div>
        <div v-else class="w-full pr-4">
          <div
            v-for="i in 10"
            :key="i"
            class="bg-[#3c3c3c] animate-pulse m-2 rounded flex-1 h-24 w-full"
          />
        </div>
      </Transition>
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

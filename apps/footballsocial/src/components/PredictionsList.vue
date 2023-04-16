<script setup>
import { toRefs, computed, shallowRef, reactive, unref, onMounted } from "vue";
import useFixturesLoader from "../api/football-data/useCompetitionFixturesLoader";
import {
  addPrediction,
  getPredictions,
} from "../composables/usePredictionService";
import { useCurrentUser } from "../composables/useCurrentUser";
import Predictor from "./Predictor.vue";

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
});

const { competitionCode, currentGameweek, stage } = toRefs(props);
const overrideGameweek = shallowRef();
const gameweek = computed(
  () => overrideGameweek.value || currentGameweek.value
);

const {
  items: fixtures,
  meta,
  loading: fixturesLoading,
  loaded: fixturesLoaded,
} = useFixturesLoader(competitionCode, stage, gameweek);

const hasFixtures = computed(
  () => !fixturesLoading.value && fixturesLoaded.value
);
const fixturesResults = computed(
  () => fixtures.value?.FINISHED.reverse() || []
);

function setGameweek(_gameweek) {
  overrideGameweek.value = _gameweek;
}

const hasGameweekStarted = computed(() => {
  console.log(meta.value.played);
  meta.value.played > 0;
});

const predictions = reactive({});
const predictionsLoaded = shallowRef(false);
const lockedPredictions = shallowRef([]);
onMounted(async () => {
  // if (!profile.value?.username) {
  //   return;
  // }
  const { data } = await getPredictions(
    profile.value?.username,
    unref(competitionCode),
    unref(gameweek)
  );

  data.forEach((prediction) => {
    lockedPredictions.value.push(prediction.fixtureId);

    predictions[prediction.fixtureId] = {
      homeScore: prediction.homeScore,
      awayScore: prediction.awayScore,
    };
  });

  predictionsLoaded.value = true;
});

const { profile } = useCurrentUser();

function savePredictions() {
  addPrediction(
    profile.value.username,
    unref(predictions),
    unref(competitionCode),
    unref(gameweek)
  );
}
</script>
<template>
  <div>
    <div
      v-if="currentGameweek"
      class="flex items-center justify-center w-full bg-indigo-900 h-10 text-sm md:text-base font-medium mb-2"
    >
      <button
        @click="setGameweek(gameweek - 1)"
        :disabled="gameweek <= 1"
        :aria-label="`Gameweek ${gameweek - 1}`"
        class="disabled:opacity-20"
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
        :disabled="Number(gameweek) >= Number(currentGameweek)"
        @click="setGameweek(gameweek + 1)"
        :aria-label="`Gameweek ${gameweek + 1}`"
        class="disabled:opacity-20"
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
    <div class="w-full" v-if="predictionsLoaded">
      <div v-if="lockedPredictions.length">Your predictions are in!</div>
      <button v-if="meta.played === 0" @click="savePredictions">
        Save Predictions
      </button>
      <Transition>
        <div v-if="hasFixtures">
          <div v-for="fixture in fixtures" :key="fixture.id" class="py-3">
            <Predictor
              :fixture="fixture"
              :size="size"
              :disabled="meta.played > 0"
              v-model:prediction="predictions[fixture.id]"
              @click="(fixture) => $emit('selected', fixture)"
            />
          </div>
        </div>
        <div v-else class="w-full pr-4 pt-1">
          <div
            v-for="i in 10"
            :key="i"
            class="bg-[#1e1e1e] animate-pulse m-2 my-4 rounded flex-1 h-20 w-full"
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

<script setup>
import {
  toRefs,
  computed,
  shallowRef,
  reactive,
  unref,
  onMounted,
  watch,
} from "vue";
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
  username: {
    type: String,
    default: null,
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
const predictions = shallowRef({});
const serverPredictions = shallowRef(null);
const predictionsLoaded = shallowRef(false);
const lockedPredictions = shallowRef([]);

async function loadPredictions() {
  const { data } = await getPredictions(
    props.username || profile.value?.username,
    unref(competitionCode),
    unref(gameweek)
  );

  lockedPredictions.value = [];
  predictions.value = {};

  data.predictions?.forEach((prediction) => {
    lockedPredictions.value = [
      ...lockedPredictions.value,
      prediction.fixtureId
    ];

    predictions.value = {
      ...predictions.value,
      [prediction.fixtureId]: {
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
      },
    };

    serverPredictions.value = JSON.stringify(predictions.value);
  });

  predictionsLoaded.value = true;
}

const { profile } = useCurrentUser();

async function savePredictions() {
  await addPrediction(
    profile.value.username,
    unref(predictions),
    unref(competitionCode),
    unref(gameweek)
  );
  loadPredictions();
}

function updatePrediction(prediction, fixture) {
  predictions.value = {
    ...predictions.value,
    [fixture.id]: prediction,
  };
}

const isDirty = computed(
  () => serverPredictions.value !== JSON.stringify(predictions.value)
);

watch(
  competitionCode,
  loadPredictions,
  { immediate: true }
);

const predictionsList = computed(() =>
  fixtures.value.map((fixture) => ({
    ...fixture,
    prediction: predictions.value[fixture.id],
  })) || []
);
</script>
<template>
  <div>
    <div class="w-full" v-if="predictionsLoaded">
      <div class="text-center my-0 flex flex-col">
        <span
          class="text-xl p-2 font-thin my-4 bg-indigo-500 rounded-full bg-opacity-30"
          v-if="Object.keys(predictions).length"
          >{{ username ? `${username}s` : "Your" }} predictions are in!</span
        >
      </div>
      <div v-for="(fixture, i) in predictionsList" :key="fixture.id" class="">
        <Predictor
          :fixture="fixture"
          :size="size"
          :disabled="
            new Date(fixture.utcDate).getTime() < new Date().getTime() ||
            ['IN_PLAY', 'FINISHED'].includes(fixture.status) ||
            (username && profile?.username !== username) ||
            false
          "
          :showDate="fixture.utcDate !== fixtures[i - 1]?.utcDate"
          :prediction="fixture.prediction"
          @update:prediction="
            (prediction) => updatePrediction(prediction, fixture)
          "
          @click="(fixture) => $emit('selected', fixture)"
        />
      </div>
      <div class="text-center mt-6 flex flex-col">
        <button
          :disabled="!isDirty"
          v-if="profile && (!username || profile.username === username)"
          @click="savePredictions"
          class="bg-green-600 disabled:opacity-20 rounded p-2 my-2"
        >
          Save Predictions
        </button>
      </div>
    </div>

    <div v-else class="w-full pr-4 pt-1">
      <div
        v-for="i in 10"
        :key="i"
        class="bg-[#1e1e1e] animate-pulse m-2 my-4 rounded flex-1 h-20 w-full"
      />
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

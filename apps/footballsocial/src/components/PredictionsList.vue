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
const predictions = reactive({});
const serverPredictions = shallowRef(null);
const predictionsLoaded = shallowRef(false);
const lockedPredictions = shallowRef([]);
onMounted(async () => {
  const { data } = await getPredictions(
    props.username || profile.value?.username,
    unref(competitionCode),
    unref(gameweek)
  );

  data.forEach((prediction) => {
    lockedPredictions.value.push(prediction.fixtureId);

    predictions[prediction.fixtureId] = {
      homeScore: prediction.homeScore,
      awayScore: prediction.awayScore,
    };

    serverPredictions.value = JSON.stringify(unref(predictions));
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

const isDirty = computed(
  () => serverPredictions.value !== JSON.stringify(unref(predictions))
);
</script>
<template>
  <div>
    <div class="w-full" v-if="predictionsLoaded">
      <div
        v-if="lockedPredictions.length"
        class="text-3xl text-center my-6 font-bold"
      >
        {{ username ? `${username}s` : "Your" }} predictions are in!
      </div>
      <button
        :disabled="!isDirty"
        v-if="meta.played === 0 && profile"
        @click="savePredictions"
        class="bg-green-600 disabled:opacity-20 rounded p-2 my-2"
      >
        Save Predictions
      </button>
      <Transition>
        <div v-if="hasFixtures">
          <div v-for="(fixture, i) in fixtures" :key="fixture.id" class="py-3">
            <Predictor
              :fixture="fixture"
              :size="size"
              :disabled="meta.played > 0"
              :showDate="fixture.utcDate !== fixtures[i - 1]?.utcDate"
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

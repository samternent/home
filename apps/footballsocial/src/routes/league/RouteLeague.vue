<script setup>
import { toRefs, watch, computed, shallowRef, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  useTitle,
  useLocalStorage,
  useColorMode,
  onClickOutside,
} from "@vueuse/core";
import { provideCompetitionLoader } from "../../api/football-data/useCompetitionLoader";
import { usePredictionService } from "../../composables/usePredictionService";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { competitions } from "../../utils/competitions";
import FSLogo from "../../module/brand/FSLogo.vue";
import { SHeader } from "ternent-ui/components";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },
  gameweek: {
    type: Number,
    default: null,
  },
  season: {
    type: String,
    default: null,
  },
});

const { competitionCode } = toRefs(props);
const title = useTitle();
const colorMode = useColorMode();
const { profile } = useCurrentUser();
const router = useRouter();

const players = shallowRef(0);
const predictionsCount = shallowRef(0);
const table = shallowRef([]);

onMounted(async () => {
  const { data } = await fetchLandingStats();
  players.value = data?.users;
  predictionsCount.value = data?.predictions;
  table.value = data?.table;
});

const {
  items: competition,
  error,
  loading,
} = provideCompetitionLoader(competitionCode);
const { fetchLandingStats } = usePredictionService();

const lastLeague = useLocalStorage("lastLeague", "PL");

watch(
  competition,
  (_competition) => {
    if (_competition?.name) {
      title.value = `${_competition?.name} - Football Social`;
    }
    if (_competition?.code) {
      lastLeague.value = _competition?.code;
    }
  },
  { immediate: true }
);

const lookups = {
  arsenal: 1,
  astonvilla: 1,
  afcbournemouth: 1,
  brighton: 1,
  brentford: 1,
  burnley: 1,
  chelsea: 1,
  crystalpalace: 1,
  everton: 1,
  fulham: 1,
  liverpoolfc: 1,
  luton: 1,
  mancity: 65,
  manutd: 1,
  newcastle: 1,
  nottmforest: 351,
  sheffieldutd: 1,
  spurs: 1,
  wolves: 1,
  westham: 1,
  birmingham: 332,
};
const clubBadgeId = computed(() => {
  return lookups[profile.value?.club];
});

const currentCompetition = computed({
  get() {
    return competitionCode.value;
  },
  set(value) {
    router.push(`/leagues/${value}`);
    editCompetition.value = false;
  },
});
const editCompetition = shallowRef(false);
const editCompetitionTarget = shallowRef(null);

onClickOutside(editCompetitionTarget, () => (editCompetition.value = false));
</script>
<template>
  <div class="md:px-2 lg:px-4 flex-1 max-w-4xl mx-auto pt-0 w-full h-screen">
    <SHeader>
      <div
        class="px-1 p-2 font-thin rounded-lg flex-1 flex flex-col justify-center"
      >
        <FSLogo class="lg:hidden flex" />
        <div class="flex flex-col lg:flex-row justify-between">
          <div
            class="flex items-center"
            :class="{
              'items-center': !editCompetition,
              'items-start': editCompetition,
            }"
          >
            <!-- ads -->
            <div
              class="tracking-tightest font-thin flex lg:flex-col items-end lg:items-start group cursor-pointer pt-2 px-2"
              v-if="competition && !editCompetition"
              @click="editCompetition = true"
            >
              <p class="md:text-2xl lg:text-3xl mt-0">
                {{ competition?.name }},
              </p>
              <p
                class="px-2 py-1 mx-2 lg:mx-0 lg:my-2 md:text-2xl lg:text-3xl transition-color inline-block font-bold bg-base-content group-hover:bg-primary tracking-tighter header text-base-100"
              >
                {{ competition?.area?.name }}.
              </p>
              <p
                class="text-lg font-thin lg:my-2 tracking-tighter flex items-center"
              >
                2023/24

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-4 h-4 mx-2 inline group-hover:inline opacity-40"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                  />
                </svg>
              </p>
            </div>
            <div v-else-if="competition" class="-mx-2">
              <select
                ref="editCompetitionTarget"
                autofocus
                v-model="currentCompetition"
                class="block border-0 text-xl focus:ring-0 p-2"
              >
                <option
                  v-for="gw in competitions"
                  :key="`startWeek${gw}`"
                  :value="gw.code"
                >
                  {{ gw.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="flex flex-col">
            <FSLogo class="hidden lg:flex" />
            <div
              class="flex justify-end font-thin tracking-tighter border-t py-2"
            >
              <!-- Prediction league. -->
            </div>
          </div>
        </div>
      </div>
    </SHeader>

    <RouterView
      v-if="!loading"
      :competitionCode="competitionCode"
      :key="competitionCode"
    />
    <div v-else class="h-screen flex justify-center items-center">
      <div
        class="absolute right-1/2 bottom-1/2 transform translate-x-1/2 translate-y-1/2"
      >
        <div
          class="p-4 bg-gradient-to-tr animate-spin from-[#ff5757] to-[#8c52ff] rounded-full"
        >
          <div class="bg-base-100 rounded-full">
            <div class="w-24 h-24 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="error"
      class="absolute min-h-screen flex-1 h-screen mx-auto max-w-6xl w-full"
    >
      <h1 class="text-4xl font-bold">{{ error.message }}</h1>
      <p>Sorry, we messed up.</p>
      <p>{{ error.config.baseURL }}</p>
      <p>{{ error.config.method }}</p>
      <p>{{ error.config.url }}</p>
    </div>
    <p class="text-2xl font-thin my-12 text-center">
      With
      <span
        v-if="predictionsCount"
        class="text-3xl bg-base-content text-base-100 px-2 anton-regular"
        >{{ predictionsCount.toLocaleString() }}
      </span>
      <span v-else class="skeleton inline-block h-6 w-10 mx-1" />
      predictions, from
      <span
        v-if="players"
        class="text-3xl bg-base-content text-base-100 px-2 anton-regular"
      >
        {{ players }}
      </span>
      <span v-else class="skeleton inline-block h-6 w-8 mx-1" />
      players, across
      <span class="text-3xl bg-base-content text-base-100 px-2 anton-regular"
        >8</span
      >
      competitions.
    </p>
  </div>
</template>

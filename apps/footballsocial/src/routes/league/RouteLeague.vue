<script setup>
import { toRefs, watch, computed, shallowRef, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { DateTime } from "luxon";
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
import { SHeader, STabs } from "ternent-ui/components";

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
const route = useRoute();

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

function formatYearRange(dateStr1, dateStr2) {
  // Parse the dates from ISO format
  const date1 = DateTime.fromISO(dateStr1);
  const date2 = DateTime.fromISO(dateStr2);

  // Extract the years
  const year1 = date1.year;
  const year2 = date2.year;

  // Check if the years are the same
  if (year1 === year2) {
    // Return the year if both dates are in the same year
    return year1.toString();
  } else {
    // Return the formatted string 'YYYY/YY' if different
    // Assuming year1 is always less than or equal to year2
    const shortYear2 = year2.toString().slice(-2); // get last two digits
    return `${year1}/${shortYear2}`;
  }
}

const currentSeasonFormat = shallowRef();
watch(
  competition,
  (_competition) => {
    if (_competition) {
      title.value = `${_competition?.name} - Football Social`;
      lastLeague.value = _competition?.code;
      currentSeasonFormat.value = formatYearRange(
        _competition.currentSeason.startDate,
        _competition.currentSeason.endDate
      );
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

const tabs = computed(() => [
  {
    title: "Predictions",
    path: `/leagues/${competitionCode.value}/predictions`,
  },
  { title: "Tables", path: `/leagues/${competitionCode.value}/table` },
  // { title: "Leagues", path: `/leagues/${competitionCode.value}/leagues` },
]);

watch(
  competition,
  (_competition) => {
    if (_competition?.name) {
      title.value = `${_competition.name} - Football Social`;
    }
  },
  { immediate: true }
);

const dismissEurosBanner = useLocalStorage(
  "footballsocial/dissmissEurosBanner",
  false
);
</script>
<template>
  <div class="md:px-2 lg:px-4 flex-1 max-w-4xl mx-auto pt-0 w-full h-screen">
    <SHeader>
      <div
        class="px-1 p-2 font-light rounded-lg flex-1 flex flex-col justify-center"
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
              class="tracking-tightest font-light flex lg:flex-col items-end lg:items-start group cursor-pointer pt-2 px-2"
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
                class="text-lg font-light lg:my-2 tracking-tighter flex items-center"
              >
                {{ currentSeasonFormat }}

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
            <div v-else-if="competition" class="-mx-3">
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
              class="flex justify-end font-light tracking-tighter border-t py-2"
            >
              <!-- Prediction league. -->
            </div>
          </div>
        </div>
      </div>
    </SHeader>

    <div
      v-if="!dismissEurosBanner && competitionCode !== 'EC'"
      class="bg-base-content text-base-100 w-full mb-8 p-8 flex flex-col relative border-t-2 border-primary"
    >
      <div
        @click="dismissEurosBanner = true"
        class="cursor-pointer absolute right-2 top-2 opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div class="justify-between flex flex-col lg:flex-row items-bottom">
        <p class="text-xl font-light p-b flex-1">
          The
          <span class="transition-all font-bold tracking-tighter">
            European Championships</span
          >
          are coming!
        </p>

        <div
          class="w-full lg:w-64 px-4 flex justify-center items-center my-4 lg:my-0"
        >
          <RouterLink
            to="/leagues/EC/predictions"
            class="btn btn-success w-full"
            >Place Euros predictions</RouterLink
          >
        </div>
      </div>
      <p class="text-sm font-light tracing-tight">
        TIP: You can change competition at any time by clicking the league name
        in the header.
      </p>
    </div>
    <STabs :items="tabs" :path="route.path" />
    <div class="flex mb-16 w-full mt-4">
      <RouterView
        v-if="!loading"
        :competitionCode="competitionCode"
        :key="competitionCode"
      />
      <div v-else class="flex justify-center items-center w-full">
        <div
          class="p-4 bg-gradient-to-tr animate-spin from-[#ff5757] to-[#8c52ff] rounded-full my-32"
        >
          <div class="bg-base-100 rounded-full">
            <div class="w-24 h-24 rounded-full"></div>
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
    </div>
    <p class="text-2xl font-light my-12 text-center">
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

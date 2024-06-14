<script setup>
import { toRefs, watch, computed, shallowRef, onMounted } from "vue";
import { useRoute } from "vue-router";
import { DateTime } from "luxon";
import { confetti } from "@tsparticles/confetti";
import {
  useTitle,
  useLocalStorage,
  useColorMode,
  onClickOutside,
} from "@vueuse/core";
import { SHeader, STabs, SButton } from "ternent-ui/components";
import { provideCompetitionLoader } from "@/module/football-data/useCompetitionLoader";
import { usePredictionService } from "@/module/predict/usePredictionService";
import { useCurrentUser } from "@/module/auth/useCurrentUser";
import { competitions } from "@/utils/competitions";
import FSLogo from "@/module/brand/FSLogo.vue";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import { supabaseClient } from "@/service/supabase";

const props = defineProps({
  competitionCode: {
    type: String,
    required: true,
  },

  season: {
    type: String,
    default: null,
  },
});

const { competitionCode } = toRefs(props);
const title = useTitle();
const { profile } = useCurrentUser();
const { isWhiteLabel, host } = useWhiteLabel();
const route = useRoute();

const players = shallowRef(0);
const predictionsCount = shallowRef(0);
const table = shallowRef([]);
const winnerCanvas = shallowRef();

let interval;

async function createConfetti() {
  if (!winnerCanvas.value) {
    return;
  }

  clearInterval(interval);
  // you should  only initialize a canvas once, so save this function
  // we'll save it to the canvas itself for the purpose of this demo
  winnerCanvas.value.confetti =
    winnerCanvas.value.confetti ||
    (await confetti.create(winnerCanvas.value, { resize: true }));

  const duration = 60 * 1000,
    animationEnd = Date.now() + duration,
    defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 5 * (timeLeft / duration);

    // since particles fall down, start a bit higher than random
    winnerCanvas.value?.confetti?.(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
    );
    winnerCanvas.value?.confetti?.(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    );
  }, 250);
}
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
const { fetchLandingStats, fetchPredictionTable } = usePredictionService();

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
const editCompetition = shallowRef(false);
const editCompetitionTarget = shallowRef(null);

onClickOutside(editCompetitionTarget, () => (editCompetition.value = false));

const tabs = computed(() => [
  {
    title: "Predictions",
    path: `/l/${competitionCode.value}/predictions`,
  },
  { title: "Tables", path: `/l/${competitionCode.value}/table` },
]);
const topThree = shallowRef([]);
watch(
  competition,
  async (_competition) => {
    if (_competition) {
      title.value = `${_competition?.name} - Football Social`;
      topThree.value = [];

      const {
        data: { table },
      } = await fetchPredictionTable(
        _competition.code,
        null,
        isWhiteLabel.value ? host.value : null
      );

      topThree.value = table.slice(0, 3);
      lastLeague.value = _competition?.code;
      currentSeasonFormat.value = formatYearRange(
        _competition.currentSeason.startDate,
        _competition.currentSeason.endDate
      );
    }
  },
  { immediate: true }
);

watch(winnerCanvas, createConfetti, { immediate: true });

const showMenu = shallowRef(false);
const dropdownRef = shallowRef(null);

onClickOutside(dropdownRef, () => {
  showMenu.value = false;
});

const dismissEurosBanner = useLocalStorage(
  "footballsocial/dissmissEurosBanner",
  false
);

const hasSeasonFinished = computed(
  () =>
    competition.value?.currentSeason?.endDate &&
    DateTime.now().startOf("day") >=
      DateTime.fromISO(competition.value.currentSeason.endDate).startOf("day")
);

const league = shallowRef(null);
const canJoinLeague = shallowRef(false);

watch(
  [isWhiteLabel, host, profile],
  async () => {
    if (!isWhiteLabel.value || !host.value || !profile.value) return;

    const { data, error } = await supabaseClient
      .from("leagues")
      .select()
      .eq("league_code", host.value);

    if (!data.length || error) {
      canJoinLeague.value = false;
      league.value = null;

      return;
    }

    const { data: membersData } = await supabaseClient
      .from("league_members")
      .select()
      .eq("league_id", data[0].id)
      .eq("username", profile.value.username);

    league.value = data[0];
    canJoinLeague.value = !membersData.length;
  },
  { immediate: true }
);

async function joinLeague() {
  if (!league.value) return;

  const { error } = await supabaseClient.from("league_members").upsert([
    {
      league_id: league.value.id,
      username: profile.value.username,
    },
  ]);

  window.location.reload();
}
const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const seasonEnds = computed(
  () =>
    `${
      weekdays[
        DateTime.fromISO(competition.value?.currentSeason.endDate).weekday - 1
      ]
    }, ${DateTime.fromISO(
      competition.value?.currentSeason.endDate
    ).toLocaleString(DateTime.DATE_MED)}`
);
</script>
<template>
  <div
    class="md:px-2 lg:px-4 flex-1 max-w-4xl mx-auto pt-0 w-full min-h-screen"
  >
    <SHeader>
      <div
        class="px-1 p-2 font-light rounded-lg flex-1 flex flex-col justify-between"
      >
        <div
          v-if="isWhiteLabel && profile?.username && canJoinLeague"
          class="alert rounded-none flex justify-between max-w-4xl w-full my-3"
        >
          <span>You are not part of this community.</span>
          <div class="sticky top-0">
            <SButton type="secondary" class="btn" @click="joinLeague">
              Join
            </SButton>
          </div>
        </div>
        <FSLogo />
        <!-- ads -->
        <div
          class="flex flex-row lg:flex-row justify-start items-center lg:items-end w-full mb-4"
        >
          <div
            class="tracking-tightest font-light flex items-end lg:items-center group w-full"
          >
            <p v-if="competition?.name" class="text-lg md:text-2xl mt-0 ml-2">
              {{ competition?.name }}
              <span
                v-if="competition?.area?.name"
                class="px-2 py-1 mx-2 lg:my-2 hidden md:inline-block md:text-2xl lg:text-3xl transition-color font-bold bg-primary tracking-tighter header text-primary-content border-b-2 border-secondary"
              >
                {{ competition?.area?.name }}.
              </span>
            </p>
          </div>
          <div
            class="relative flex justify-end items-center w-full"
            ref="dropdownRef"
          >
            <SButton
              type="ghost"
              @click="showMenu = !showMenu"
              class="btn-sm uppercase lg:my-2 flex items-center justify-end w-44 font-light"
            >
              Change league

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4 ml-2 inline group-hover:inline opacity-40"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                />
              </svg>
            </SButton>

            <div
              v-if="showMenu"
              class="absolute bg-base-100 z-20 right-0 top-12 flex flex-col overflow-hidden text-left shadow-lg w-64"
            >
              <ul class="item">
                <li
                  class="flex font-light"
                  v-for="gw in competitions"
                  :key="`startWeek${gw.code}`"
                >
                  <RouterLink
                    :to="`/l/${gw.code}/predictions`"
                    class="p-2 bg-base-100 border-b border-base-300 hover:bg-primary hover:bg-opacity-10 w-full"
                    @click="showMenu = !showMenu"
                    :class="{
                      'bg-primary bg-opacity-20': gw.code === competitionCode,
                    }"
                    >{{ gw.name }}</RouterLink
                  >
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SHeader>

    <div
      class="p-2 relative bg-base-300 mb-8 flex flex-col md:flex-row my-2 items-center"
    >
      <div
        class="flex relative w-full xs:w-1/3 flex-1 flex-col gap-1 h-full items-center truncate px-2 mr-4 border-r-2 border-base-100"
        v-if="competition && hasSeasonFinished && topThree[0]"
      >
        <canvas
          ref="winnerCanvas"
          class="absolute top-0 w-full left-0 h-full"
        />
        <p class="text-sm font-base truncate">
          {{ competition?.name }} {{ currentSeasonFormat }}
        </p>
        <p class="text-3xl font-bold truncate">🏆 {{ topThree[0].username }}</p>
        <p class="text-sm font-light truncate">
          {{ topThree[0].points }} points
        </p>
      </div>
      <div
        class="flex relative w-full xs:w-1/3 flex-1 flex-col gap-1 h-full items-center truncate mr-4 md:border-r-2 border-base-100 px-2"
        v-else-if="competition"
      >
        <p class="text-sm font-base truncate">
          {{ competition?.name }} {{ currentSeasonFormat }}
        </p>
        <p class="text-sm font-light truncate">Winner announced:</p>
        <p class="text-xl font-light truncate">{{ seasonEnds }}</p>
      </div>
      <div
        class="flex relative w-full xs:w-1/3 flex-1 flex-col gap-1 h-full truncate mr-4 border-r-2 border-base-100"
        v-else
      ></div>

      <div class="w-64 flex justify-center items-center lg:mx-4 mx-auto my-4">
        <RouterLink
          v-if="competitionCode === 'EC'"
          to="/l/PL/predictions"
          class="btn btn-secondary w-full"
          >Premier League predictions</RouterLink
        >
        <RouterLink
          v-else
          to="/l/EC/predictions"
          class="btn btn-secondary w-full"
          >Place Euros predictions</RouterLink
        >
      </div>
    </div>
    <STabs :items="tabs" :path="route.path" />
    <div class="flex-col mb-16 w-full mt-4 min-h-screen">
      <RouterView
        v-if="!loading"
        :competitionCode="competitionCode"
        :key="competitionCode"
      />
      <div
        v-else-if="error"
        class="flex-1 mx-auto max-w-6xl w-full flex flex-col lg:justify-center lg:items-center p-4 lg:p-8 my-6"
      >
        <h1 class="text-5xl font-bold text-error">
          Whoops, something went wrong!
        </h1>
        <p class="my-4">Please refresh or try again later.</p>
      </div>

      <div v-else class="flex justify-center items-center w-full min-h-screen">
        <div
          class="p-4 bg-gradient-to-tr animate-spin from-[#ff5757] to-[#8c52ff] rounded-full my-32"
        >
          <div class="bg-base-100 rounded-full">
            <div class="w-24 h-24 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
    <p class="text-2xl font-light my-12 text-center" v-if="!isWhiteLabel">
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

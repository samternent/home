<script setup>
import { toRefs, watch, computed, shallowRef } from "vue";
import { useRouter } from "vue-router";
import {
  useTitle,
  useLocalStorage,
  useColorMode,
  onClickOutside,
} from "@vueuse/core";
import { provideCompetitionLoader } from "../../api/football-data/useCompetitionLoader";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { competitions } from "../../utils/competitions";

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

const { items: competition, error } = provideCompetitionLoader(competitionCode);

const lastLeague = useLocalStorage("lastLeague", "PL");

watch(
  competition,
  (_competition) => {
    title.value = `${_competition?.name} - Football Social`;
    lastLeague.value = _competition?.code;
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
        class="px-1 p-2 font-thin rounded-lg flex-1 flex flex-col justify-center mb-2"
      >
        <div class="flex justify-start lg:hidden mx-2 group">
          <div
            class="flex flex-col items-start justify-center -translate-x-6 anton-regular"
          >
            <div
              class="bg-base-content text-base-100 text-[21.3px] md:text-[30.7px] lg:text-[43.9px] [transform:rotate(-90deg)] px-2 uppercase group-hover:bg-primary "
            >
              Social
            </div>
          </div>
          <div
            class="font-bold text-base-content text-[68px] md:text-[96px] -translate-x-10 lg:text-[136px] uppercase anton-regular"
          >
            Football
          </div>
        </div>
        <div class="flex flex-col lg:flex-row justify-between mb-4">
          <div class="">
            <!-- ads -->
            <div
              class="tracking-tightest font-thin flex lg:flex-col items-end lg:items-start group cursor-pointer"
              v-if="competition && !editCompetition"
              @click="editCompetition = true"
            >
              <p class="md:text-3xl mt-0 ">{{ competition?.name }},</p>
              <p
                class="px-2 py-1 mx-2 lg:mx-0 lg:my-2 md:text-3xl transition-color inline-block font-bold bg-base-content group-hover:bg-primary tracking-tighter header text-base-100"
              >
                {{ competition?.area?.name }}.
              </p>
              <p
                class="text-lg font-thin lg:my-2 tracking-tighter flex items-center "
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
            <div v-else-if="competition" class="">
              <select
                ref="editCompetitionTarget"
                autofocus
                v-model="currentCompetition"
                class="block border-0 py-2 px-3 text-xl focus:ring-0 mr-2 rounded"
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
            <div class="lg:flex justify-end hidden">
              <div
                class="flex flex-col items-end justify-center translate-x-6 anton-regular"
              >
                <div
                  class="bg-base-content text-base-100 text-[30.7px] lg:text-[43.9px] [transform:rotate(-90deg)] px-2 uppercase"
                >
                  Social
                </div>
              </div>
              <div
                class="font-bold text-base-content text-[96px] lg:text-[136px] uppercase anton-regular"
              >
                Football
              </div>
            </div>
            <div
              class="flex justify-end text-2xl md:text-3xl lg:text-4xl font-thin tracking-tighter border-t py-2"
            >
              <!-- Prediction league. -->
            </div>
          </div>
        </div>
        <p
          class="text-xl md:text-2xl font-light leading-tighter tracking-tighter text-zinc-200"
        ></p>
      </div>
    </SHeader>

    <RouterView
      v-if="competition"
      :competitionCode="competitionCode"
      :key="competitionCode"
    />
    <div v-else class="h-96">LOADING</div>
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
</template>

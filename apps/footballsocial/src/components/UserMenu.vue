<script setup>
import { shallowRef, computed, watch } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useRouter } from "vue-router";
import { SButton } from "ternent-ui/components";
import { useCurrentUser } from "../composables/useCurrentUser";
import { useWhiteLabel } from "../module/brand/useWhiteLabel";

const showMenu = shallowRef(false);
const showClubMenu = shallowRef(false);
const dropdownRef = shallowRef(null);
const dropdownClubRef = shallowRef(null);
const { signOut, profile, updateProfile } = useCurrentUser();
const router = useRouter();
const { isWhiteLabel } = useWhiteLabel();

const lookups = {
  arsenal: 57,
  astonvilla: 58,
  afcbournemouth: 1044,
  brighton: 397,
  brentford: 402,
  burnley: 328,
  chelsea: 61,
  crystalpalace: 354,
  everton: 62,
  fulham: 63,
  liverpoolfc: 64,
  luton: 389,
  mancity: 65,
  manutd: 66,
  newcastle: 67,
  nottmforest: 351,
  sheffieldutd: 356,
  spurs: 73,
  wolves: 76,
  westham: 563,
  birmingham: 332,
};
const clubBadgeId = computed(() => {
  return lookups[profile.value?.club];
});

onClickOutside(dropdownRef, () => {
  showMenu.value = false;
});
onClickOutside(dropdownClubRef, () => {
  showClubMenu.value = false;
});

async function signOutAndLeave() {
  await signOut();
  showMenu.value = false;
  router.push("/");
}

const club = shallowRef(null);

const clubs = [
  { key: "arsenal", name: "Arsenal" },
  { key: "astonvilla", name: "Aston Villa" },
  { key: "afcbournemouth", name: "AFC Bournemouth" },
  { key: "brighton", name: "Brighton & Hove Albion" },
  { key: "brentford", name: "Brentford" },
  { key: "burnley", name: "Burnley" },
  { key: "chelsea", name: "Chelsea" },
  { key: "crystalpalace", name: "Crystal Palace" },
  { key: "everton", name: "Everton" },
  { key: "fulham", name: "Fulham" },
  { key: "liverpoolfc", name: "Liverpool FC" },
  { key: "luton", name: "Luton Town" },
  { key: "mancity", name: "Manchester City" },
  { key: "manutd", name: "Manchester United" },
  { key: "newcastle", name: "Newcastle United" },
  { key: "nottmforest", name: "Nottingham Forest" },
  { key: "sheffieldutd", name: "Sheffield United" },
  { key: "spurs", name: "Tottenham Hotspur" },
  { key: "wolves", name: "Wolverhampton Wanderers" },
  { key: "westham", name: "West Ham United" },
  { key: "birmingham", name: "Birmingham City" },
];

watch(club, (_club) => {
  if (_club !== profile.value?.club) {
    updateProfile({ ...profile.value, club: _club });
  }
});

watch(
  profile,
  (_profile) => {
    club.value = _profile?.club;
  },
  { immediate: true }
);
</script>
<template>
  <div class="flex flex-1 justify-end">
    <div class="relative flex" ref="dropdownClubRef" v-if="!isWhiteLabel">
      <SButton
        type="ghost"
        @click="showClubMenu = !showClubMenu"
        class="flex items-center font-light"
      >
        <div class="flex items-center rounded-full">
          <img
            v-if="clubBadgeId"
            :src="`https://crests.football-data.org/${clubBadgeId}.${
              ['wolves', 'brighton'].includes(club) ? 'svg' : 'png'
            }`"
            class="w-8 h-8"
            alt="User avatar"
          />
          <div v-else class="p-1 rounded-full bg-secondary">
            <svg
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke-width="0"
              class="w-6 h-6 inline"
            >
              <path
                class="fill-primary"
                d="M49.746,3.244L13.644,9.884v51.803c0,3.987,1.786,8.293,5.318,12.804c3.131,3.99,7.564,8.076,13.174,12.146  c7.004,5.063,14.144,8.834,17.61,10.551c3.472-1.717,10.612-5.487,17.614-10.551c5.614-4.069,10.039-8.155,13.168-12.146  c3.535-4.516,5.327-8.816,5.327-12.804V9.884L49.746,3.244z"
              />
            </svg>
          </div>
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4 inline group-hover:inline opacity-40"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
          />
        </svg>
      </SButton>

      <div
        v-if="showClubMenu"
        class="absolute bg-base-100 z-20 right-2 top-12 p-2 rounded flex flex-col overflow-hidden text-left shadow-lg w-64"
      >
        <ul class="item">
          <li
            class="flex font-light px-2 py-1 cursor-pointer hover:bg-base-200"
            v-for="_club in clubs"
            :key="`club${_club}`"
            @click="
              club = _club.key;
              showClubMenu = false;
            "
          >
            <div class="flex items-center rounded-full">
              <img
                :src="`https://crests.football-data.org/${lookups[_club.key]}.${
                  ['wolves', 'brighton'].includes(_club.key) ? 'svg' : 'png'
                }`"
                class="w-5 h-5 mr-2"
                alt="User avatar"
              />
              {{ _club.name }}
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="flex relative" ref="dropdownRef">
      <button
        aria-label="User menu"
        @click="showMenu = !showMenu"
        class="btn btn-accent"
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
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
        <!-- {{ profile.username }} -->
      </button>

      <div
        v-if="showMenu"
        class="absolute bg-base-200 z-20 right-2 top-12 flex flex-col overflow-hidden text-left shadow-lg w-64"
      >
        <ul class="item m-1">
          <li class="flex">
            <RouterLink
              @click="showMenu = false"
              to="/auth/profile"
              class="p-2 bg-base-100 border-b hover:bg-base-200 w-full"
              >Profile</RouterLink
            >
          </li>
          <li
            class="p-2 flex bg-base-100 hover:bg-base-200 cursor-pointer hover:text-red-600"
            @click="signOutAndLeave"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 mr-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"
              />
            </svg>
            Sign out
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

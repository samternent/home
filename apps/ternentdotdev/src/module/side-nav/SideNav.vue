<script setup>
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import SideNavItems from "../side-nav/SideNavItems.vue";
import Logo from "../brand/Logo.vue";
import { useWhiteLabel } from "../brand/useWhiteLabel";

import { SBrandHeader, SButton } from "ternent-ui/components";

const breakpoints = useBreakpoints(breakpointsTailwind);
const route = useRoute();
const mdAndLarger = breakpoints.greaterOrEqual("md");
const lgAndLarger = breakpoints.greaterOrEqual("lg");
const smallerThanMd = breakpoints.smaller("md");
const smallerThanLg = breakpoints.smaller("lg");

const collapsedSideBar = useLocalStorage("app/collapsedSideBar", false);
const whiteLabel = useWhiteLabel();

watch(route, () => {
  openSideBar.value = false;
});
watch(smallerThanMd, () => {
  collapsedSideBar.value = false;
});
const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);
const showSidebar = computed(() => mdAndLarger.value || openSideBar.value);

const topItems = computed(() => [
  {
    name: "TOOLS",
    to: "/tools",
    d: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z",
    children: [
      {
        name: "GZIP",
        to: "/tools/gzip",
      },
      {
        name: "Encryption",
        to: "/tools/encryption",
      },
    ],
  },
  {
    name: "PORTFOLIO",
    to: "/portfolio",
    d: "M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z",
    children: [
      {
        name: "FootballSocial",
        to: "/portfolio/footballsocial",
      },
      {
        name: "Sweet Shop",
        to: "/portfolio/sweet-shop",
      },
    ],
  },
  {
    name: "ARCADE",
    to: "/arcade",
    d: "M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z",
    children: [
      {
        name: "Test Game",
        to: "/arcade/game",
      },
    ],
  },
  {
    name: "LEDGER",
    to: "/ledger",
    d: "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10",
  },
]);

const bottomItems = computed(() => [
  {
    name: "READMES",
    to: "/readme",
    d: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25",
    children: [
      {
        name: "ternentdotdev",
        to: "/readme/apps/ternentdotdev",
      },
      {
        name: "ternent-api",
        to: "/readme/apps/ternent-api",
      },
      {
        name: "footballsocial",
        to: "/readme/apps/footballsocial",
      },
      {
        name: "footballsocial-api",
        to: "/readme/apps/footballsocial-api",
      },
      {
        name: "ternent-ui",
        to: "/readme/packages/ternent-ui",
      },
      {
        name: "encrypt",
        to: "/readme/packages/encrypt",
      },
      {
        name: "game-kit",
        to: "/readme/packages/game-kit",
      },
      {
        name: "identity",
        to: "/readme/packages/identity",
      },
      {
        name: "ledger",
        to: "/readme/packages/ledger",
      },
      {
        name: "proof-of-work",
        to: "/readme/packages/proof-of-work",
      },
      {
        name: "ragejs",
        to: "/readme/packages/ragejs",
      },
      {
        name: "utils",
        to: "/readme/packages/utils",
      },
    ],
  },
  {
    name: "CHANGELOGS",
    to: "/changelogs",
    d: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
    children: [
      {
        name: "ternentdotdev",
        to: "/changelogs/apps/ternentdotdev",
      },
      {
        name: "ternent-api",
        to: "/changelogs/apps/ternent-api",
      },
      {
        name: "footballsocial",
        to: "/changelogs/apps/footballsocial",
      },
      {
        name: "footballsocial-api",
        to: "/changelogs/apps/footballsocial-api",
      },
      {
        name: "ternent-ui",
        to: "/changelogs/packages/ternent-ui",
      },
      {
        name: "encrypt",
        to: "/changelogs/packages/encrypt",
      },
      {
        name: "game-kit",
        to: "/changelogs/packages/game-kit",
      },
      {
        name: "identity",
        to: "/changelogs/packages/identity",
      },
      {
        name: "ledger",
        to: "/changelogs/packages/ledger",
      },
      {
        name: "proof-of-work",
        to: "/changelogs/packages/proof-of-work",
      },
      {
        name: "ragejs",
        to: "/changelogs/packages/ragejs",
      },
      {
        name: "utils",
        to: "/changelogs/packages/utils",
      },
    ],
  },
]);
</script>
<template>
  <div
    v-if="showSidebar"
    class="flex flex-col bg-base-200 border-r-2 border-base-200 items-center justify-between duration-100"
    style="transition: width 200ms"
    :class="{
      'w-20 relative': (mdAndLarger && smallerThanLg) || collapsedSideBar,
      'w-60 relative': lgAndLarger && !collapsedSideBar,
      'w-60 absolute z-10 shadow-lg top-0 bottom-0':
        smallerThanMd && openSideBar,
    }"
  >
    <SButton
      class="btn btn-circle btn-ghost bg-base-300 btn-xs -right-4 z-50 bottom-4 absolute transition-transform duration-100"
      type="primary"
      :class="{
        'rotate-180': collapsedSideBar,
      }"
      v-if="lgAndLarger"
      @click="collapsedSideBar = !collapsedSideBar"
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-4 h-4"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 19.5 8.25 12l7.5-7.5"
        />
      </svg>
    </SButton>
    <SButton
      v-if="smallerThanMd"
      @click="openSideBar = false"
      class="btn btn-sm btn-circle btn-ghost mt-2"
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        data-slot="icon"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6 18 18 6M6 6l12 12"
        />
      </svg>
    </SButton>
    <header class="p-2 flex"></header>
    <div class="flex flex-col flex-1 gap-10 w-full">
      <SideNavItems
        :items="topItems"
        :collapsed="!(lgAndLarger || smallerThanMd) || collapsedSideBar"
      />
      <SideNavItems
        :items="bottomItems"
        :collapsed="!(lgAndLarger || smallerThanMd) || collapsedSideBar"
      />
    </div>

    <footer class="flex flex-col justify-end relative">
      <!-- <Logo
          class="mx-auto h-auto mb-6 w-24 transition-all opacity-80"
          :class="{
            '!w-12 !mb-4': (mdAndLarger && smallerThanLg) || collapsedSideBar,
          }"
        /> -->
    </footer>
  </div>
</template>

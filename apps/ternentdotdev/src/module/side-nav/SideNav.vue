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

import { SBrandHeader, SButton } from "ternent-ui/components";

const breakpoints = useBreakpoints(breakpointsTailwind);
const route = useRoute();
const mdAndLarger = breakpoints.greaterOrEqual("md");
const lgAndLarger = breakpoints.greaterOrEqual("lg");
const smallerThanMd = breakpoints.smaller("md");
const smallerThanLg = breakpoints.smaller("lg");

const collapsedSideBar = useLocalStorage("app/collapsedSideBar", false);

watch(route, () => {
  openSideBar.value = false;
});
watch(smallerThanMd, () => {
  collapsedSideBar.value = false;
});
const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);
const showSidebar = computed(() => mdAndLarger.value || openSideBar.value);
</script>
<template>
  <transition
    enter-from-class="translate-x-[-100%]"
    leave-to-class="translate-x-[-100%]"
    enter-active-class="transition duration-3000"
    leave-active-class=""
  >
    <div
      v-if="showSidebar"
      class="flex flex-col shrink-0 bg-base-200 items-center justify-between min-h-screen max-h-screen duration-100 h-screen"
      style="transition: width 200ms"
      :class="{
        'w-20 relative': (mdAndLarger && smallerThanLg) || collapsedSideBar,
        'w-64 relative': lgAndLarger && !collapsedSideBar,
        'w-64 absolute z-30 shadow-lg': smallerThanMd && openSideBar,
      }"
    >
      <SButton
        class="btn btn-circle btn-primary btn-sm -right-5 z-30 bottom-16 shadow absolute transition-transform duration-1000"
        type="neutral"
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
        class="btn-sm mt-2"
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
      <header class="p-2 flex md:justify-center sm:py-2">
        <RouterLink to="/" class="btn btn-ghost text-base"
          ><SBrandHeader
            v-if="(lgAndLarger || smallerThanMd) && !collapsedSideBar"
            size="md"
            >ternent<span class="font-light">dot</span>dev</SBrandHeader
          ><SBrandHeader v-else size="lg" class="font-light"
            >t</SBrandHeader
          ></RouterLink
        >
      </header>
      <SideNavItems
        :collapsed="!(lgAndLarger || smallerThanMd) || collapsedSideBar"
      />
      <footer class="flex flex-col justify-end relative">
        <Logo
          class="mx-auto h-auto mb-6 w-24 transition-all opacity-80"
          :class="{
            '!w-12 !mb-4': (mdAndLarger && smallerThanLg) || collapsedSideBar,
          }"
        />
      </footer>
    </div>
  </transition>
</template>

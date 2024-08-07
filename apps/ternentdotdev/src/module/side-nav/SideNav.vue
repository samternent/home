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
</script>
<template>
  <transition
    enter-from-class="translate-x-[-100%]"
    leave-to-class="translate-x-[-100%]"
    enter-active-class="transition duration-1000"
    leave-active-class=""
  >
    <div
      v-if="showSidebar"
      class="flex flex-col bg-base-200 border-r border-base-300 items-center justify-between duration-100 h-full"
      style="transition: width 200ms"
      :class="{
        'w-20 relative': (mdAndLarger && smallerThanLg) || collapsedSideBar,
        'w-56 relative': lgAndLarger && !collapsedSideBar,
        'w-48 absolute z-30 shadow-lg': smallerThanMd && openSideBar,
      }"
    >
      <SButton
        class="btn btn-circle btn-primary btn-xs -right-4 z-30 bottom-16 shadow absolute transition-transform duration-300"
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
        class="btn-xs mt-2"
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
        <RouterLink to="/app" class="btn btn-ghost text-base">
          <Transition
            enterFromClass="opacity-0"
            enterActiveClass="transition-opacity duration-300"
            enterToClass="opacity-100"
            leaveFromClass="opacity-100"
            leaveActiveClass="absolute transition-opacity duration-300"
            leaveToClass="opacity-0"
          >
            <SBrandHeader
              class="!text-xl"
              v-if="(lgAndLarger || smallerThanMd) && !collapsedSideBar"
              size="md"
              >{{ whiteLabel.name[0]
              }}<span class="font-light text-secondary text-lg">{{
                whiteLabel.name[1]
              }}</span
              >{{ whiteLabel.name[2] }}</SBrandHeader
            ><SBrandHeader v-else size="xs" class="font-medium text-lg"
              >{{ whiteLabel.name[0][0] }}
              <span class="text-secondary text-base text-light">{{
                whiteLabel.name[1][0]
              }}</span>
              <span class="text-base">{{ whiteLabel.name[2][0] }}</span>
            </SBrandHeader></Transition
          ></RouterLink
        >
      </header>
      <SideNavItems
        :collapsed="!(lgAndLarger || smallerThanMd) || collapsedSideBar"
      />
      <footer class="flex flex-col justify-end relative">
        <!-- <Logo
          class="mx-auto h-auto mb-6 w-24 transition-all opacity-80"
          :class="{
            '!w-12 !mb-4': (mdAndLarger && smallerThanLg) || collapsedSideBar,
          }"
        /> -->
      </footer>
    </div>
  </transition>
</template>

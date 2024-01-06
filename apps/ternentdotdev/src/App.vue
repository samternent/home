<script setup>
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import { computed, watch, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { provideBreadcrumbs } from "./module/breadcrumbs/useBreadcrumbs";
import { provideDrawerRoute } from "./module/drawer-route/useDrawerRoute";
import DrawerRouterView from "./module/drawer-route/DrawerRoute.vue";
import SideNavItems from "./module/side-nav/SideNavItems.vue";
import Logo from "./module/brand/Logo.vue";
import { provideAxios } from "./module/api/useAxios";

// DS components
import { SThemeToggle, SBrandHeader, SButton } from "ternent-ui/components";

const breakpoints = useBreakpoints(breakpointsTailwind);
const route = useRoute();

const links = [
  {
    title: "Privacy",
    to: "/legal/privacy",
  },
  {
    title: "Terms",
    to: "/legal/terms",
  },
];

const appName = import.meta.env.VITE_APP_NAME;

provideAxios();
provideBreadcrumbs();
provideDrawerRoute();

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

const themeName = useLocalStorage(
  "app/theme",
  `ternentdotdev-${localStorage.getItem("app/themeVariation")}`
);
</script>

<template>
  <div
    class="min-h-screen max-h-screen h-screen flex flex-col"
    :data-theme="themeName"
  >
    <div class="flex-1 flex bg-base-100 w-full mx-auto">
      <transition
        enter-from-class="translate-x-[-100%]"
        leave-to-class="translate-x-[-100%]"
        enter-active-class="transition duration-3000"
        leave-active-class=""
      >
        <div
          v-if="showSidebar"
          class="flex flex-col shrink-0 bg-base-200 justify-between min-h-screen max-h-screen duration-100 h-screen"
          style="transition: width 200ms"
          :class="{
            'w-20 relative': (mdAndLarger && smallerThanLg) || collapsedSideBar,
            'w-64 relative': lgAndLarger && !collapsedSideBar,
            'w-64 absolute z-20 shadow-lg': smallerThanMd && openSideBar,
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
            class="absolute right-2 top-2 btn-sm"
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
          <footer class="flex flex-col justify-end">
            <Logo
              class="mx-auto h-auto my-6 w-24 transition-all"
              :class="{
                '!w-12 !my-4':
                  (mdAndLarger && smallerThanLg) || collapsedSideBar,
              }"
            />
          </footer>
        </div>
      </transition>
      <DrawerRouterView />
    </div>
  </div>
</template>

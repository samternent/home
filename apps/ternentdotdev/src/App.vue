<script setup>
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { provideBreadcrumbs } from "./module/breadcrumbs/useBreadcrumbs";
import { provideDrawerRoute } from "./module/drawer-route/useDrawerRoute";
import DrawerRouterView from "./module/drawer-route/DrawerRoute.vue";
import SideNavItems from "./module/side-nav/SideNavItems.vue";

// DS components
import {
  SFooter,
  SThemeToggle,
  SBrandHeader,
  SButton,
} from "ternent-ui/components";

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

const theme = useLocalStorage(
  "app/theme",
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);

const appName = import.meta.env.VITE_APP_NAME;

provideBreadcrumbs();
provideDrawerRoute();

const mdAndLarger = breakpoints.greaterOrEqual("md");
const lgAndLarger = breakpoints.greaterOrEqual("lg");
const smallerThanMd = breakpoints.smaller("md");
const smallerThanLg = breakpoints.smaller("lg");
const smallerThanSm = breakpoints.smaller("sm");

watch(route, () => {
  openSideBar.value = false;
});
const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);
const showSidebar = computed(() => mdAndLarger.value || openSideBar.value);
</script>

<template>
  <div
    class="min-h-screen max-h-screen h-screen flex flex-col"
    :data-theme="theme"
  >
    <div class="flex-1 flex bg-base-100 w-full mx-auto">
      <transition
        enter-from-class="translate-x-[-100%]"
        leave-to-class="translate-x-[-100%]"
        :enter-active-class="smallerThanMd ? 'transition duration-3000' : ''"
        :leave-active-class="smallerThanMd ? 'transition duration-3000' : ''"
      >
        <div
          v-if="showSidebar"
          class="flex flex-col shrink-0 bg-base-200 justify-between min-h-screen max-h-screen h-screen"
          :class="{
            'w-20 relative': mdAndLarger && smallerThanLg,
            'w-64 relative': lgAndLarger,
            'w-[95%] absolute z-20': smallerThanMd,
            'w-full absolute z-20': smallerThanSm,
          }"
        >
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
              ><SBrandHeader v-if="lgAndLarger || smallerThanMd" size="md"
                >ternent<span class="font-light">dot</span>dev</SBrandHeader
              ><SBrandHeader v-else size="lg" class="font-light"
                >t</SBrandHeader
              ></RouterLink
            >
          </header>
          <SideNavItems />
          <footer>
            <SFooter :links="links">
              <template #bottom>
                <SThemeToggle v-model="theme" />
              </template>
            </SFooter>
          </footer>
        </div>
      </transition>
      <DrawerRouterView />
    </div>
  </div>
</template>

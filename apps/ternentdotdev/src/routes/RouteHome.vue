<script setup>
import { computed } from "vue";
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import ternentUIThemes from "ternent-ui/themes";
import { SBrandHeader, SBreadcrumbs, SButton } from "ternent-ui/components";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import Logo from "@/module/brand/Logo.vue";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import AppLayout from "@/module/app/AppLayout.vue";

const whiteLabel = useWhiteLabel();
const themeName = useLocalStorage("app/theme", null);
const themeVariation = computed(
  () => ternentUIThemes[themeName.value]?.["color-scheme"] || "light"
);
const breakpoints = useBreakpoints(breakpointsTailwind);
const smallerThanMd = breakpoints.smaller("md");
const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);
const breadcrumbs = useBreadcrumbs({
  path: "/",
  name: "Home",
});
</script>
<template>
  <div
    class="flex flex-col justify-end flex-1 w-full relative mx-auto h-screen max-h-screen overflow-hidden"
  >
    <div
      class="flex z-30 mx-auto w-full bg-base-300 gap-4 h-14 p-2 items-center sticky top-0 px-4"
    >
      <SButton
        v-if="smallerThanMd"
        type="primary"
        class="btn btn-ghost btn-circle btn-sm"
        @click="openSideBar = !openSideBar"
      >
        <svg
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
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </SButton>
      <SBreadcrumbs :breadcrumbs="breadcrumbs" />
      <div></div>
    </div>
    <AppLayout>
      <RouterView v-slot="{ Component }">
        <Transition name="fade">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </AppLayout>

    <div
      class="flex z-30 items-center justify-between flex-1 p-4 max-h-24 w-full bg-base-300"
    >
      <RouterLink to="/" class="flex items-center">
        <Logo class="h-auto w-16 lg:w-18 mr-2" />
        <div class="flex flex-0 flex-col justify-center">
          <SBrandHeader class="!text-2xl lg:!text-3xl"
            >{{ whiteLabel.name[0]
            }}<span class="font-light text-secondary text-xl lg:text-2xl">{{
              whiteLabel.name[1]
            }}</span
            >{{ whiteLabel.name[2] }}</SBrandHeader
          >
          <p class="text-xl font-light px-1 flex items-center">
            <!-- {{ whiteLabel.description }}÷ -->
            <span class="text-xs bg-primary px-2 text-base-100">{{
              whiteLabel.tag
            }}</span>
          </p>
          <span class="text-sm font-light"> </span>
        </div>
      </RouterLink>
      <div class="flex items-center">
        <a
          href="https://github.com/samternent"
          target="_blank"
          class="opacity-80 hover:opacity-100 transition-colors"
        >
          <img
            v-if="themeVariation === 'dark'"
            class="w-14 lg:w-16"
            src="@/assets/github-mark-white.png"
          />
          <img v-else class="w-14 lg:w-16" src="@/assets/github-mark.png" />
        </a>
      </div>
    </div>
  </div>
</template>

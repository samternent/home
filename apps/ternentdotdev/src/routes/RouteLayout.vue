<script setup>
import { watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  SNavBar,
  SBreadcrumbs,
  SButton,
  SBrandHeader,
  SThemeToggle,
} from "ternent-ui/components";
import { useBreadcrumbs } from "../module/breadcrumbs/useBreadcrumbs";

const breadcrumbs = useBreadcrumbs({
  path: "/",
  name: "Home",
});

const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);

const themeVariation = useLocalStorage(
  "app/themeVariation",
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);
const themeName = useLocalStorage(
  "app/theme",
  `ternentdotdev-${themeVariation.value}`
);

watch(themeVariation, (_themeVariation) => {
  themeName.value = `ternentdotdev-${_themeVariation}`;
});
</script>
<template>
  <div
    class="flex flex-col flex-1 min-h-screen max-h-screen h-screen overflow-hidden"
  >
    <SNavBar>
      <template #nav>
        <SButton
          type="primary"
          class="btn btn-ghost btn-sm"
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
      </template>
      <template #start>
        <SBreadcrumbs :breadcrumbs="breadcrumbs" />
      </template>
      <template #end>
        <SThemeToggle v-model="themeVariation" size="sm" />
        <RouterLink to="/" class="btn btn-ghost btn-sm text-base md:!hidden"
          ><SBrandHeader size="sm" class="font-light"
            >t</SBrandHeader
          ></RouterLink
        >
      </template>
    </SNavBar>
    <div class="flex flex-col flex-1 overflow-auto">
      <RouterView />
    </div>
  </div>
</template>

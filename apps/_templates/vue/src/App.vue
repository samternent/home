<script setup>
import { useLocalStorage } from "@vueuse/core";

// DS components
import {
  SNavBar,
  SFooter,
  SThemeToggle,
  SBrandHeader,
  SBreadcrumbs,
} from "ternent-ui/components";

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
</script>

<template>
  <div
    class="min-h-screen max-h-screen h-screen flex flex-col"
    :data-theme="theme"
  >
    <div class="flex-1 flex bg-base-100 w-full mx-auto">
      <div
        class="flex flex-col shrink-0 w-64 bg-base-200 justify-between min-h-screen max-h-screen h-screen"
      >
        <header class="p-2 flex justify-center border-b-2 border-base-300">
          <RouterLink to="/"
            ><SBrandHeader size="md">{{ appName }}</SBrandHeader></RouterLink
          >
        </header>
        <footer>
          <SFooter :links="links">
            <template #middle>Concords boards.</template>
            <template #bottom>
              <SThemeToggle v-model="theme" />
            </template>
          </SFooter>
        </footer>
      </div>
      <div
        class="flex flex-col flex-1 min-h-screen max-h-screen h-screen overflow-hidden"
      >
        <SNavBar>
          <template #start><SBreadcrumbs /></template>
          <template #end
            ><input
              type="search"
              class="input input-bordered input-sm"
              placeholder="Search"
            />
          </template>
        </SNavBar>
        <div class="flex flex-col flex-1 overflow-auto">
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

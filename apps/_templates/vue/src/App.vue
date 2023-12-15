<script setup>
import { useLocalStorage } from "@vueuse/core";
import { provideBreadcrumbs } from "./module/breadcrumbs/useBreadcrumbs";

// DS components
import {
  SFooter,
  SThemeToggle,
  SBrandHeader,
  SButton,
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

provideBreadcrumbs();
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
        <header class="p-2 flex justify-center py-8">
          <RouterLink to="/"
            ><SBrandHeader size="md">{{ appName }}</SBrandHeader></RouterLink
          >
        </header>
        <div class="flex flex-1 w-full items-start py-8 justify-center px-2">
          <SButton type="primary" to="/demo" class="flex-1">Demos</SButton>
        </div>
        <footer>
          <SFooter :links="links">
            <template #middle>Concords boards.</template>
            <template #bottom>
              <SThemeToggle v-model="theme" />
            </template>
          </SFooter>
        </footer>
      </div>
      <RouterView />
    </div>
  </div>
</template>

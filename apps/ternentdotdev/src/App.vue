<script setup>
import { useLocalStorage } from "@vueuse/core";
import { computed, watch } from "vue";
import { provideBreadcrumbs } from "./module/breadcrumbs/useBreadcrumbs";
import { provideDrawerRoute } from "./module/drawer-route/useDrawerRoute";
import { provideAxios } from "./module/api/useAxios";

import { provideAppShell } from "./module/app-shell/useAppShell";
import { useWhiteLabel } from "./module/brand/useWhiteLabel";
import Concords from "./module/concords/Concords.vue";
import ternentUIThemes from "ternent-ui/themes";

if (!window.location.pathname.startsWith("/solid/redirect")) {
  window.localStorage.setItem("app/lastPath", window.location.pathname);
}

provideAxios();
provideBreadcrumbs();
provideDrawerRoute();
provideAppShell();

const whiteLabel = useWhiteLabel();

// Theme management
const selectedTheme = useLocalStorage("app/theme", "sleekLight");

// Force clean any existing dark class on startup
document.documentElement.classList.remove("dark");

// Use the selected theme directly from localStorage
const themeName = computed(() => {
  return selectedTheme.value || "sleekLight";
});

// Sync document class for proper dark mode detection
watch(themeName, (newTheme) => {
  const themeConfig = ternentUIThemes[newTheme];
  const isThemeDark = themeConfig?.["color-scheme"] === "dark";
  
  // Always remove any existing dark class first
  document.documentElement.classList.remove("dark");
  
  // Only add dark class if theme is actually dark
  if (isThemeDark) {
    document.documentElement.classList.add("dark");
  }
}, { immediate: true });
</script>

<template>
  <!-- <div class="flex flex-col min-h-screen bg-base-100" :data-theme="fullTheme"> -->
  <div class="flex flex-col min-h-screen bg-base-100" :data-theme="themeName">
    <Concords>
      <div class="flex-1 flex w-full items-stretch">
        <RouterView />
      </div>
    </Concords>
  </div>
</template>

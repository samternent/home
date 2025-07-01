<script setup>
import { useLocalStorage, useDark } from "@vueuse/core";
import { computed } from "vue";
import { provideBreadcrumbs } from "./module/breadcrumbs/useBreadcrumbs";
import { provideDrawerRoute } from "./module/drawer-route/useDrawerRoute";
import { provideAxios } from "./module/api/useAxios";

import { provideAppShell } from "./module/app-shell/useAppShell";
import { useWhiteLabel } from "./module/brand/useWhiteLabel";
import Concords from "./module/concords/Concords.vue";

if (!window.location.pathname.startsWith("/solid/redirect")) {
  window.localStorage.setItem("app/lastPath", window.location.pathname);
}

provideAxios();
provideBreadcrumbs();
provideDrawerRoute();
provideAppShell();

const whiteLabel = useWhiteLabel();
const baseTheme = useLocalStorage("app/theme", whiteLabel.value.themeName);
const isDark = useDark();

// Auto-detect light/dark and use sleek theme variant
const themeName = computed(() => {
  const theme = baseTheme.value || "sleek";
  return "sleekLight"; // isDark.value ? `${theme}Light` : `${theme}Light`;
});
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

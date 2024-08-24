<script setup>
import { useLocalStorage } from "@vueuse/core";
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
const themeName = useLocalStorage("app/theme", whiteLabel.value.themeName);
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

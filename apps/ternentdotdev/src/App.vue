<script setup>
import { onMounted, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { provideBreadcrumbs } from "./module/breadcrumbs/useBreadcrumbs";
import { provideDrawerRoute } from "./module/drawer-route/useDrawerRoute";
import DrawerRouterView from "./module/drawer-route/DrawerRoute.vue";
import { provideAxios } from "./module/api/useAxios";

import { provideAppShell } from "./module/app-shell/useAppShell";
import { provideSolid } from "./module/solid/useSolid";
import { useWhiteLabel } from "./module/brand/useWhiteLabel";
import Concords from "./module/concords/Concords.vue";

if (!window.location.pathname.startsWith("/solid/redirect")) {
  window.localStorage.setItem("app/lastPath", window.location.pathname);
}

provideAxios();
provideBreadcrumbs();
provideDrawerRoute();
provideAppShell();
const { handleSessionLogin } = provideSolid();

const whiteLabel = useWhiteLabel();

const themeVariation = useLocalStorage(
  "app/themeVariation",
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);
const themeName = useLocalStorage("app/theme", whiteLabel.value.themeName);
const fullTheme = computed(() => `${themeName.value}-${themeVariation.value}`);
onMounted(handleSessionLogin);
</script>

<template>
  <div
    class="min-h-screen max-h-screen h-screen flex flex-col"
    :data-theme="fullTheme"
  >
    <Concords>
      <div class="flex-1 flex bg-base-100 w-full mx-auto">
        <!-- <SideNav /> -->
        <RouterView />
      </div>
    </Concords>
  </div>
</template>

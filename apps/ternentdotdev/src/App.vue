<script setup>
import { onMounted } from "vue";
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

const themeName = useLocalStorage(
  "app/theme",
  `${whiteLabel.value.themeName}-${
    localStorage.getItem("app/themeVariation") ||
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }`
);

onMounted(handleSessionLogin);
</script>

<template>
  <div
    class="min-h-screen max-h-screen h-screen flex flex-col"
    :data-theme="themeName"
  >
    <Concords>
      <div class="flex-1 flex bg-base-100 w-full mx-auto">
        <!-- <SideNav /> -->
        <RouterView />
      </div>
    </Concords>
  </div>
</template>

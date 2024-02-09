<script setup>
import { useLocalStorage } from "@vueuse/core";
import { provideBreadcrumbs } from "./module/breadcrumbs/useBreadcrumbs";
import { provideDrawerRoute } from "./module/drawer-route/useDrawerRoute";
import DrawerRouterView from "./module/drawer-route/DrawerRoute.vue";
import { provideAxios } from "./module/api/useAxios";
import { provideWhiteLabel } from "./module/brand/useWhiteLabel";

import Concords from "./module/concords/Concords.vue";
import SideNav from "./module/side-nav/SideNav.vue";

provideAxios();
provideBreadcrumbs();
provideDrawerRoute();

const whiteLabel = provideWhiteLabel();

const themeName = useLocalStorage(
  "app/theme",
  `${whiteLabel.value.themeName}-${
    localStorage.getItem("app/themeVariation") ||
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }`
);
</script>

<template>
  <div
    class="min-h-screen max-h-screen h-screen flex flex-col"
    :data-theme="themeName"
  >
    <div class="flex-1 flex bg-base-100 w-full mx-auto">
      <Concords>
        <SideNav />
        <DrawerRouterView />
      </Concords>
    </div>
  </div>
</template>

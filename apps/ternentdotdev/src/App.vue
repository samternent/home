<script setup>
import { useLocalStorage } from "@vueuse/core";
import { provideBreadcrumbs } from "./module/breadcrumbs/useBreadcrumbs";
import { provideDrawerRoute } from "./module/drawer-route/useDrawerRoute";
import DrawerRouterView from "./module/drawer-route/DrawerRoute.vue";
import { provideAxios } from "./module/api/useAxios";

import Concords from "./module/concords/Concords.vue";
import SideNav from "./module/side-nav/SideNav.vue";

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

const appName = import.meta.env.VITE_APP_NAME;

provideAxios();
provideBreadcrumbs();
provideDrawerRoute();

const themeName = useLocalStorage(
  "app/theme",
  `ternentdotdev-${localStorage.getItem("app/themeVariation")}`
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

<script setup>
import { shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { provideBreadcrumbs } from "./module/breadcrumbs/useBreadcrumbs";
import { provideDrawerRoute } from "./module/drawer-route/useDrawerRoute";
import DrawerRouterView from "./module/drawer-route/DrawerRoute.vue";
import { provideAxios } from "./module/api/useAxios";

import Concords from "./module/concords/Concords.vue";
import SideNav from "./module/side-nav/SideNav.vue";

const whiteLabel = shallowRef({
  name: ["ternent", "dot", "dev"],
});

if (
  window.location.host.includes("ternent.dev") ||
  window.location.host.includes("localhost")
) {
  whiteLabel.value = {
    ...whiteLabel.value,
    name: ["ternent", "dot", "dev"],
  };
}

provideAxios();
provideBreadcrumbs();
provideDrawerRoute();

const themeName = useLocalStorage(
  "app/theme",
  `${whiteLabel.value.name.join()}-${
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

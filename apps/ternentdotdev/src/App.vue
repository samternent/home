<script setup>
import { useLocalStorage } from "@vueuse/core";
import { provideBreadcrumbs } from "./module/breadcrumbs/useBreadcrumbs";
import { provideDrawerRoute } from "./module/drawer-route/useDrawerRoute";
import DrawerRouterView from "./module/drawer-route/DrawerRoute.vue";
import SideNavItems from "./module/side-nav/SideNavItems.vue";

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
provideDrawerRoute();
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
            ><SBrandHeader size="md"
              >ternent<span class="font-light">dot</span>dev</SBrandHeader
            ></RouterLink
          >
        </header>
        <SideNavItems />
        <footer>
          <SFooter :links="links">
            <template #middle>Concords boards.</template>
            <template #bottom>
              <SThemeToggle v-model="theme" />
            </template>
          </SFooter>
        </footer>
      </div>
      <DrawerRouterView />
    </div>
  </div>
</template>

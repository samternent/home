<script setup>
import { computed } from "vue";
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import ternentUIThemes from "ternent-ui/themes";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import { useAppShell } from "@/module/app-shell/useAppShell";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import Logo from "@/module/brand/Logo.vue";
import AppLayout from "@/module/app/AppLayout.vue";
import AppNavBar from "@/module/app/AppNavBar.vue";

const whiteLabel = useWhiteLabel();
const themeName = useLocalStorage("app/theme", null);
const { appVersion } = useAppShell();
const themeVariation = computed(
  () => ternentUIThemes[themeName.value]?.["color-scheme"] || "light"
);
const breakpoints = useBreakpoints(breakpointsTailwind);
const openSideBar = useLocalStorage("ternentdotdev/openSideBar", false);

// Provide root breadcrumb for all routes
useBreadcrumbs({ name: "Home", path: "/" });
</script>
<template>
  <div class="flex flex-col w-full h-screen overflow-hidden bg-base-100">
    <!-- Main content area -->
    <main class="flex-1 overflow-hidden relative">
      <AppLayout>
        <template #nav>
          <AppNavBar />
        </template>

        <RouterView v-slot="{ Component }">
          <Transition
            name="fade"
            duration="50"
            mode="out-in"
            class="flex flex-1 w-full"
          >
            <component :is="Component" />
          </Transition>
        </RouterView>
      </AppLayout>
    </main>

    <!-- Premium footer -->
    <footer
      class="relative z-30 bg-base-100/90 backdrop-blur-xl border-t border-base-300/50"
    >
      <div class="w-full px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-8">
          <!-- Logo -->
          <RouterLink
            to="/"
            class="flex items-center gap-2 text-base-content/70 hover:text-base-content"
          >
            <Logo class="h-5 w-5" />
            <span class="text-sm font-medium">ternent.dev</span>
          </RouterLink>

          <!-- Version info -->
          <a
            :href="`https://github.com/samternent/home/releases/tag/ternentdotdev-${appVersion}`"
            target="_blank"
            class="text-xs text-base-content/60 hover:text-base-content font-mono"
          >
            v{{ appVersion }}
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

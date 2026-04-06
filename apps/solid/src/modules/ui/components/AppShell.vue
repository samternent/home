<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppShellAddDialog from "@/modules/ui/components/AppShellAddDialog.vue";
import AppShellBottomNav from "@/modules/ui/components/AppShellBottomNav.vue";
import AppShellConnectPanel from "@/modules/ui/components/AppShellConnectPanel.vue";
import AppShellExplorerOverlay from "@/modules/ui/components/AppShellExplorerOverlay.vue";
import AppShellIdentityBanner from "@/modules/ui/components/AppShellIdentityBanner.vue";
import AppShellTopBar from "@/modules/ui/components/AppShellTopBar.vue";
import RunTerminalDock from "@/modules/ui/components/RunTerminalDock.vue";
import { useAppShellState } from "@/modules/ui/useAppShellState";

const route = useRoute();
const shellState = useAppShellState();
const focusedShell = computed(() => route.meta.shellMode === "focus");
</script>

<template>
  <div
    class="relative isolate flex h-dvh min-h-0 flex-col overflow-hidden bg-cover bg-center"
    style="background-image: url('/pexels-jplenio-2080960.jpg')"
  >
    <AppShellTopBar v-if="!focusedShell" />

    <main class="flex min-h-0 flex-1 overflow-hidden">
      <div class="flex min-h-0 flex-1 flex-col">
        <div
          :class="
            focusedShell
              ? 'flex min-h-0 flex-1 flex-col'
              : 'mx-auto my-4 flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 pb-24 sm:px-6'
          "
        >
          <AppShellIdentityBanner v-if="!focusedShell" />

          <div
            :class="
              focusedShell
                ? 'min-h-0 flex-1'
                : 'min-h-0 flex-1 rounded-xl bg-[var(--ui-bg)]/80 backdrop-blur-[16px]'
            "
          >
            <Transition name="surface" mode="out-in">
              <slot />
            </Transition>
          </div>
        </div>
      </div>

      <AppShellConnectPanel />
      <AppShellExplorerOverlay />
      <AppShellAddDialog />

      <div
        v-if="!focusedShell"
        class="pointer-events-none fixed bottom-0 flex w-full flex-col items-center justify-center gap-2"
      >
        <RunTerminalDock v-if="shellState.terminalOpen.value" />
        <AppShellBottomNav />
      </div>
    </main>
  </div>
</template>

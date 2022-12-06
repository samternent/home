<script setup lang="ts">
import { computed } from "vue";
import { useAppShell } from "../../composables/useAppShell";
import AppHeader from "../../modules/layout/AppHeader.vue";
import NavigationList from "../../modules/nav/NavigationList.vue";

const { themeColor } = useAppShell();
themeColor.value = "orange";

const navItems = computed(() => [
  {
    path: "/ledger",
    name: "Home",
  },
]);
</script>
<template>
  <div class="flex flex-col flex-1">
    <Teleport to="#TopFixedPanel">
      <AppHeader title="Ledger" description="@concords/ledger" />
    </Teleport>
    <Teleport to="#LeftPanelContent">
      <div
        class="text-sm breadcrumbs p-2 flex overflow-visible flex-row flex-1"
      >
        <NavigationList :items="navItems" />
      </div>
    </Teleport>
    <RouterView />
  </div>
</template>

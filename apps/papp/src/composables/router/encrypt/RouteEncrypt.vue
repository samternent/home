<script setup lang="ts">
import { computed } from "vue";
import { useAppShell } from "../../composables/useAppShell";
import AppHeader from "../../modules/layout/AppHeader.vue";
import NavigationList from "../../modules/nav/NavigationList.vue";

const { themeColor } = useAppShell();
themeColor.value = "pink";

const navItems = computed(() => [
  {
    path: "/encryption",
    name: "Details",
  },
  {
    name: "Features",
    // path: "/encryption/features",
    children: [
      {
        path: "/encryption/encrypt",
        name: "Encrypt",
      },
      {
        path: "/encryption/decrypt",
        name: "Decrypt",
      },
      {
        path: "/encryption/keys",
        name: "Generate Keys",
      },
    ],
  },
  {
    name: "Usage",
    children: [
      {
        path: "/encryption/install",
        name: "Installation",
      },
      {
        path: "/encryption/api",
        name: "API",
      },
      {
        path: "/encryption/examples",
        name: "Examples",
      },
    ],
  },
]);
</script>
<template>
  <div class="flex flex-col flex-1">
    <Teleport to="#TopFixedPanel">
      <AppHeader title="Encryption" description="@concords/encrypt" />
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

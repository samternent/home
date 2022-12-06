<script setup lang="ts">
import { computed } from "vue";
import { useAppShell } from "../../composables/useAppShell";
import AppHeader from "../../modules/layout/AppHeader.vue";
import NavigationList from "../../modules/nav/NavigationList.vue";

const { themeColor } = useAppShell();
themeColor.value = "blue";

const navItems = computed(() => [
  {
    path: "/identity",
    name: "Home",
  },
  {
    path: "/identity/sign",
    name: "Sign",
  },
  {
    path: "/identity/verify",
    name: "Verify",
  },
  {
    path: "/identity/keys",
    name: "Generate Keys",
  },
]);
</script>
<template>
  <div class="flex flex-col flex-1">
    <Teleport to="#TopFixedPanel">
      <AppHeader title="Identity" description="@concords/identity" />
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

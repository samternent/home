<script setup lang="ts">
import { useAppShell } from "../../composables/useAppShell";
import AppHeader from "../../modules/layout/AppHeader.vue";

const { themeColor } = useAppShell();
themeColor.value = "purple";
</script>
<template>
  <div class="flex flex-col flex-1">
    <Teleport to="#TopFixedPanel">
      <AppHeader title="Storage" />
    </Teleport>
    <!-- <Teleport to="#LeftPanelContent">
      <div
        class="text-sm breadcrumbs p-2 flex overflow-visible flex-row flex-1"
      >
      </div>
    </Teleport> -->
    <RouterView />
  </div>
</template>

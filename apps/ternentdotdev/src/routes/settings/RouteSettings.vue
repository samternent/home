<script setup>
import { useLocalStorage } from "@vueuse/core";
import { watch } from "vue";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";

import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

const whiteLabel = useWhiteLabel();
const themeVariation = useLocalStorage(
  "app/themeVariation",
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);
const themeName = useLocalStorage("app/theme", `${whiteLabel.value.themeName}`);

watch(themeVariation, (_themeVariation) => {
  themeName.value = `${whiteLabel.value.themeName}`;
});

useBreadcrumbs({
  path: "/app/settings",
  name: "Settings",
});
</script>
<template>
  <div class="p-2">
    <div class="flex justify-start">
      <h1>Settings</h1>
    </div>
  </div>
</template>

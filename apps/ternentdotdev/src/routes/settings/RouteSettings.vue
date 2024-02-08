<script setup>
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import { computed, watch, shallowRef } from "vue";
import { SThemeToggle } from "ternent-ui/components";

const themeVariation = useLocalStorage(
  "app/themeVariation",
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);
const themeName = useLocalStorage(
  "app/theme",
  `ternentdotdev-${themeVariation.value}`
);

watch(themeVariation, (_themeVariation) => {
  themeName.value = `ternentdotdev-${_themeVariation}`;
});
</script>
<template>
  <div class="p-2">
    <div class="flex justify-start">
      <span>Theme</span>
      <SThemeToggle v-model="themeVariation" size="sm" class="mx-auto my-2" />
    </div>
  </div>
</template>

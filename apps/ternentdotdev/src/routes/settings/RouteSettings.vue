<script setup>
import {
  useLocalStorage,
  breakpointsTailwind,
  useBreakpoints,
} from "@vueuse/core";
import { computed, watch, shallowRef } from "vue";
import { SThemeToggle } from "ternent-ui/components";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";

const whiteLabel = useWhiteLabel();
const themeVariation = useLocalStorage(
  "app/themeVariation",
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);
const themeName = useLocalStorage("app/theme", `${whiteLabel.value.themeName}`);

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

watch(themeVariation, (_themeVariation) => {
  themeName.value = `${whiteLabel.value.themeName}`;
});
</script>
<template>
  <div class="p-2">
    <div class="flex justify-start">
      <h1>Settings</h1>
    </div>
  </div>
</template>

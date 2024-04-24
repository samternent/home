<script setup>
import { computed, watch, shallowRef } from "vue";
import { SThemeToggle } from "ternent-ui/components";
import { useLocalStorage } from "@vueuse/core";
import { SBrandHeader } from "ternent-ui/components";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import Logo from "@/module/brand/Logo.vue";

const whiteLabel = useWhiteLabel();

const themeVariation = useLocalStorage(
  "app/themeVariation",
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);
// const themeName = shallowRef(`${whiteLabel.value.themeName}-light`);
const themeName = useLocalStorage(
  "app/theme",
  `${whiteLabel.value.themeName}-${
    localStorage.getItem("app/themeVariation") ||
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }`
);

watch(themeVariation, (_themeVariation) => {
  themeName.value = `${whiteLabel.value.themeName}-${_themeVariation}`;
});
</script>
<template>
  <div class="flex h-screen items-end flex-1 p-4">
    <div class="flex items-center flex-1">
      <div class="flex flex-col">
        <Logo class="h-auto w-16 lg:w-20 mr-2" />
      </div>
      <div class="flex flex-col justify-center">
        <SBrandHeader
          >{{ whiteLabel.name[0]
          }}<span class="font-light">{{ whiteLabel.name[1] }}</span
          >{{ whiteLabel.name[2] }}</SBrandHeader
        >
        <p class="text-xl font-light px-1 flex flex-col justify-start">
          {{ whiteLabel.description }}
          <SThemeToggle
            v-model="themeVariation"
            size="sm"
            class="absolute top-5 right-5"
          />
        </p>
      </div>
    </div>
  </div>
</template>

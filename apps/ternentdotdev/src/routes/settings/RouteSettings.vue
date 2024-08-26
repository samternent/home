<script setup>
import { useLocalStorage } from "@vueuse/core";
import { shallowRef, computed } from "vue";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import { SMenu } from "ternent-ui/components";
import ternentUIThemes from "ternent-ui/themes";
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";

const whiteLabel = useWhiteLabel();

const theme = useLocalStorage("app/theme");
const themeName = shallowRef(theme.value);
const themeConfig = computed({
  get() {
    return theme.value;
  },
  set({ name, value }) {
    themeName.value = name;
    theme.value = value;
  },
});

const themes = computed(() => [
  { name: "Azure Bloom", value: "azureBloom" },
  { name: "Azure Bloom Dark", value: "azureBloomDark" },
  { name: "Corporate Professional", value: "corporateProfessional" },
  { name: "Corporate Professional Dark", value: "corporateDark" },
  { name: "Neon Blanc", value: "neonBlanc" },
  { name: "Neon Noir", value: "neonNoir" },
  { name: "Marshmallow", value: "marshmallowLight" },
  { name: "Marshmallow Dark", value: "marshmallowDark" },
]);

useBreadcrumbs({
  path: "/app/settings",
  name: "Settings",
});
</script>
<template>
  <div class="p-2 flex flex-col">
    <ul class="flex flex-col">
      <li class="flex gap-2">
        <span class="text-medium">Theme:</span>
        <SMenu v-model="themeConfig" :button-text="themeName" :items="themes" />
      </li>
    </ul>
  </div>
</template>

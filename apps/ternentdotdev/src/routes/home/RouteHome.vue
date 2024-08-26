<script setup>
import { computed, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import { SMenu, SResizer } from "ternent-ui/components";
import { useAppShell } from "@/module/app-shell/useAppShell";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";
import ternentUIThemes from "ternent-ui/themes";

hljs.registerLanguage("javascript", javascript);

const { appVersion } = useAppShell();
const whiteLabel = useWhiteLabel();

const host = window.location.host;
const version = window.__APP_VERSION__;

const theme = useLocalStorage("app/theme");
const themeName = shallowRef(theme.value);
const themeConfig = computed({
  get() {
    return theme.value;
  },
  set({ name }) {
    themeName.value = name;
    theme.value = name;
  },
});

const themes = computed(() =>
  Object.entries(ternentUIThemes).map(([name, theme]) => ({
    name,
    value: theme,
  }))
);
</script>
<template>
  <div class="flex flex-col justify-center mx-auto w-64">
    <div class="opacity-70 text-xs my-2 text-base-content"># {{ host }}</div>
    <div class="font-medium">TERNENT DOT DEV LTD.</div>
    <a
      href="https://www.google.com/maps/@52.4973492,-1.8636315,11z"
      target="_blank"
      class="link flex items-center text-sm"
      shrink
      >Birmingham, UK.
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-4 h-4 ml-2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
    </a>
  </div>
</template>

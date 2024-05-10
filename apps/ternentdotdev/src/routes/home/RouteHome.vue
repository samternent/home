<script setup>
import { computed, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import { SMenu } from "ternent-ui/components";
import { useAppShell } from "@/module/app-shell/useAppShell";
import { useWhiteLabel } from "@/module/brand/useWhiteLabel";

hljs.registerLanguage("javascript", javascript);

const { appVersion } = useAppShell();
const whiteLabel = useWhiteLabel();

const host = window.location.host;
const version = window.__APP_VERSION__;
// const theme = useLocalStorage("app/theme", null);

const themes = shallowRef([
  // { name: "default", value: "default" },
  { name: "TERNENTDOTDEV", value: "ternentdotdev" },
  //   { name: "Football Social", value: "footballsocial" },
  { name: "CONCORDS", value: "concords" },
  // { name: "Vibrant", value: "vibrant" },
  // { name: "Liverpool FC", value: "liverpoolfc" },
  // { name: "Teamwork.com", value: "teamwork" },
]);

const themeVariation = useLocalStorage("app/themeVariation", null);
const theme = useLocalStorage("app/theme");
const themeName = shallowRef(
  themes.value.find(({ value }) => value === theme.value)?.name
);

const themeConfig = computed({
  get() {
    return theme.value;
  },
  set({ name, value }) {
    themeName.value = name;
    theme.value = value;
  },
});
</script>
<template>
  <ul class="p-4 font-mono text-accent flex flex-col h-full justify-center">
    <!-- <li class="opacity-70 my-2 text-base-content"># {{ host }}</li> -->
    <li class="flex items-center">
      <span class="text-primary">version:</span>
      <a
        :href="`https://github.com/samternent/home/releases/tag/ternentdotdev-${appVersion}`"
        target="_blank"
        class="link link-secondary flex items-center ml-2"
        >{{ appVersion }}
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
          /></svg
      ></a>
    </li>
    <li class="flex">
      <span class="text-primary">theme:</span>
      <SMenu
        v-model="themeConfig"
        class="text-secondary"
        :button-text="themeName"
        :items="themes"
      />
    </li>
    <li class="text-base-content">---</li>
    <li><span class="text-primary">name:</span> TERNENT DOT DEV LTD</li>
    <!-- <li>
      <span class="text-primary">description:</span> "Software development and
      solutions",
    </li> -->
    <li class="flex gap-2">
      <span class="text-primary">location:</span>
      <span class="flex"
        ><a
          href="https://www.google.com/maps/@52.4973492,-1.8636315,11z"
          target="_blank"
          class="link link-secondary flex items-center"
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
          </svg> </a
      ></span>
    </li>
    <li>
      <span class="text-primary">email:</span>
      <a href="mailto:hello@ternent.dev" class="link link-secondary ml-2"
        >hello@ternent.dev</a
      >
    </li>
    <li class="flex gap-2">
      <span class="text-primary">linkedin:</span>
      <span class="flex"
        ><a
          href="https://www.linkedin.com/in/samternent/"
          target="_blank"
          class="link link-secondary flex items-center"
          shrink
          >linkedin.com/in/samternent
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
          </svg> </a
      ></span>
    </li>
    <li class="flex gap-2">
      <span class="text-primary">github:</span>
      <span class="flex"
        ><a
          href="https://www.github.com/samternent/"
          target="_blank"
          class="link link-secondary flex items-center"
          shrink
          >github.com/samternent
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
          </svg> </a
      ></span>
    </li>
    <li class="text-base-content">---</li>
    <li class="flex gap-2">
      <span class="text-primary">apps:</span>
      <span class="flex"
        >[<a
          href="https://footballsocial.app"
          target="_blank"
          class="link link-secondary flex items-center"
          shrink
          >footballsocial.app
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
          </svg> </a
        >]</span
      >
    </li>
    <li>
      <span class="text-primary">portfolio:</span> [<RouterLink
        to="/game"
        class="link link-secondary"
        >Game</RouterLink
      >,
      <RouterLink to="/sweet-shop" class="link link-secondary"
        >Sweet Shop</RouterLink
      >,
      <RouterLink to="/app" class="link link-secondary">App Layout</RouterLink>]
    </li>
    <li>
      <span class="text-primary">slides:</span> [<RouterLink
        to="/s/welcome"
        class="link link-secondary"
        >Welcome</RouterLink
      >,
      <RouterLink to="/s/router-drawers" class="link link-secondary"
        >Router Drawers</RouterLink
      >]
    </li>
  </ul>
</template>

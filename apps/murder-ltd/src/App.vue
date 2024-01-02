<script setup>
import { useLocalStorage } from "@vueuse/core";
import { provideAxios } from "./module/api/useAxios";
// DS components
import { SFooter, SBrandHeader } from "ternent-ui/components";

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

const theme = useLocalStorage(
  "app/theme",
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
);

const appName = import.meta.env.VITE_APP_NAME;

provideAxios();
</script>

<template>
  <div
    class="min-h-screen max-h-screen h-screen flex flex-col bg-base-100 overflow-auto"
    :data-theme="theme"
  >
    <div class="flex flex-1 flex-col w-full mx-auto max-w-6xl py-4">
      <header class="p-2 flex pt-8">
        <RouterLink to="/" class="btn btn-ghost"
          ><SBrandHeader size="md"
            >murder<span class="font-light">.ltd</span></SBrandHeader
          ></RouterLink
        >
      </header>
      <RouterView />
    </div>
    <footer class="bg-base-200 pt-6">
      <SFooter :links="links" />
    </footer>
  </div>
</template>

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

const themeVariation = useLocalStorage("app/themeVariation", null);
const theme = useLocalStorage("app/theme");
const themes = shallowRef([
  "ternentdotdev",
  "concords",
  "arsenal",
  "astonvilla",
  "afcbournemouth",
  "brighton",
  "brentford",
  "burnley",
  "chelsea",
  "crystalpalace",
  "everton",
  "fulham",
  "liverpoolfc",
  "luton",
  "mancity",
  "manutd",
  "newcastle",
  "nottmforest",
  "sheffieldutd",
  "spurs",
  "westham",
  "wolves",
  "birmingham",
  "walkers",
  "thecyclinggk",
  "teamwork",
]);
</script>
<template>
  <ul class="p-4 font-mono text-accent">
    <li class="opacity-70 my-2 text-base-content"># {{ host }}</li>
    <li><span class="text-primary">version:</span> "{{ appVersion }}",</li>
    <li class="flex">
      <span class="text-primary">theme:</span>
      <SMenu v-model="theme" :button-text="theme" :items="themes" />
    </li>
    <li class="text-base-content">---</li>
    <li><span class="text-primary">name:</span> "Ternent Dot Dev Ltd.",</li>
    <li>
      <span class="text-primary">description:</span> "A software solutions
      company",
    </li>
    <li>
      <span class="text-primary">location:</span> "Birmingham, England, UK.",
    </li>
    <li>
      <span class="text-primary">email:</span>
      "<a href="mailto:hello@ternent.dev" class="link link-secondary"
        >hello@ternent.dev</a
      >"
    </li>
    <li>
      <span class="text-primary">linkedin:</span>
      "<a
        href="https://www.linkedin.com/in/samternent/"
        target="_blank"
        class="link link-secondary"
        >linkedin.com/in/samternent/</a
      >"
    </li>
    <li>
      <span class="text-primary">github:</span>
      "<a
        href="https://www.github.com/samternent/"
        target="_blank"
        class="link link-secondary"
        >github.com/samternent/</a
      >"
    </li>
    <li class="text-base-content">---</li>
    <li>
      <span class="text-primary">apps:</span> ["<a
        href="https://footballsocial.app"
        target="_blank"
        class="link link-secondary"
        >footballsocial.app</a
      >"]
    </li>
    <li>
      <span class="text-primary">portfolio:</span> ["<RouterLink
        to="/game"
        class="link link-secondary"
        >Game</RouterLink
      >", "<RouterLink to="/sweet-shop" class="link link-secondary"
        >Sweet Shop</RouterLink
      >"]
    </li>
  </ul>
</template>

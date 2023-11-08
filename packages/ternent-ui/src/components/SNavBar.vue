<script setup>
import { shallowRef } from "vue";

defineProps({
  title: {
    type: String,
    required: true,
  },
});

const themes = shallowRef([
  "ternent",
  "villa",
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
]);

function setTheme(theme) {
  document.querySelector("html").dataset.theme = theme;
}
</script>
<template>
  <div class="navbar bg-base-100 sticky top-0 z-10">
    <div class="flex-1">
      <RouterLink to="/" class="btn btn-ghost text-xl normal-case font-medium"
        >{{ title }}<span class="text-accent -mx-2">.</span></RouterLink
      >
    </div>
    <div class="flex-none">
      <ul class="menu menu-horizontal px-1">
        <li><a>Link</a></li>
        <li>
          <details>
            <summary>Theme</summary>
            <ul class="p-2 bg-base-100">
              <li
                v-for="theme in themes"
                :key="theme"
                @click="setTheme(theme)"
                class="cursor-pointer"
                role="button"
              >
                {{ theme }}
              </li>
            </ul>
          </details>
        </li>
      </ul>
    </div>
  </div>
</template>

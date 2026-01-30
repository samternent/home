import { ViteSSG } from "vite-ssg";
import { useLocalStorage } from "@vueuse/core";
import { watchEffect, shallowRef } from "vue";
import "ternent-ui/styles.css";
import "ternent-ui/themes/print.css";
import "ternent-ui/themes/spruce-ink.css";
import "ternent-ui/themes/obsidian-iris.css";
import "ternent-ui/themes/harbor-rose.css";
import "ternent-ui/themes/garnet-honey.css";
import "ternent-ui/themes/citrine-ash.css";

import "./style.css";
import App from "./App.vue";
import { routes } from "./route/index";

const theme = useLocalStorage("app/theme", "spruce");
const isDark = shallowRef(false);

if (typeof window !== "undefined") {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  isDark.value = media.matches;

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", (event) => (isDark.value = event.matches));
  } else if (typeof media.addListener === "function") {
    media.addListener((event) => (isDark.value = event.matches));
  }
}

watchEffect(() => {
  document.documentElement.setAttribute(
    "data-theme",
    `${theme.value}-${isDark.value ? "dark" : "light"}`
  );

  document.documentElement.classList.toggle("dark", isDark.value);
});

export const createApp = ViteSSG(
  App,
  { routes },
  // SSG options
  ({}) => {}
);

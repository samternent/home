import { ViteSSG } from "vite-ssg";
import { useLocalStorage } from "@vueuse/core";
import { watchEffect, shallowRef } from "vue";
import "ternent-ui/styles.css";
import "ternent-ui/themes/print.css";
import "ternent-ui/themes/spruce-ink.css";
import "ternent-ui/themes/obsidian-iris.css";
import "ternent-ui/themes/pixpax.css";
import "ternent-ui/themes/harbor-rose.css";
import "ternent-ui/themes/garnet-honey.css";
import "ternent-ui/themes/citrine-ash.css";
import "ternent-ui/themes/prism.css";
import "ternent-ui/themes/sunset.css";
import "ternent-ui/themes/aurora.css";

import "./style.css";
import App from "./App.vue";
import { routes } from "./route/index";

const theme = useLocalStorage("app/theme", "spruce");
const themeMode = useLocalStorage("app/themeMode", "");
const isDark = shallowRef(false);

if (!themeMode.value && typeof window !== "undefined") {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  themeMode.value = media.matches ? "dark" : "light";

  if (typeof media.addEventListener === "function") {
    media.addEventListener(
      "change",
      (event) => (themeMode.value = media.matches ? "dark" : "light"),
    );
  } else if (typeof media.addListener === "function") {
    media.addListener(
      (event) => (themeMode.value = media.matches ? "dark" : "light"),
    );
  }
}

if (typeof document !== "undefined") {
  watchEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      `${theme.value}-${themeMode.value || "light"}`,
    );
    document.documentElement.setAttribute(
      "data-theme-palette",
      themeMode.value,
    );

    // document.documentElement.classList.toggle(themeMode.value);
  });
}

export const createApp = ViteSSG(
  App,
  { routes },
  // SSG options
  ({ isClient, router }) => {
    if (!isClient || typeof window === "undefined") return;
    const host = window.location.hostname;
    if (host !== "pixpax.xyz" && host !== "www.pixpax.xyz") return;

    router.isReady().then(() => {
      document.documentElement.classList.remove("pixpax-preload");
      const loader = document.getElementById("pixpax-preload");
      if (loader) loader.remove();
    });
  },
);

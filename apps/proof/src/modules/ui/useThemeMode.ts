import { computed, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { appConfig, appThemePrefix, type ThemeMode } from "@/app/config/app.config";

const STORAGE_KEY = `${appConfig.appId}/theme-mode`;

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return appConfig.defaultThemeMode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const modeRef = useLocalStorage<ThemeMode>(STORAGE_KEY, getInitialMode());

let started = false;

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", `${appThemePrefix}-${mode}`);
}

export function useThemeMode() {
  const mode = computed<ThemeMode>({
    get: () => modeRef.value,
    set: (value) => {
      modeRef.value = value === "dark" ? "dark" : "light";
    },
  });

  const isDark = computed(() => mode.value === "dark");

  const setTheme = (next: ThemeMode) => {
    mode.value = next;
    applyTheme(next);
  };

  const toggleTheme = () => {
    setTheme(mode.value === "dark" ? "light" : "dark");
  };

  const start = () => {
    if (started) return;
    started = true;

    applyTheme(mode.value);

    watch(
      () => mode.value,
      (next) => applyTheme(next),
      { immediate: true },
    );
  };

  return {
    mode,
    isDark,
    setTheme,
    toggleTheme,
    start,
  };
}

import { computed, ref, watch } from "vue";
import { appConfig, appThemePrefix, type ThemeMode } from "@/app/config/app.config";

const FIXED_THEME_MODE: ThemeMode = appConfig.defaultThemeMode;
const modeRef = ref<ThemeMode>(FIXED_THEME_MODE);

let started = false;

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.themePrefix = appConfig.themeName;
  document.documentElement.setAttribute("data-theme", `${appThemePrefix}-${mode}`);
}

export function useThemeMode() {
  const mode = computed<ThemeMode>({
    get: () => FIXED_THEME_MODE,
    set: (value) => {
      modeRef.value = value === "dark" ? "dark" : "light";
    },
  });

  const isDark = computed(() => FIXED_THEME_MODE === "dark");

  const setTheme = (_next: ThemeMode) => {
    modeRef.value = FIXED_THEME_MODE;
    applyTheme(FIXED_THEME_MODE);
  };

  const toggleTheme = () => {
    modeRef.value = FIXED_THEME_MODE;
    applyTheme(FIXED_THEME_MODE);
  };

  const start = () => {
    if (started) return;
    started = true;

    applyTheme(FIXED_THEME_MODE);

    watch(
      () => modeRef.value,
      () => applyTheme(FIXED_THEME_MODE),
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

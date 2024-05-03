import { inject, shallowRef, computed, provide } from "vue";
import { useCurrentUser } from "../../composables/useCurrentUser";
import { useLocalStorage } from "@vueuse/core";

const useWhiteLabelSymbol = Symbol("useWhiteLabel");

export function provideWhiteLabel(app) {
  const { profile } = useCurrentUser();
  const host = shallowRef(window.location.hostname.split(".")[0]);
  const isWhiteLabel = computed(() =>
    ["walkers", "thecyclinggk"].includes(host.value)
  );

  const colorTheme = useLocalStorage(
    "app/theme",
    window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  );

  const theme = computed({
    get: () => {
      if (isWhiteLabel.value) {
        return `${host.value}-${colorTheme.value}`;
      }
      return `${profile.value?.club ? `${profile.value.club}-` : ""}${
        colorTheme.value
      }`;
    },
  });

  const state = {
    theme,
    colorTheme,
    isWhiteLabel,
    host,
  };

  provide(useWhiteLabelSymbol, state);
  return state;
}

export function useWhiteLabel() {
  return inject(useWhiteLabelSymbol);
}

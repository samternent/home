import { useThemeMode } from "./useThemeMode";

let uiProvider: ReturnType<typeof useThemeMode> | undefined;

export function installUiProvider() {
  if (!uiProvider) {
    uiProvider = useThemeMode();
  }

  return uiProvider;
}

export * from "./useThemeMode";

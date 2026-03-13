export type ThemeMode = "light" | "dark";

export type AppConfig = {
  appId: string;
  appTitle: string;
  defaultHost: string;
  defaultThemeMode: ThemeMode;
};

export const appConfig: AppConfig = {
  appId: "__APP_ID__",
  appTitle: "__APP_TITLE__",
  defaultHost: "__APP_HOST__",
  defaultThemeMode: "light",
};

export const appThemePrefix = "__APP_THEME_PREFIX__";

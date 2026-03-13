export type ThemeMode = "light" | "dark";

export type AppConfig = {
  appId: string;
  appTitle: string;
  defaultHost: string;
  defaultThemeMode: ThemeMode;
};

export const appConfig: AppConfig = {
  appId: "proof",
  appTitle: "Seal",
  defaultHost: "seal.ternent.dev",
  defaultThemeMode: "dark",
};

export const appThemePrefix = "proof";

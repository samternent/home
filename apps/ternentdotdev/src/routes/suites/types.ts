import type { LandingPageConfig } from "ternent-ui/patterns";

export type SuiteThemeMode = "light" | "dark";

export type SuiteSeoConfig = {
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  lang: string;
  canonicalPath: string;
};

export type SuiteDefinition = {
  slug: string;
  title: string;
  themeName: string;
  defaultThemeMode: SuiteThemeMode;
  seo: SuiteSeoConfig;
  landing: LandingPageConfig;
};

export type SuiteRouteMeta = {
  suiteKey: string;
  suiteTheme: string;
  suiteMode?: SuiteThemeMode;
};

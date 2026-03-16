import { describe, expect, it } from "vitest";
import { appThemePrefix, appConfig } from "@/app/config/app.config";
import { useThemeMode } from "@/modules/ui";

describe("theme mode", () => {
  it("uses the manifest default mode and theme prefix", () => {
    const theme = useThemeMode();
    theme.start();

    expect(theme.mode.value).toBe(appConfig.defaultThemeMode);
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      `${appThemePrefix}-${appConfig.defaultThemeMode}`,
    );

    theme.toggleTheme();

    expect(theme.mode.value).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      `${appThemePrefix}-light`,
    );
  });
});

import { describe, expect, it } from "vitest";
import { appConfig } from "@/app/config/app.config";
import { useThemeMode } from "@/modules/ui";

describe("theme mode", () => {
  it("locks PixPax to the manifest default theme", () => {
    const theme = useThemeMode();
    theme.start();

    expect(theme.mode.value).toBe(appConfig.defaultThemeMode);
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      `pixpax-${appConfig.defaultThemeMode}`,
    );

    theme.toggleTheme();

    expect(theme.mode.value).toBe(appConfig.defaultThemeMode);
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      `pixpax-${appConfig.defaultThemeMode}`,
    );
  });
});

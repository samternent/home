import { describe, expect, it } from "vitest";
import { useThemeMode } from "@/modules/ui";

describe("theme mode", () => {
  it("applies and persists data-theme value", () => {
    const theme = useThemeMode();
    theme.start();
    theme.setTheme("dark");

    expect(theme.mode.value).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")?.endsWith("-dark")).toBe(true);

    theme.toggleTheme();

    expect(theme.mode.value).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")?.endsWith("-light")).toBe(true);
  });
});

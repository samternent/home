import { describe, expect, it } from "vitest";
import { useThemeMode } from "@/modules/ui";

describe("theme mode", () => {
  it("starts with the dark proof theme by default", () => {
    const theme = useThemeMode();
    theme.start();

    expect(theme.mode.value).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("proof-dark");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getSplitViewRailWidthClass } from "./SplitView.utils";

describe("SplitView", () => {
  it("maps rail width variants to layout classes", () => {
    expect(getSplitViewRailWidthClass("sm")).toBe("md:basis-64 md:max-w-64");
    expect(getSplitViewRailWidthClass("md")).toBe("md:basis-72 md:max-w-72");
    expect(getSplitViewRailWidthClass("lg")).toBe("md:basis-80 md:max-w-80");
  });

  it("declares rail and detail slots", () => {
    const source = readFileSync(resolve(process.cwd(), "src/patterns/SplitView/SplitView.vue"), "utf8");

    expect(source).toContain('<slot name="rail" />');
    expect(source).toContain("<slot />");
  });
});

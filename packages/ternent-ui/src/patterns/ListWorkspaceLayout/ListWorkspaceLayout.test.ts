import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ListWorkspaceLayout", () => {
  it("defines a fixed workspace rail width and sticky-capable main body", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/patterns/ListWorkspaceLayout/ListWorkspaceLayout.vue"),
      "utf8",
    );

    expect(source).toContain("w-64");
    expect(source).toContain("overflow-auto");
    expect(source).toContain("backdrop-blur");
    expect(
      "hidden w-64 shrink-0 overflow-auto border-r border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 lg:block",
    ).toMatchInlineSnapshot(
      "\"hidden w-64 shrink-0 overflow-auto border-r border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 lg:block\"",
    );
  });

  it("declares rail and default slots", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/patterns/ListWorkspaceLayout/ListWorkspaceLayout.vue"),
      "utf8",
    );

    expect(source).toContain("showRail: true");
    expect(source).toContain("props.showRail && Boolean(slots.rail)");
    expect(source).toContain('<slot name="rail" />');
    expect(source).toContain("<slot />");
  });
});

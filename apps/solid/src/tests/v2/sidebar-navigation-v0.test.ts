import { describe, expect, it } from "vitest";
import {
  buildSidebarNavigationSections,
  listValidRuntimeApps,
} from "@/modules/appShell/navigation";
import type { RuntimeAppDefinition } from "@/runtime/apps";

describe("sidebar navigation v0.2", () => {
  it("builds Workspace + System sections with tasks app link", () => {
    const sections = buildSidebarNavigationSections("/w/tasks/list");

    expect(sections.map((section) => section.label)).toEqual(["Workspace", "System"]);

    const appsSection = sections.find((section) => section.label === "Workspace");
    expect(appsSection).toBeTruthy();

    const tasksItem = appsSection?.items.find((item) => item.id === "app-tasks");
    expect(tasksItem?.to).toBe("/w/tasks");
    expect(tasksItem?.dataTest).toBe("nav-app-tasks");
    expect(tasksItem?.active).toBe(true);
    expect(tasksItem?.showActiveDot).toBe(true);
  });

  it("applies optional app count metadata", () => {
    const sections = buildSidebarNavigationSections("/w/tasks/list", undefined, {
      appCounts: {
        tasks: 7,
      },
    });

    const appsSection = sections.find((section) => section.label === "Workspace");
    const tasksItem = appsSection?.items.find((item) => item.id === "app-tasks");

    expect(tasksItem?.count).toBe(7);
  });

  it("does not mark app link active for unrelated routes", () => {
    const sections = buildSidebarNavigationSections("/s/permissions");
    const appsSection = sections.find((section) => section.label === "Workspace");
    const tasksItem = appsSection?.items.find((item) => item.id === "app-tasks");

    expect(tasksItem?.active).toBe(false);
  });

  it("filters invalid apps and omits Workspace section when no valid app remains", () => {
    const invalidApps: RuntimeAppDefinition[] = [
      {
        id: "broken",
        label: "Broken",
        description: "Invalid app config",
        defaultSurfaceId: "missing",
        surfaces: [
          {
            id: "list",
            label: "List",
          },
        ],
      },
    ];

    expect(listValidRuntimeApps(invalidApps)).toHaveLength(0);

    const sections = buildSidebarNavigationSections("/", invalidApps);
    expect(sections.map((section) => section.label)).toEqual(["System"]);
    expect(sections.find((section) => section.label === "Workspace")).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import {
  buildSidebarNavigationSections,
  listValidRuntimeApps,
} from "@/modules/appShell/navigation";
import type { RuntimeAppDefinition } from "@/runtime/apps";

describe("sidebar navigation v0.2", () => {
  it("builds Launch + Apps + System sections with tasks app link", () => {
    const sections = buildSidebarNavigationSections("/app/tasks/list");

    expect(sections.map((section) => section.label)).toEqual([
      "Launch",
      "Apps",
      "System",
    ]);

    const appsSection = sections.find((section) => section.label === "Apps");
    expect(appsSection).toBeTruthy();

    const tasksItem = appsSection?.items.find((item) => item.id === "app-tasks");
    expect(tasksItem?.to).toBe("/app/tasks");
    expect(tasksItem?.dataTest).toBe("nav-app-tasks");
    expect(tasksItem?.active).toBe(true);
  });

  it("does not mark app link active for unrelated routes", () => {
    const sections = buildSidebarNavigationSections("/permissions");
    const appsSection = sections.find((section) => section.label === "Apps");
    const tasksItem = appsSection?.items.find((item) => item.id === "app-tasks");

    expect(tasksItem?.active).toBe(false);
  });

  it("filters invalid apps and omits Apps section when no valid app remains", () => {
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

    const sections = buildSidebarNavigationSections("/launch", invalidApps);
    expect(sections.map((section) => section.label)).toEqual([
      "Launch",
      "System",
    ]);
    expect(sections.find((section) => section.label === "Apps")).toBeUndefined();
  });
});

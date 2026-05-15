import { describe, expect, it } from "vitest";
import {
  getRuntimeAppById,
  isSupportedRuntimeSurface,
  isRuntimeAppRegistryValid,
  listRuntimeApps,
  resolveDefaultRuntimeSurface,
  resolveRuntimeSurface,
  type RuntimeAppDefinition,
} from "@/runtime/apps";

describe("runtime app registry v0", () => {
  it("lists tasks as the only registered app", () => {
    const apps = listRuntimeApps();

    expect(apps).toHaveLength(1);
    expect(apps[0]?.id).toBe("tasks");
    expect(apps[0]?.defaultSurfaceId).toBe("list");
  });

  it("resolves known app and supports known/default surface", () => {
    const app = getRuntimeAppById("tasks");

    expect(app).toBeTruthy();
    expect(resolveRuntimeSurface(app!, "list")?.id).toBe("list");
    expect(resolveRuntimeSurface(app!, "board")?.id).toBe("board");
    expect(resolveDefaultRuntimeSurface(app!)?.id).toBe("list");
    expect(isRuntimeAppRegistryValid(app!)).toBe(true);
    expect(isSupportedRuntimeSurface(app!, "list")).toBe(true);
    expect(isSupportedRuntimeSurface(app!, "board")).toBe(true);
    expect(isSupportedRuntimeSurface(app!, undefined)).toBe(true);
  });

  it("returns null/false for unknown app or surface", () => {
    const app = getRuntimeAppById("tasks");

    expect(getRuntimeAppById("unknown")).toBeNull();
    expect(resolveRuntimeSurface(app!, "timeline")).toBeNull();
    expect(isSupportedRuntimeSurface(app!, "timeline")).toBe(false);
  });

  it("returns null default surface and invalid status for bad registry config", () => {
    const invalidApp: RuntimeAppDefinition = {
      id: "broken",
      label: "Broken",
      defaultSurfaceId: "missing",
      surfaces: [
        {
          id: "list",
          label: "List",
        },
      ],
    };

    expect(resolveDefaultRuntimeSurface(invalidApp)).toBeNull();
    expect(isRuntimeAppRegistryValid(invalidApp)).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

let mockLanguage: {
  execute: any;
};

vi.mock("@/modules/run/services", () => ({
  useRunTerminalLanguage: () => mockLanguage,
}));

vi.mock("@/modules/run/surfaces/useRunExplorerSurface", () => ({
  useRunExplorerSurface: () => ({
    currentPath: {
      value: "/private/projects",
    },
  }),
}));

async function loadSurface() {
  vi.resetModules();
  return await import("@/modules/run/surfaces/useRunTerminalSurface");
}

describe("useRunTerminalSurface", () => {
  beforeEach(() => {
    mockLanguage = {
      execute: vi.fn(async () => ({
        handled: true,
        clear: false,
        chunks: [{ kind: "output", lines: ["ok"] }],
      })),
    };
  });

  it("persists terminal draft state outside the route component", async () => {
    const { useRunTerminalSurface } = await loadSurface();
    const surface = useRunTerminalSurface();

    surface.setDraft("mkledger journal");

    expect(surface.draft.value).toBe("mkledger journal");
    expect(surface.promptPath.value).toBe("/private/projects");
  });

  it("clears the draft after a command runs and appends command/output history", async () => {
    const { useRunTerminalSurface } = await loadSurface();
    const surface = useRunTerminalSurface();

    surface.setDraft("help");
    await surface.run("help");

    expect(surface.draft.value).toBe("");
    expect(surface.history.value.at(-2)?.lines).toEqual(["$ help"]);
    expect(surface.history.value.at(-1)?.lines).toEqual(["ok"]);
  });
});

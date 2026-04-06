import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createConcordApp = vi.fn();
const saveBrowserLocalImportedLedger = vi.fn();

let mockWorkspace: any;
let mockWorkspaceActions: any;
let mockProviderRegistry: any;
let mockProjection: any;
let mockTasksRuntime: any;
let mockStorage: any;

vi.mock("@ternent/concord/browser", () => ({
  createConcordApp: (...args: unknown[]) => createConcordApp(...args),
}));

vi.mock("@/modules/run/workspace/useRunWorkspaceRuntime", () => ({
  useRunWorkspaceRuntime: () => mockWorkspace,
}));

vi.mock("@/modules/run/services/useRunWorkspaceActions", () => ({
  useRunWorkspaceActions: () => mockWorkspaceActions,
}));

vi.mock("@/modules/run/workspace", () => ({
  useRunProviderRegistry: () => mockProviderRegistry,
}));

vi.mock("@/modules/run/replay", () => ({
  useRunProjectionState: () => mockProjection,
}));

vi.mock("@/modules/run/tasks/useRunTasksRuntime", () => ({
  useRunTasksRuntime: () => mockTasksRuntime,
}));

vi.mock("@/modules/run/storage", () => ({
  useRunStorageCatalog: () => mockStorage,
}));

vi.mock("@/modules/run/storage/providers/local/useRunLocalStorageProvider", () => ({
  saveBrowserLocalImportedLedger: (...args: unknown[]) => saveBrowserLocalImportedLedger(...args),
}));

async function loadLedgerFileActions() {
  vi.resetModules();
  return await import("@/modules/run/services/useRunLedgerFileActions");
}

describe("run ledger file actions", () => {
  beforeEach(() => {
    createConcordApp.mockReset();
    saveBrowserLocalImportedLedger.mockReset();

    mockWorkspace = {
      mounts: computed(() => [
        {
          id: "local-browser",
          providerId: "browser-local",
        },
      ]),
      selection: computed(() => ({
        activeMountId: "local-browser",
      })),
      selectMount: vi.fn(async () => undefined),
    };

    mockWorkspaceActions = {
      createLedger: vi.fn(async () => ({
        ok: true,
        value: {
          entry: {
            url: "local://workspace/concord-demo-1.json",
          },
        },
      })),
      selectEntryByUrl: vi.fn(async (url: string) => ({
        ok: true,
        value: {
          entry: {
            url,
          },
        },
      })),
    };

    mockProviderRegistry = {
      getProvider: vi.fn(() => ({
        createLedgerStorageAdapter: vi.fn(async () => ({
          load: vi.fn(async () => ({
            container: {
              format: "concord-ledger",
              version: "1",
              commits: {},
              entries: {},
              head: "commit:0",
            },
            staged: [],
          })),
        })),
      })),
    };

    mockProjection = {
      activeProjection: ref({
        ledgerId: "ledger:1",
        openContext: {
          providerId: "browser-local",
          mountId: "local-browser",
          resourceUrl: "local://workspace/alpha-demo.json",
          capabilities: {
            ledgerStorage: true,
          },
        },
      }),
    };

    mockTasksRuntime = {
      app: computed(() => null),
    };

    mockStorage = {
      ledgers: computed(() => [
        {
          id: "ledger:1",
          title: "alpha-demo",
        },
      ]),
    };
  });

  it("imports a valid task ledger into browser-local storage and selects it", async () => {
    const validContainer = {
      format: "concord-ledger",
      version: "1",
      commits: {
        "commit:1": {
          commitId: "commit:1",
          parentCommitId: null,
          committedAt: "2026-03-30T00:00:00.000Z",
          metadata: null,
          entryIds: ["entry:1"],
          seal: {} as any,
        },
      },
      entries: {
        "entry:1": {
          entryId: "entry:1",
          kind: "task.item.created",
          authoredAt: "2026-03-30T00:00:00.000Z",
          author: "demo",
          meta: null,
          payload: {
            type: "plain",
            data: {},
          },
          seal: {} as any,
        },
      },
      head: "commit:1",
    };

    createConcordApp.mockResolvedValue({
      importLedger: vi.fn(async () => undefined),
      verify: vi.fn(async () => ({
        committedHistoryValid: true,
        invalidCommitIds: [],
        invalidEntryIds: [],
      })),
      exportLedger: vi.fn(async () => validContainer),
      destroy: vi.fn(async () => undefined),
    });

    saveBrowserLocalImportedLedger.mockReturnValue({
      url: "local://workspace/imported-demo.json",
    });

    const { useRunLedgerFileActions } = await loadLedgerFileActions();
    const result = await useRunLedgerFileActions().importLedgerFile(
      new File([JSON.stringify(validContainer)], "tasks-demo.json", {
        type: "application/json",
      }),
    );

    expect(result.ok).toBe(true);
    expect(saveBrowserLocalImportedLedger).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "tasks-demo.json",
        container: validContainer,
      }),
    );
    expect(mockWorkspaceActions.selectEntryByUrl).toHaveBeenCalledWith(
      "local://workspace/imported-demo.json",
    );
  });

  it("rejects invalid JSON imports", async () => {
    const { useRunLedgerFileActions } = await loadLedgerFileActions();
    const result = await useRunLedgerFileActions().importLedgerFile(
      new File(["{not-json"], "broken.json", {
        type: "application/json",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
    }
    expect(createConcordApp).not.toHaveBeenCalled();
    expect(saveBrowserLocalImportedLedger).not.toHaveBeenCalled();
  });

  it("rejects mixed or non-task ledgers during import", async () => {
    const mixedContainer = {
      format: "concord-ledger",
      version: "1",
      commits: {
        "commit:1": {
          commitId: "commit:1",
          parentCommitId: null,
          committedAt: "2026-03-30T00:00:00.000Z",
          metadata: null,
          entryIds: ["entry:1", "entry:2"],
          seal: {} as any,
        },
      },
      entries: {
        "entry:1": {
          entryId: "entry:1",
          kind: "task.item.created",
          authoredAt: "2026-03-30T00:00:00.000Z",
          author: "demo",
          meta: null,
          payload: {
            type: "plain",
            data: {},
          },
          seal: {} as any,
        },
        "entry:2": {
          entryId: "entry:2",
          kind: "other.entry",
          authoredAt: "2026-03-30T00:00:00.000Z",
          author: "demo",
          meta: null,
          payload: {
            type: "plain",
            data: {},
          },
          seal: {} as any,
        },
      },
      head: "commit:1",
    };

    createConcordApp.mockResolvedValue({
      importLedger: vi.fn(async () => undefined),
      verify: vi.fn(async () => ({
        committedHistoryValid: true,
        invalidCommitIds: [],
        invalidEntryIds: [],
      })),
      exportLedger: vi.fn(async () => mixedContainer),
      destroy: vi.fn(async () => undefined),
    });

    const { useRunLedgerFileActions } = await loadLedgerFileActions();
    const result = await useRunLedgerFileActions().importLedgerFile(
      new File([JSON.stringify(mixedContainer)], "mixed.json", {
        type: "application/json",
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Tasks currently supports ledgers whose entries belong to the task document model only.",
    });
    expect(saveBrowserLocalImportedLedger).not.toHaveBeenCalled();
  });

  it("exports the active ledger with a stable filename", async () => {
    const exportLedger = vi.fn(async () => ({
      format: "concord-ledger",
      version: "1",
      commits: {},
      entries: {},
      head: "commit:0",
    }));

    mockTasksRuntime = {
      app: computed(() => ({
        getState: () => ({
          stagedCount: 0,
        }),
        exportLedger,
      })),
    };

    const { useRunLedgerFileActions } = await loadLedgerFileActions();
    const result = await useRunLedgerFileActions().exportActiveLedger();

    expect(result).toEqual({
      ok: true,
      value: {
        filename: "alpha-demo.json",
        content: JSON.stringify(
          {
            format: "concord-ledger",
            version: "1",
            commits: {},
            entries: {},
            head: "commit:0",
          },
          null,
          2,
        ),
      },
    });
    expect(exportLedger).toHaveBeenCalledTimes(1);
  });

  it("blocks export while the active concord has staged changes", async () => {
    const exportLedger = vi.fn(async () => ({
      format: "concord-ledger",
      version: "1",
      commits: {},
      entries: {},
      head: "commit:0",
    }));

    mockTasksRuntime = {
      app: computed(() => ({
        getState: () => ({
          stagedCount: 2,
        }),
        exportLedger,
      })),
    };

    const { useRunLedgerFileActions } = await loadLedgerFileActions();
    const result = await useRunLedgerFileActions().exportActiveLedger();

    expect(result).toEqual({
      ok: false,
      error: "Commit or discard staged changes before exporting this concord.",
    });
    expect(exportLedger).not.toHaveBeenCalled();
  });
});

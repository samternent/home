import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockSource: any;
let mockStorage: any;
let mockWorkspace: any;
let mockProjection: any;
let mockActions: any;
let mockIdentity: any;
let mockTasksRuntime: any;

vi.mock("@/modules/run/workspace", () => ({
  useRunWorkspaceRuntime: () => mockSource,
  useRunWorkspaceState: () => mockWorkspace,
}));

vi.mock("@/modules/run/storage", () => ({
  useRunStorageCatalog: () => mockStorage,
}));

vi.mock("@/modules/run/identity", () => ({
  useRunIdentityService: () => mockIdentity,
}));

vi.mock("@/modules/run/replay", () => ({
  useRunProjectionState: () => mockProjection,
}));

vi.mock("@/modules/run/tasks/useRunTasksRuntime", () => ({
  useRunTasksRuntime: () => mockTasksRuntime,
}));

vi.mock("@/modules/run/services/useRunWorkspaceActions", () => ({
  useRunWorkspaceActions: () => mockActions,
}));

async function loadLanguage() {
  vi.resetModules();
  return await import("@/modules/run/services/useRunTerminalLanguage");
}

describe("useRunTerminalLanguage", () => {
  beforeEach(() => {
    mockSource = {
      currentBrowse: computed(() => ({
        url: "https://pod.example/private/",
        entries: [
          {
            url: "https://pod.example/private/projects/",
            name: "projects",
            path: "projects",
            kind: "container",
            scope: "private",
          },
          {
            url: "https://pod.example/private/journal.json",
            name: "journal.json",
            path: "journal.json",
            kind: "ledger",
            scope: "private",
          },
        ],
      })),
    };

    mockStorage = {
      mounts: computed(() => [
        {
          id: "private",
          scope: "private",
          rootUrl: "https://pod.example/private/",
        },
      ]),
      ledgers: computed(() => [
        {
          id: "ledger:journal",
          mountId: "private",
          providerId: "solid",
          title: "journal",
          path: "journal.json",
          url: "https://pod.example/private/journal.json",
          scope: "private",
        },
      ]),
    };

    mockWorkspace = {
      selection: ref({
        activeProviderId: "solid",
        activeMountId: "private",
        activeBrowseUrl: "https://pod.example/private/",
        activeScope: "private",
        activeResourceId: "https://pod.example/private/journal.json",
        activeLedgerId: "ledger:journal",
        activeLedgerIds: ["ledger:journal"],
      }),
    };

    mockIdentity = {
      activeIdentity: ref({
        id: "identity:primary",
        profile: { label: "Primary", createdAt: "2026-03-27T00:00:00.000Z" },
        identity: { keyId: "identity:primary" },
      }),
    };

    mockProjection = {
      activeProjection: ref({
        id: "projection:journal",
        readiness: {
          inspectable: true,
          interactive: true,
        },
        openContext: {
          capabilities: {
            interactive: true,
          },
        },
        verification: {
          status: "verified",
        },
        taskSupport: {
          supported: true,
          reason: null,
          classification: "task-document",
        },
      }),
    };

    mockTasksRuntime = {
      mode: ref("interactive"),
      activeLedgerId: ref("ledger:journal"),
      reason: ref(null),
      ensureReady: vi.fn(async () => true),
    };

    mockActions = {
      navigateUp: vi.fn(async () => ({
        ok: true,
        value: { url: "https://pod.example/" },
      })),
      navigateToScope: vi.fn(async () => undefined),
      resolveTarget: vi.fn(async (target: string) => {
        if (target === "projects") {
          return {
            url: "https://pod.example/private/projects/",
            name: "projects",
            path: "projects",
            kind: "container",
            scope: "private",
          };
        }

        if (target === "journal") {
          return {
            url: "https://pod.example/private/journal.json",
            name: "journal.json",
            path: "journal.json",
            kind: "ledger",
            scope: "private",
          };
        }

        return null;
      }),
      openTarget: vi.fn(async (target: string) => {
        if (target === "projects") {
          return {
            ok: true,
            value: {
              mode: "navigated",
              entry: { url: "https://pod.example/private/projects/" },
            },
          };
        }

        if (target === "journal") {
          return {
            ok: true,
            value: {
              mode: "selected",
              entry: { url: "https://pod.example/private/journal.json" },
            },
          };
        }

        return {
          ok: false,
          error: `Target not found: ${target}`,
        };
      }),
      openEntryByUrl: vi.fn(async (url: string) => ({
        ok: true,
        value: {
          mode: "navigated",
          entry: { url },
        },
      })),
      createFolder: vi.fn(async (name: string) => ({
        ok: true,
        value: {
          entry: { name },
        },
      })),
      createLedger: vi.fn(async (name: string) => ({
        ok: true,
        value: {
          entry: { name },
        },
      })),
    };
  });

  it("describes the available commands", async () => {
    const { useRunTerminalLanguage } = await loadLanguage();
    const result = await useRunTerminalLanguage().execute("help");

    expect(result.handled).toBe(true);
    expect(result.chunks[0]?.lines[0]).toContain("Commands:");
    expect(result.chunks[0]?.lines[0]).toContain("tasks");
  });

  it("lists workspace entries for ls", async () => {
    const { useRunTerminalLanguage } = await loadLanguage();
    const result = await useRunTerminalLanguage().execute("ls");

    expect(result.chunks[0]?.lines).toEqual([
      "container projects",
      "ledger    journal.json",
    ]);
  });

  it("navigates scopes and containers through workspace actions", async () => {
    const { useRunTerminalLanguage } = await loadLanguage();
    const language = useRunTerminalLanguage();

    const scopeResult = await language.execute("cd private");
    const containerResult = await language.execute("cd projects");
    const upResult = await language.execute("cd ..");

    expect(mockActions.navigateToScope).toHaveBeenCalledWith("private");
    expect(scopeResult.chunks[0]?.lines).toEqual(["Moved to private"]);
    expect(mockActions.openEntryByUrl).toHaveBeenCalledWith(
      "https://pod.example/private/projects/",
    );
    expect(containerResult.chunks[0]?.lines).toEqual([
      "Moved to https://pod.example/private/projects/",
    ]);
    expect(mockActions.navigateUp).toHaveBeenCalledTimes(1);
    expect(upResult.chunks[0]?.lines).toEqual(["Moved to https://pod.example/"]);
  });

  it("opens resources and prepares Tasks against the active projection", async () => {
    const { useRunTerminalLanguage } = await loadLanguage();
    const language = useRunTerminalLanguage();

    const openResult = await language.execute("open journal");
    const selectResult = await language.execute("select journal");
    const tasksResult = await language.execute("tasks");
    const appResult = await language.execute("app open tasks");

    expect(mockActions.openTarget).toHaveBeenCalledWith("journal");
    expect(mockActions.openTarget).toHaveBeenCalledTimes(2);
    expect(openResult.chunks[0]?.lines).toEqual([
      "Selected https://pod.example/private/journal.json",
    ]);
    expect(selectResult.chunks[0]?.lines).toEqual([
      "Selected https://pod.example/private/journal.json",
    ]);
    expect(mockTasksRuntime.ensureReady).toHaveBeenCalledTimes(2);
    expect(tasksResult.chunks[0]?.lines).toEqual([
      "Tasks ready (interactive) on ledger:journal",
    ]);
    expect(appResult.chunks[0]?.lines).toEqual([
      "Tasks ready (interactive) on ledger:journal",
    ]);
  });

  it("allows read-only tasks prepare without an active identity", async () => {
    mockIdentity.activeIdentity = ref(null);
    mockTasksRuntime.mode = ref("inspect");
    mockProjection.activeProjection = ref({
      id: "projection:journal",
      readiness: {
        inspectable: true,
        interactive: false,
      },
      openContext: {
        capabilities: {
          interactive: false,
        },
      },
      verification: {
        status: "verified",
      },
      taskSupport: {
        supported: true,
        reason: null,
        classification: "task-document",
      },
    });

    const { useRunTerminalLanguage } = await loadLanguage();
    const result = await useRunTerminalLanguage().execute("tasks");

    expect(result.chunks[0]?.lines).toEqual([
      "Tasks ready (inspect) on ledger:journal",
    ]);
  });

  it("reports status and supports clear and unknown commands", async () => {
    const { useRunTerminalLanguage } = await loadLanguage();
    const language = useRunTerminalLanguage();

    const statusResult = await language.execute("status");
    const clearResult = await language.execute("clear");
    const unknownResult = await language.execute("wat");

    expect(statusResult.chunks[0]?.lines).toEqual([
      "identity: Primary",
      "scope: private",
      "mount: private",
      "selection: https://pod.example/private/journal.json",
      "projection: projection:journal",
      "inspectable: yes",
      "verification: verified",
      "interactive: yes",
      "tasks: interactive",
    ]);
    expect(clearResult.clear).toBe(true);
    expect(unknownResult.chunks[0]?.lines).toEqual(["Unknown command: wat"]);
  });

  it("creates folders and ledgers through workspace actions", async () => {
    const { useRunTerminalLanguage } = await loadLanguage();
    const language = useRunTerminalLanguage();

    const folderResult = await language.execute("mkdir notes");
    const ledgerResult = await language.execute("mkledger journal");

    expect(mockActions.createFolder).toHaveBeenCalledWith("notes");
    expect(folderResult.chunks[0]?.lines).toEqual(["Created folder notes"]);
    expect(mockActions.createLedger).toHaveBeenCalledWith("journal");
    expect(ledgerResult.chunks[0]?.lines).toEqual(["Created ledger journal"]);
  });

  it("returns explicit usage and failure errors for invalid commands", async () => {
    mockActions.navigateUp = vi.fn(async () => ({
      ok: false,
      error: "Already at the workspace root for this scope.",
    }));
    mockActions.createFolder = vi.fn(async () => ({
      ok: false,
      error: "Folder could not be created.",
    }));
    mockTasksRuntime.ensureReady = vi.fn(async () => false);
    mockTasksRuntime.reason = ref("Tasks is not ready for the current projection.");

    const { useRunTerminalLanguage } = await loadLanguage();
    const language = useRunTerminalLanguage();

    const missingCd = await language.execute("cd");
    const wrongCd = await language.execute("cd journal");
    const missingOpen = await language.execute("open");
    const failingUp = await language.execute("cd ..");
    const failingFolder = await language.execute("mkdir notes");
    const failingApp = await language.execute("app open");

    expect(missingCd.chunks[0]?.lines).toEqual([
      "Usage: cd <private|shared|public|..|path>",
    ]);
    expect(wrongCd.chunks[0]?.lines).toEqual([
      "Target is not a container: journal",
    ]);
    expect(missingOpen.chunks[0]?.lines).toEqual(["Usage: open <resource>"]);
    expect(failingUp.chunks[0]?.lines).toEqual([
      "Already at the workspace root for this scope.",
    ]);
    expect(failingFolder.chunks[0]?.lines).toEqual([
      "Folder could not be created.",
    ]);
    expect(failingApp.chunks[0]?.lines).toEqual([
      "Tasks is not ready for the current projection.",
    ]);
  });

  it("allows browsing and tasks inspection without an active identity while signed writes stay blocked", async () => {
    mockIdentity.activeIdentity = ref(null);
    mockTasksRuntime.mode = ref("inspect");

    const { useRunTerminalLanguage } = await loadLanguage();
    const language = useRunTerminalLanguage();

    const listResult = await language.execute("ls");
    const ledgerResult = await language.execute("mkledger journal");
    const tasksResult = await language.execute("tasks");

    expect(listResult.chunks[0]?.lines).toEqual([
      "container projects",
      "ledger    journal.json",
    ]);
    expect(ledgerResult.chunks[0]?.lines).toEqual([
      "Set an identity before creating a ledger.",
    ]);
    expect(tasksResult.chunks[0]?.lines).toEqual([
      "Tasks ready (inspect) on ledger:journal",
    ]);
  });
});

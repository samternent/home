import { nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createIdentity } from "@ternent/identity";
import { createEmptyTaskProjection } from "@/modules/run/tasks/state";
import type { TaskProjection } from "@/modules/run/tasks/types";

const createConcordApp = vi.fn();

let mockIdentity: any;
let mockProjection: any;
let mockProviderRegistry: any;
let mockWorkspaceActions: any;
let primaryIdentityRecord: any;
let secondaryIdentityRecord: any;
let mockApps: MockConcordApp[];

type MockConcordApp = {
  input: unknown;
  load: ReturnType<typeof vi.fn>;
  getState: ReturnType<typeof vi.fn>;
  getReplayState: ReturnType<typeof vi.fn>;
  command: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  setReplayState(nextReplay: TaskProjection): void;
};

vi.mock("@ternent/concord/browser", () => ({
  createConcordApp: (...args: unknown[]) => createConcordApp(...args),
}));

vi.mock("@/modules/run/identity", () => ({
  useRunIdentityService: () => mockIdentity,
}));

vi.mock("@/modules/run/replay", () => ({
  useRunProjectionState: () => mockProjection,
}));

vi.mock("@/modules/run/workspace", () => ({
  useRunProviderRegistry: () => mockProviderRegistry,
}));

vi.mock("@/modules/run/services/useRunWorkspaceActions", () => ({
  useRunWorkspaceActions: () => mockWorkspaceActions,
}));

async function loadRuntime() {
  vi.resetModules();
  return await import("@/modules/run/tasks/useRunTasksRuntime");
}

function createReplayProjection(
  overrides: Partial<TaskProjection> = {},
): TaskProjection {
  return {
    ...createEmptyTaskProjection(),
    ...overrides,
  };
}

function createConcordState(replay: TaskProjection = createReplayProjection()) {
  return {
    ready: true,
    integrityValid: true,
    stagedCount: 0,
    replay: {
      tasks: replay,
    },
    verification: null,
  };
}

function createMockApp(
  input: unknown,
  options?: {
    initialReplay?: TaskProjection;
    loadPromise?: Promise<void>;
  },
): MockConcordApp {
  let state = createConcordState(options?.initialReplay);
  let listener: ((state: unknown) => void) | null = null;

  return {
    input,
    load: vi.fn(async () => {
      await options?.loadPromise;
    }),
    getState: vi.fn(() => state),
    getReplayState: vi.fn(() => state.replay.tasks),
    command: vi.fn(async () => ({
      entryIds: ["entry:1"],
      stagedCount: 1,
    })),
    subscribe: vi.fn((nextListener) => {
      listener = nextListener;
      return () => {
        if (listener === nextListener) {
          listener = null;
        }
      };
    }),
    destroy: vi.fn(async () => undefined),
    setReplayState(nextReplay) {
      state = createConcordState(nextReplay);
      listener?.(state);
    },
  };
}

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve;
  });

  return {
    promise,
    resolve,
  };
}

describe("useRunTasksRuntime", () => {
  beforeEach(async () => {
    mockApps = [];
    createConcordApp.mockReset();
    createConcordApp.mockImplementation(async (input?: unknown) => {
      const app = createMockApp(input);
      mockApps.push(app);
      return app;
    });

    const activeIdentity = await createIdentity("2026-03-28T00:00:00.000Z");
    const secondaryIdentity = await createIdentity("2026-03-28T00:01:00.000Z");
    primaryIdentityRecord = {
      id: activeIdentity.keyId,
      identity: activeIdentity,
      profile: {
        label: "Sam Ternent",
      },
    };
    secondaryIdentityRecord = {
      id: secondaryIdentity.keyId,
      identity: secondaryIdentity,
      profile: {
        label: "Alex Demo",
      },
    };

    mockIdentity = {
      activeIdentity: ref(primaryIdentityRecord),
    };

    mockProjection = {
      activeProjection: ref({
        id: "projection:1",
        ledgerId: "ledger:1",
        status: "ready",
        candidate: {
          resourceUrl: "https://pod.example/private/tasks.json",
        },
        openContext: {
          providerId: "local",
          mountId: "private",
          resourceUrl: "https://pod.example/private/tasks.json",
          capabilities: {
            ledgerStorage: true,
            hostableApp: true,
            interactive: true,
          },
        },
        replay: {
          headCommitId: "commit:1",
        },
        readiness: {
          inspectable: true,
          interactive: true,
        },
        verification: {
          status: "verified",
          summary: "Verified task document",
        },
        taskSupport: {
          supported: true,
          reason: null,
          classification: "empty",
        },
      }),
    };

    mockProviderRegistry = {
      getProvider: vi.fn(() => ({
        createLedgerStorageAdapter: vi.fn(async () => ({ load: vi.fn() })),
      })),
    };

    mockWorkspaceActions = {
      selectEntryByUrl: vi.fn(async () => ({
        ok: true,
        value: {
          entry: { url: "https://pod.example/private/tasks.json" },
        },
      })),
    };
  });

  it("builds an empty task projection for a verified ledger", async () => {
    const { useRunTasksRuntime } = await loadRuntime();
    const runtime = useRunTasksRuntime();

    await runtime.ensureReady();
    await nextTick();
    await Promise.resolve();

    expect(runtime.mode.value).toBe("interactive");
    expect(runtime.ready.value).toBe(true);
    expect(runtime.projection.value.orderedTaskIds).toEqual([]);
    expect(createConcordApp).toHaveBeenCalledWith(
      expect.objectContaining({
        identity: mockIdentity.activeIdentity.value.identity,
      }),
    );
    expect(mockApps[0]?.command).not.toHaveBeenCalled();
  });

  it("reports unavailable mode when the active projection is not task-compatible", async () => {
    mockProjection.activeProjection.value.taskSupport = {
      supported: false,
      reason: "Tasks currently supports ledgers whose entries belong to the task document model only.",
      classification: "mixed",
    };

    const { useRunTasksRuntime } = await loadRuntime();
    const runtime = useRunTasksRuntime();

    await runtime.ensureReady();

    expect(runtime.mode.value).toBe("unavailable");
    expect(runtime.reason.value).toBe("Tasks currently supports ledgers whose entries belong to the task document model only.");
    expect(createConcordApp).not.toHaveBeenCalled();
  });

  it("supports inspect mode without an active identity", async () => {
    mockIdentity.activeIdentity = ref(null);
    mockProjection.activeProjection.value.readiness.interactive = false;
    mockProjection.activeProjection.value.openContext.capabilities.interactive = false;

    const { useRunTasksRuntime } = await loadRuntime();
    const runtime = useRunTasksRuntime();

    await runtime.ensureReady();

    expect(runtime.mode.value).toBe("inspect");
    expect(createConcordApp).toHaveBeenCalledWith(
      expect.objectContaining({
        identity: undefined,
      }),
    );
    expect(mockApps[0]?.command).not.toHaveBeenCalled();
  });

  it("opens tasks for a specific ledger through one shared action", async () => {
    const { useRunTasksRuntime } = await loadRuntime();
    const runtime = useRunTasksRuntime();

    const result = await runtime.openTasksForLedger("https://pod.example/private/tasks.json");

    expect(result).toBe(true);
    expect(mockWorkspaceActions.selectEntryByUrl).toHaveBeenCalledWith(
      "https://pod.example/private/tasks.json",
    );
  });

  it("updates the exposed task projection from subscribed Concord state", async () => {
    const { useRunTasksRuntime } = await loadRuntime();
    const runtime = useRunTasksRuntime();

    await runtime.ensureReady();

    mockApps[0]?.setReplayState(
      createReplayProjection({
        tasksById: {
          "task:1": {
            taskId: "task:1",
            taskListId: null,
            title: "Ship replay",
            notes: null,
            status: "backlog",
            priority: "normal",
            area: "Core",
            assignee: "Sam",
            assigneeId: null,
            permissionId: null,
            tags: ["Replay"],
            dueAt: null,
            createdAt: "2026-03-28T00:00:00.000Z",
            updatedAt: "2026-03-28T00:00:00.000Z",
          },
        },
        orderedTaskIds: ["task:1"],
        listsByStatus: {
          backlog: ["task:1"],
          active: [],
          blocked: [],
          done: [],
        },
        countsByStatus: {
          backlog: 1,
          active: 0,
          blocked: 0,
          done: 0,
        },
      }),
    );

    expect(runtime.projection.value.orderedTaskIds).toEqual(["task:1"]);
    expect(runtime.projection.value.tasksById["task:1"]?.title).toBe("Ship replay");
  });

  it("replays from a fresh app when switching back to a previously seen identity", async () => {
    const { useRunTasksRuntime } = await loadRuntime();
    const runtime = useRunTasksRuntime();

    await runtime.ensureReady();
    expect(createConcordApp).toHaveBeenCalledTimes(1);

    mockIdentity.activeIdentity.value = secondaryIdentityRecord;
    await runtime.ensureReady();
    expect(createConcordApp).toHaveBeenCalledTimes(2);

    mockIdentity.activeIdentity.value = primaryIdentityRecord;
    await runtime.ensureReady();
    expect(createConcordApp).toHaveBeenCalledTimes(3);
    expect(runtime.transition.value).toBe("idle");
  });

  it("keeps the previous snapshot visible while a same-ledger identity switch is loading", async () => {
    const { useRunTasksRuntime } = await loadRuntime();
    const runtime = useRunTasksRuntime();

    await runtime.ensureReady();
    mockApps[0]?.setReplayState(
      createReplayProjection({
        tasksById: {
          "task:1": {
            taskId: "task:1",
            taskListId: null,
            title: "Cached task",
            notes: null,
            status: "backlog",
            priority: "normal",
            area: null,
            assignee: null,
            assigneeId: null,
            permissionId: null,
            tags: [],
            dueAt: null,
            createdAt: "2026-03-28T00:00:00.000Z",
            updatedAt: "2026-03-28T00:00:00.000Z",
          },
        },
        orderedTaskIds: ["task:1"],
        listsByStatus: {
          backlog: ["task:1"],
          active: [],
          blocked: [],
          done: [],
        },
        countsByStatus: {
          backlog: 1,
          active: 0,
          blocked: 0,
          done: 0,
        },
      }),
    );

    const deferredLoad = createDeferred();
    createConcordApp.mockImplementationOnce(async (input?: unknown) => {
      const app = createMockApp(input, {
        loadPromise: deferredLoad.promise,
      });
      mockApps.push(app);
      return app;
    });

    mockIdentity.activeIdentity.value = secondaryIdentityRecord;
    const switchPromise = runtime.ensureReady();

    await nextTick();

    expect(runtime.transition.value).toBe("switching-identity");
    expect(runtime.projection.value.tasksById["task:1"]?.title).toBe("Cached task");

    deferredLoad.resolve();
    await switchPromise;

    expect(runtime.transition.value).toBe("idle");
  });
});

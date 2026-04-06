import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockSolidSession: any;
let mockIdentity: any;
let mockStorage: any;
let mockWorkspaceRuntime: any;
let mockWorkspaceState: any;
let mockProjection: any;
let mockTasksRuntime: any;
let mockExplorer: any;
let mockTerminal: any;

vi.mock("@/modules/solid-session", () => ({
  useSolidSession: () => mockSolidSession,
}));

vi.mock("@/modules/run/identity", () => ({
  useRunIdentityService: () => mockIdentity,
}));

vi.mock("@/modules/run/storage", () => ({
  useRunStorageCatalog: () => mockStorage,
}));

vi.mock("@/modules/run/workspace", () => ({
  useRunWorkspaceRuntime: () => mockWorkspaceRuntime,
  useRunWorkspaceState: () => mockWorkspaceState,
}));

vi.mock("@/modules/run/replay", () => ({
  useRunProjectionState: () => mockProjection,
}));

vi.mock("@/modules/run/tasks/useRunTasksRuntime", () => ({
  useRunTasksRuntime: () => mockTasksRuntime,
}));

vi.mock("@/modules/run/surfaces", () => ({
  useRunExplorerSurface: () => mockExplorer,
  useRunTerminalSurface: () => mockTerminal,
}));

async function loadRuntime() {
  vi.resetModules();
  return await import("@/modules/run/core/useRunCoreRuntime");
}

describe("run core runtime", () => {
  beforeEach(() => {
    const activeIdentity = {
      id: "identity:one",
      profile: { label: "Primary", createdAt: "2026-03-27T00:00:00.000Z" },
      identity: { keyId: "identity:one" },
    };
    const secondaryIdentity = {
      id: "identity:two",
      profile: { label: "Secondary", createdAt: "2026-03-27T00:00:00.000Z" },
      identity: { keyId: "identity:two" },
    };

    mockSolidSession = {
      isAuthenticated: ref(false),
      status: ref("anonymous"),
      issuer: ref("https://login.inrupt.com"),
      providers: ["https://login.inrupt.com"],
      webId: ref(null),
      error: ref(null),
      async login() {
        return;
      },
      async logout() {
        return;
      },
      setIssuer: vi.fn(),
    };

    mockIdentity = {
      status: ref("ready"),
      error: ref(null),
      identities: ref([activeIdentity, secondaryIdentity]),
      activeIdentityId: ref(activeIdentity.id),
      activeIdentity: ref(activeIdentity),
      bootstrapCandidates: ref([]),
      init: vi.fn(async () => undefined),
      createMnemonicIdentity: vi.fn(),
      importMnemonic: vi.fn(),
      importSerializedIdentity: vi.fn(),
      setActiveIdentity: vi.fn(async () => secondaryIdentity),
      removeIdentity: vi.fn(async () => undefined),
      exportIdentity: vi.fn(async () => "{\"keyId\":\"identity:one\"}"),
      syncIdentityToProvider: vi.fn(async () => undefined),
      adoptBootstrapCandidate: vi.fn(async () => activeIdentity),
      refreshBootstrapCandidates: vi.fn(async () => undefined),
    };

    mockStorage = {
      mounts: computed(() => []),
      resources: computed(() => []),
      ledgers: computed(() => []),
    };

    mockWorkspaceRuntime = {
      status: ref("ready"),
      providers: computed(() => []),
      mounts: computed(() => []),
      hasBrowsableMounts: ref(true),
      reset: vi.fn(async () => undefined),
      init: vi.fn(async () => undefined),
    };

    mockWorkspaceState = {
      selection: ref({
        activeProviderId: null,
        activeMountId: null,
        activeBrowseUrl: null,
        activeResourceId: null,
        activeLedgerId: null,
        activeLedgerIds: [],
        activeScope: null,
      }),
      selectScope: vi.fn(async () => undefined),
      selectLedger: vi.fn(async () => undefined),
    };

    mockProjection = {
      activeProjection: ref({
        id: null,
        ledgerId: null,
        readiness: {
          inspectable: false,
          interactive: false,
        },
        openContext: null,
        verification: { status: "unknown", summary: "No active projection." },
        taskSupport: {
          supported: false,
          reason: "Open a ledger to view Tasks.",
          classification: "unsupported",
        },
      }),
    };

    mockTasksRuntime = {
      mode: ref("unavailable"),
      status: ref("idle"),
      reset: vi.fn(async () => undefined),
    };

    mockExplorer = { currentUrl: ref(null) };
    mockTerminal = { history: ref([]) };
  });

  it("keeps browsing and terminal access available without identity", async () => {
    mockIdentity.status = ref("missing");
    mockIdentity.activeIdentity = ref(null);
    mockWorkspaceRuntime.hasBrowsableMounts = ref(true);

    const { useRunCoreRuntime } = await loadRuntime();
    const runtime = useRunCoreRuntime();

    const explorer = runtime.surfaces.available.value.find((surface) => surface.id === "explorer");
    const terminal = runtime.surfaces.available.value.find((surface) => surface.id === "terminal");

    expect(runtime.identity.ready.value).toBe(false);
    expect(runtime.surfaces.active.value).toBe("explorer");
    expect(explorer?.available).toBe(true);
    expect(terminal?.available).toBe(true);
  });

  it("switches identity through the core service without resetting workspace state", async () => {
    const { useRunCoreRuntime } = await loadRuntime();
    const runtime = useRunCoreRuntime();

    const result = await runtime.identity.switchIdentity("identity:two");

    expect(mockTasksRuntime.reset).not.toHaveBeenCalled();
    expect(mockWorkspaceRuntime.reset).not.toHaveBeenCalled();
    expect(mockIdentity.setActiveIdentity).toHaveBeenCalledWith("identity:two");
    expect(result.profile.label).toBe("Secondary");
  });
});

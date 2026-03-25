import { computed, ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteApp from "@/routes/app/RouteApp.vue";

const mockState = {
  status: ref<"idle" | "restoring" | "ready" | "redirecting" | "error">("ready"),
  isAuthenticated: ref(false),
  webId: ref<string | null>(null),
  issuer: ref("https://login.inrupt.com"),
  error: ref<string | null>(null),
};

const login = vi.fn(async () => undefined);
const logout = vi.fn(async () => undefined);
const setIssuer = vi.fn((next: string) => {
  mockState.issuer.value = next;
});
const runtimeInit = vi.fn(async () => undefined);
const selectScope = vi.fn(async () => undefined);
const selectLedger = vi.fn(async () => undefined);
const openApp = vi.fn(async () => true);
const closeApp = vi.fn(async () => undefined);
const explorerOpenItem = vi.fn(async () => true);
const explorerGoUp = vi.fn(async () => true);
const terminalRun = vi.fn(async () => true);

const mockRuntime = {
  bootStatus: ref<"booting" | "ready" | "error">("ready"),
  authStatus: ref<"anonymous" | "authenticating" | "authenticated" | "error">("anonymous"),
  identityStatus: ref<"unresolved" | "resolving" | "verified" | "error">("verified"),
  verificationMode: ref<"strict">("strict"),
  facts: ref([
    { label: "Solid session", value: "https://alice.example/profile/card#me" },
    { label: "Concord identity", value: "Ready" },
    { label: "Verification", value: "Strict verification runtime" },
    { label: "Selected pod", value: "https://pod.example/" },
  ]),
  summaryLines: ref([
    "boot ready",
    "auth authenticated",
    "identity verified",
    "mounts 3",
    "resources 12",
    "ledgers 4",
    "active selection none",
    "host status idle",
    "active projection none",
  ]),
  mounts: ref([
    { id: "private", label: "Private", scope: "private", rootUrl: "https://pod.example/private/", writable: true },
    { id: "shared", label: "Shared", scope: "shared", rootUrl: "https://pod.example/shared/", writable: true },
    { id: "public", label: "Public", scope: "public", rootUrl: "https://pod.example/public/", writable: true },
  ]),
  ledgers: ref([
    { id: "https://pod.example/private/a.json", resourceId: "https://pod.example/private/a.json", title: "alpha", url: "https://pod.example/private/a.json", path: "a.json", scope: "private", verificationStatus: "verified" },
    { id: "https://pod.example/private/b.json", resourceId: "https://pod.example/private/b.json", title: "beta", url: "https://pod.example/private/b.json", path: "b.json", scope: "private", verificationStatus: "verified" },
  ]),
  selection: ref({
    activeResourceId: null,
    activeLedgerId: null,
    activeLedgerIds: [],
    activeScope: "private",
  }),
  activeProjection: ref({
    id: null,
    ledgerId: null,
    status: "idle",
    inputs: null,
    openContext: null,
    provenance: {
      source: "none",
      includedCommitIds: [],
      excludedCommitIds: [],
    },
    verification: {
      status: "unknown",
      summary: "No active projection.",
    },
  }),
  surfaces: ref([
    { id: "core", label: "Core", available: true, active: true, reason: null },
    { id: "explorer", label: "Explorer", available: true, active: false, reason: null },
    { id: "terminal", label: "Terminal", available: true, active: false, reason: null },
    { id: "concord-host", label: "Concord Host", available: false, active: false, reason: "Select a compatible ledger." },
    { id: "identity", label: "Identity", available: true, active: false, reason: null },
  ]),
  activeSurface: ref<"core" | "explorer" | "terminal" | "concord-host" | "identity" | null>("explorer"),
  activeApp: ref<{ appId: string; ledgerId: string; projectionId: string | null } | null>(null),
  explorer: {
    currentUrl: ref("https://pod.example/private/"),
    currentPath: ref("/private"),
    parentUrl: ref(null),
    canGoUp: ref(false),
    items: ref([
      { id: "https://pod.example/private/projects/", url: "https://pod.example/private/projects/", name: "projects", title: "projects", kind: "container", scope: "private", active: false },
      { id: "https://pod.example/private/a.json", url: "https://pod.example/private/a.json", name: "a.json", title: "alpha", kind: "ledger", scope: "private", active: false },
    ]),
  },
  terminalHistory: ref([
    { id: "terminal:1", kind: "output", lines: ["Verified workspace terminal ready."] },
  ]),
};

vi.mock("@/modules/run/core", () => ({
  useRunCoreRuntime: () => ({
    boot: {
      status: computed(() => mockRuntime.bootStatus.value),
      ready: computed(() => mockRuntime.bootStatus.value === "ready"),
    },
    auth: {
      isAuthenticated: computed(() => mockState.isAuthenticated.value),
      status: computed(() => mockRuntime.authStatus.value),
      issuer: computed(() => mockState.issuer.value),
      providers: ["https://login.inrupt.com", "https://solidcommunity.net"],
      webId: computed(() => mockState.webId.value),
      error: computed(() => mockState.error.value),
      login,
      logout,
      setIssuer,
    },
    identity: {
      status: computed(() => mockRuntime.identityStatus.value),
      ready: computed(() => mockRuntime.identityStatus.value === "verified"),
      verificationMode: computed(() => mockRuntime.verificationMode.value),
    },
    workspace: {
      mounts: computed(() => mockRuntime.mounts.value),
      resources: computed(() => []),
      ledgers: computed(() => mockRuntime.ledgers.value),
      selection: computed(() => mockRuntime.selection.value),
      activeProjection: computed(() => mockRuntime.activeProjection.value),
    },
    surfaces: {
      available: computed(() => mockRuntime.surfaces.value),
      active: computed(() => mockRuntime.activeSurface.value),
    },
    apps: {
      active: computed(() => mockRuntime.activeApp.value),
    },
    diagnostics: {
      facts: computed(() => mockRuntime.facts.value),
      summaryLines: computed(() => mockRuntime.summaryLines.value),
    },
    explorer: {
      currentUrl: computed(() => mockRuntime.explorer.currentUrl.value),
      currentPath: computed(() => mockRuntime.explorer.currentPath.value),
      parentUrl: computed(() => mockRuntime.explorer.parentUrl.value),
      canGoUp: computed(() => mockRuntime.explorer.canGoUp.value),
      items: computed(() => mockRuntime.explorer.items.value),
      openItem: explorerOpenItem,
      goUp: explorerGoUp,
      createFolder: vi.fn(async () => true),
      createLedger: vi.fn(async () => true),
    },
    terminal: {
      history: computed(() => mockRuntime.terminalHistory.value),
      run: terminalRun,
      clear: vi.fn(),
    },
    actions: {
      selectScope,
      selectLedger,
      openApp,
      closeApp,
    },
    init: runtimeInit,
  }),
}));

function createWrapper() {
  return mount(RouteApp, {
    global: {
      stubs: {
      },
    },
  });
}

describe("RouteApp", () => {
  beforeEach(() => {
    mockState.status.value = "ready";
    mockState.isAuthenticated.value = false;
    mockState.webId.value = null;
    mockState.issuer.value = "https://login.inrupt.com";
    mockState.error.value = null;
    mockRuntime.bootStatus.value = "ready";
    mockRuntime.authStatus.value = "anonymous";
    mockRuntime.identityStatus.value = "verified";
    mockRuntime.surfaces.value = [
      { id: "core", label: "Core", available: true, active: true, reason: null },
      { id: "explorer", label: "Explorer", available: true, active: false, reason: null },
      { id: "terminal", label: "Terminal", available: true, active: false, reason: null },
      { id: "concord-host", label: "Concord Host", available: false, active: false, reason: "Select a compatible ledger." },
      { id: "identity", label: "Identity", available: true, active: false, reason: null },
    ];
    mockRuntime.activeSurface.value = "explorer";
    mockRuntime.activeApp.value = null;
    login.mockClear();
    logout.mockClear();
    setIssuer.mockClear();
    runtimeInit.mockClear();
    selectScope.mockClear();
    selectLedger.mockClear();
    openApp.mockClear();
    closeApp.mockClear();
    explorerOpenItem.mockClear();
    explorerGoUp.mockClear();
    terminalRun.mockClear();
  });

  it("renders an inline Solid login gate for unauthenticated users", async () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Sign in with Solid");
    expect(wrapper.text()).toContain("Continue with Solid");
    expect(wrapper.text()).toContain("login.inrupt.com");
    expect(wrapper.text()).not.toContain("Workspace Core");

    await wrapper.get('input[aria-label="OIDC issuer"]').setValue("https://solidcommunity.net");
    expect(setIssuer).toHaveBeenCalledWith("https://solidcommunity.net");

    const providerButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text().includes("solidcommunity.net"));

    expect(providerButton).toBeTruthy();
    await providerButton!.trigger("click");
    expect(setIssuer).toHaveBeenCalledWith("https://solidcommunity.net");

    const loginButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text().includes("Continue with Solid"));

    expect(loginButton).toBeTruthy();
    await loginButton!.trigger("click");
    expect(login).toHaveBeenCalledTimes(1);
  });

  it("renders the authenticated workspace core when Solid session is present", () => {
    mockState.isAuthenticated.value = true;
    mockState.webId.value = "https://alice.example/profile/card#me";
    mockRuntime.authStatus.value = "authenticated";

    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Workspace Core");
    expect(wrapper.text()).toContain("strict");
    expect(wrapper.text()).toContain("Multiple ledgers in one verified workspace. One active projection at a time.");
    expect(wrapper.text()).toContain("Current core signals");
    expect(wrapper.text()).toContain("Explorer");
    expect(wrapper.text()).toContain("Terminal");
    expect(wrapper.text()).toContain("Command-driven workspace control");
    expect(wrapper.text()).toContain("projects");
    expect(wrapper.text()).toContain("App context");
    expect(wrapper.text()).toContain("Identity");
    expect(wrapper.text()).toContain("Private");
    expect(wrapper.text()).toContain("alpha");
    expect(wrapper.text()).toContain("beta");
    expect(wrapper.text()).toContain("Open app");
    expect(wrapper.text()).toContain("Close app");
    expect(wrapper.text()).toContain("Log out");
    expect(wrapper.text()).toContain("boot ready");
    expect(wrapper.text()).toContain("ledgers 4");
    expect(runtimeInit).toHaveBeenCalledTimes(1);
  });

  it("routes scope, explorer, and ledger selection through runtime actions", async () => {
    mockState.isAuthenticated.value = true;
    mockState.webId.value = "https://alice.example/profile/card#me";
    mockRuntime.authStatus.value = "authenticated";

    const wrapper = createWrapper();

    const sharedButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text().trim() === "Shared");

    expect(sharedButton).toBeTruthy();

    await sharedButton!.trigger("click");
    await wrapper.get('button[aria-label="Open explorer item projects"]').trigger("click");
    await wrapper.get('button[aria-label="Select ledger alpha"]').trigger("click");

    expect(selectScope).toHaveBeenCalledWith("shared");
    expect(explorerOpenItem).toHaveBeenCalledWith("https://pod.example/private/projects/");
    expect(selectLedger).toHaveBeenCalledWith("https://pod.example/private/a.json");
  });

  it("routes terminal command execution through the runtime surface", async () => {
    mockState.isAuthenticated.value = true;
    mockState.webId.value = "https://alice.example/profile/card#me";
    mockRuntime.authStatus.value = "authenticated";

    const wrapper = createWrapper();

    await wrapper.get('input[aria-label="Terminal command"]').setValue("ls");
    await wrapper.get("form").trigger("submit");

    expect(terminalRun).toHaveBeenCalledWith("ls");
  });

  it("routes app opening through runtime actions", async () => {
    mockState.isAuthenticated.value = true;
    mockState.webId.value = "https://alice.example/profile/card#me";
    mockRuntime.authStatus.value = "authenticated";
    mockRuntime.surfaces.value = [
      { id: "core", label: "Core", available: true, active: true, reason: null },
      { id: "explorer", label: "Explorer", available: true, active: false, reason: null },
      { id: "terminal", label: "Terminal", available: true, active: false, reason: null },
      { id: "concord-host", label: "Concord Host", available: true, active: false, reason: null },
      { id: "identity", label: "Identity", available: true, active: false, reason: null },
    ];

    const wrapper = createWrapper();

    const activateButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text().trim() === "Open app");

    expect(activateButton).toBeTruthy();
    await activateButton!.trigger("click");

    expect(openApp).toHaveBeenCalledTimes(1);
  });
});

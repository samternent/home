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
const workspaceInit = vi.fn(async () => undefined);
const toggleSidebar = vi.fn(() => undefined);
const toggleConsole = vi.fn(() => undefined);

const mockWorkspace = {
  status: ref<"idle" | "loading" | "ready" | "error">("ready"),
  currentScope: ref<"private" | "shared" | "public">("private"),
  currentTargetUrl: ref<string | null>("https://pod.example/concord/workspace/private/"),
};
const mockAccount = {
  selectedPod: ref("https://pod.example/"),
};
const mockUi = {
  sidebarCollapsed: ref(false),
  consoleOpen: ref(true),
  inspectorOpen: ref(true),
};
const mockHost = {
  activeAppLabel: ref<string | null>(null),
  activeTarget: ref<{ url: string; title: string } | null>(null),
  error: ref<string | null>(null),
  tabs: ref(
    [] as Array<{
      id: string;
      label: string;
      appId: string;
      appLabel: string;
      target: { title: string; url: string };
    }>,
  ),
  activeTabId: ref<string | null>(null),
};
const mockLibrary = {
  selectedItem: ref(
    null as null | {
      kind: string;
      title: string;
      modifiedLabel?: string;
      capabilities?: Array<{ id: string; label: string; description: string; status: string }>;
    },
  ),
};
const mockTodoWorkingCopy = {
  items: ref([] as Array<{ completed: boolean }>),
  stagedCount: ref(0),
  saving: ref(false),
  pendingTransactions: ref([] as Array<{ id: string; message: string; stagedCount: number }>),
  commitMessage: ref(""),
  error: ref<string | null>(null),
  lastAction: ref<string | null>(null),
  setCommitMessage: vi.fn(() => undefined),
  commitPending: vi.fn(async () => true),
};

vi.mock("@/modules/solid-session", () => ({
  useSolidSession: () => ({
    session: computed(() => null),
    status: computed(() => mockState.status.value),
    isAuthenticated: computed(() => mockState.isAuthenticated.value),
    webId: computed(() => mockState.webId.value),
    issuer: computed(() => mockState.issuer.value),
    error: computed(() => mockState.error.value),
    providers: ["https://login.inrupt.com", "https://solidcommunity.net"],
    setIssuer,
    login,
    logout,
    restore: vi.fn(async () => undefined),
    completeRedirect: vi.fn(async () => undefined),
  }),
}));

vi.mock("@/modules/concord-os", () => ({
  useConcordOsCore: () => ({
    status: computed(() => mockWorkspace.status.value),
    selectedPod: computed(() => mockAccount.selectedPod.value),
    currentScope: computed(() => mockWorkspace.currentScope.value),
    currentTargetUrl: computed(() => mockWorkspace.currentTargetUrl.value),
    selectedEntry: computed(() => null),
    init: workspaceInit,
  }),
  useConcordOsAppHost: () => ({
    activeAppLabel: computed(() => mockHost.activeAppLabel.value),
    activeTarget: computed(() => mockHost.activeTarget.value),
    error: computed(() => mockHost.error.value),
    tabs: computed(() => mockHost.tabs.value),
    activeTabId: computed(() => mockHost.activeTabId.value),
    openChooser: vi.fn(),
    activateTab: vi.fn(),
    closeTab: vi.fn(),
  }),
  useConcordOsLibrary: () => ({
    selectedItem: computed(() => mockLibrary.selectedItem.value),
  }),
  useConcordTodoWorkingCopy: () => ({
    items: computed(() => mockTodoWorkingCopy.items.value),
    stagedCount: computed(() => mockTodoWorkingCopy.stagedCount.value),
    saving: computed(() => mockTodoWorkingCopy.saving.value),
    pendingTransactions: computed(() => mockTodoWorkingCopy.pendingTransactions.value),
    commitMessage: computed(() => mockTodoWorkingCopy.commitMessage.value),
    error: computed(() => mockTodoWorkingCopy.error.value),
    lastAction: computed(() => mockTodoWorkingCopy.lastAction.value),
    setCommitMessage: mockTodoWorkingCopy.setCommitMessage,
    commitPending: mockTodoWorkingCopy.commitPending,
  }),
  useConcordOsUi: () => ({
    sidebarCollapsed: computed(() => mockUi.sidebarCollapsed.value),
    consoleOpen: computed(() => mockUi.consoleOpen.value),
    inspectorOpen: computed(() => mockUi.inspectorOpen.value),
    toggleSidebar,
    toggleConsole,
    toggleInspector: vi.fn(),
  }),
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => ({
      path: "/app/library",
    }),
  };
});

function createWrapper() {
  return mount(RouteApp, {
    global: {
      stubs: {
        RouterLink: {
          props: ["to"],
          template: '<a :href="to"><slot /></a>',
        },
        ThemeModeToggle: {
          template: "<span>Theme toggle</span>",
        },
        RouterView: {
          template: "<div>Library section</div>",
        },
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
    mockWorkspace.status.value = "ready";
    mockWorkspace.currentScope.value = "private";
    mockWorkspace.currentTargetUrl.value = "https://pod.example/concord/workspace/private/";
    mockAccount.selectedPod.value = "https://pod.example/";
    mockUi.sidebarCollapsed.value = false;
    mockUi.consoleOpen.value = true;
    mockUi.inspectorOpen.value = true;
    mockHost.activeAppLabel.value = null;
    mockHost.activeTarget.value = null;
    mockHost.error.value = null;
    mockHost.tabs.value = [];
    mockHost.activeTabId.value = null;
    mockLibrary.selectedItem.value = null;
    login.mockClear();
    logout.mockClear();
    setIssuer.mockClear();
    workspaceInit.mockClear();
    toggleSidebar.mockClear();
    toggleConsole.mockClear();
  });

  it("renders an inline Solid login gate for unauthenticated users", async () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Sign in with Solid");
    expect(wrapper.text()).toContain("Continue with Solid");
    expect(wrapper.text()).toContain("login.inrupt.com");
    expect(wrapper.text()).toContain("Console");
    expect(wrapper.text()).toContain("Library");

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

  it("renders the authenticated workspace shell when Solid session is present", () => {
    mockState.isAuthenticated.value = true;
    mockState.webId.value = "https://alice.example/profile/card#me";

    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Library");
    expect(wrapper.text()).toContain("Sharing");
    expect(wrapper.text()).toContain("People");
    expect(wrapper.text()).toContain("Account");
    expect(wrapper.text()).toContain("Library section");
    expect(wrapper.text()).toContain("Console");
    expect(wrapper.text()).toContain("Inspector");
    expect(wrapper.text()).toContain("Log out");
    expect(workspaceInit).toHaveBeenCalledTimes(1);
  });
});

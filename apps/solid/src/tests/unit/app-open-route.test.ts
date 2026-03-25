import { computed, ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteAppOpen from "@/routes/app/RouteAppOpen.vue";

const loadHostedApp = vi.fn(async () => undefined);
const backToLibrary = vi.fn(async () => undefined);
const createTodo = vi.fn((title: string) => Boolean(title));
const toggleTodo = vi.fn(() => undefined);
const deleteTodo = vi.fn(() => undefined);
const commitPending = vi.fn(async () => true);
const setCommitMessage = vi.fn((value: string) => {
  state.commitMessage.value = value;
});
const destroyActiveApp = vi.fn(async () => undefined);

const state = {
  status: ref<"idle" | "loading" | "ready" | "error">("loading"),
  activeAppId: ref<string | null>(null),
  activeTarget: ref<{ title: string; url: string; scope: string } | null>(null),
  activeAppLabel: ref<string | null>(null),
  hostError: ref<string | null>(null),
  saving: ref(false),
  stagedCount: ref(0),
  pendingTransactions: ref<Array<{ id: string; message: string; stagedCount: number }>>([]),
  commitMessage: ref(""),
  draftError: ref<string | null>(null),
  lastAction: ref<string | null>(null),
  todoItems: ref([
    {
      id: "todo-1",
      title: "Ship hosted Todo",
      completed: false,
      createdAt: "2026-03-23T12:00:00.000Z",
      updatedAt: "2026-03-23T12:00:00.000Z",
    },
  ]),
};

vi.mock("@/modules/concord-os", () => ({
  useConcordOsKernel: () => ({
    appHost: {
      status: computed(() => state.status.value),
      error: computed(() => state.hostError.value),
      activeApp: computed(() => null),
      activeAppId: computed(() => state.activeAppId.value),
      activeTarget: computed(() => state.activeTarget.value),
      activeAppLabel: computed(() => state.activeAppLabel.value),
      loadHostedApp,
      backToLibrary,
      destroyActiveApp,
    },
    todo: {
      items: computed(() => state.todoItems.value),
      saving: computed(() => state.saving.value),
      stagedCount: computed(() => state.stagedCount.value),
      pendingTransactions: computed(() => state.pendingTransactions.value),
      commitMessage: computed(() => state.commitMessage.value),
      error: computed(() => state.draftError.value),
      lastAction: computed(() => state.lastAction.value),
      createTodo,
      toggleTodo,
      deleteTodo,
      setCommitMessage,
      commitPending,
    },
  }),
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => ({
      params: {
        scope: "private",
        appId: "todo",
        encodedPath: "projects%2Fdemo%2Fledger.json",
      },
    }),
    useRouter: () => ({
      push: vi.fn(async () => undefined),
    }),
  };
});

function createWrapper() {
  return mount(RouteAppOpen);
}

describe("RouteAppOpen", () => {
  beforeEach(() => {
    state.status.value = "loading";
    state.hostError.value = null;
    state.saving.value = false;
    state.stagedCount.value = 0;
    state.pendingTransactions.value = [];
    state.commitMessage.value = "";
    state.draftError.value = null;
    state.activeAppId.value = null;
    state.activeTarget.value = null;
    state.activeAppLabel.value = null;
    state.lastAction.value = null;
    loadHostedApp.mockClear();
    backToLibrary.mockClear();
    createTodo.mockClear();
    toggleTodo.mockClear();
    deleteTodo.mockClear();
    setCommitMessage.mockClear();
    commitPending.mockClear();
    destroyActiveApp.mockClear();
  });

  it("loads the hosted app from the route parameters", () => {
    createWrapper();

    expect(loadHostedApp).toHaveBeenCalledWith({
      scope: "private",
      appId: "todo",
      encodedPath: "projects%2Fdemo%2Fledger.json",
    });
  });

  it("renders the hosted todo workspace when ready", () => {
    state.status.value = "ready";
    state.activeAppId.value = "todo";
    state.activeAppLabel.value = "Todo";
    state.lastAction.value = "Create todo Ship hosted Todo";
    state.stagedCount.value = 2;
    state.pendingTransactions.value = [
      {
        id: "tx-1",
        message: "Create todo Ship hosted Todo",
        stagedCount: 1,
      },
      {
        id: "tx-2",
        message: "Complete todo Ship hosted Todo",
        stagedCount: 2,
      },
    ];
    state.activeTarget.value = {
      title: "Demo ledger",
      url: "https://pod.example/concord/workspace/private/projects/demo/ledger.json",
      scope: "private",
    };

    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Todo workspace");
    expect(wrapper.text()).toContain("Demo ledger");
    expect(wrapper.text()).toContain("Ship hosted Todo");
    expect(wrapper.text()).toContain("Back");
    expect(wrapper.text()).toContain("Pending");
    expect(wrapper.text()).toContain("Replay is current; commit when ready.");
    expect(wrapper.text()).toContain("Last action: Create todo Ship hosted Todo");
  });

  it("renders an error state when the hosted app cannot load", () => {
    state.status.value = "error";
    state.hostError.value = "Unknown hosted app";

    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("This ledger could not be opened.");
    expect(wrapper.text()).toContain("Unknown hosted app");
  });
});

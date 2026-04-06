import { computed, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunExplorerPanel from "@/modules/ui/components/RunExplorerPanel.vue";

const routerPush = vi.fn(async () => undefined);
const currentRoutePath = ref("/");
const selectScope = vi.fn(async () => undefined);
const navigateItem = vi.fn(async () => true);
const selectItem = vi.fn(async () => true);
const openTasks = vi.fn(async () => true);
const goUp = vi.fn(async () => true);
const createFolder = vi.fn(async () => true);
const createLedger = vi.fn(async () => true);
const openConnect = vi.fn(() => undefined);
const closePanel = vi.fn(() => undefined);

const state = {
  scope: ref<"private" | "shared" | "public">("private"),
  currentPath: ref("/private"),
  canGoUp: ref(true),
  mounts: ref([
    { id: "private", label: "Private", scope: "private", rootUrl: "https://pod.example/private/", writable: true },
    { id: "shared", label: "Shared", scope: "shared", rootUrl: "https://pod.example/shared/", writable: true },
  ]),
  items: ref([
    {
      id: "https://pod.example/private/projects/",
      url: "https://pod.example/private/projects/",
      name: "projects",
      title: "projects",
      kind: "container",
      scope: "private",
      active: false,
      contentType: null,
      writable: true,
      lastModified: "2026-03-28T00:00:00.000Z",
    },
    {
      id: "https://pod.example/private/journal.json",
      url: "https://pod.example/private/journal.json",
      name: "journal.json",
      title: "journal",
      kind: "ledger",
      scope: "private",
      active: true,
      contentType: "application/json",
      writable: true,
      lastModified: "2026-03-27T00:00:00.000Z",
    },
  ]),
};

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: routerPush,
    currentRoute: computed(() => ({
      path: currentRoutePath.value,
    })),
  }),
}));

vi.mock("@/modules/ui/useAppShellState", () => ({
  useAppShellState: () => ({
    openConnect,
    closePanel,
  }),
}));

vi.mock("@/modules/run/core", () => ({
  useRunCoreRuntime: () => ({
    workspace: {
      selection: computed(() => ({
        activeScope: state.scope.value,
      })),
      mounts: computed(() => state.mounts.value),
    },
    identity: {
      ready: computed(() => false),
    },
    explorer: {
      currentPath: computed(() => state.currentPath.value),
      items: computed(() => state.items.value),
      canGoUp: computed(() => state.canGoUp.value),
      navigateItem,
      selectItem,
      openTasks,
      goUp,
      createFolder,
      createLedger,
    },
    actions: {
      selectScope,
    },
  }),
}));

describe("RunExplorerPanel", () => {
  beforeEach(() => {
    selectScope.mockClear();
    navigateItem.mockClear();
    selectItem.mockClear();
    openTasks.mockClear();
    goUp.mockClear();
    createFolder.mockClear();
    createLedger.mockClear();
    openConnect.mockClear();
    closePanel.mockClear();
    routerPush.mockClear();
    currentRoutePath.value = "/";
    state.scope.value = "private";
    state.currentPath.value = "/private";
    state.canGoUp.value = true;
  });

  it("routes scope selection and item activation through the explorer/runtime facade", async () => {
    const wrapper = mount(RunExplorerPanel);

    await wrapper.get('button[aria-label="Select scope shared"]').trigger("click");
    await wrapper.get('button[aria-label="Navigate explorer item projects"]').trigger("click");

    expect(selectScope).toHaveBeenCalledWith("shared");
    expect(navigateItem).toHaveBeenCalledWith("https://pod.example/private/projects/");
    expect(selectItem).not.toHaveBeenCalled();
  });

  it("routes up-navigation and create actions through the explorer surface", async () => {
    const wrapper = mount(RunExplorerPanel);

    await wrapper.get('button[aria-label="Explorer up"]').trigger("click");
    await wrapper.get('button[aria-label="New folder"]').trigger("click");
    await wrapper.find('input[placeholder="New folder"]').setValue("notes");
    await wrapper.get('button[aria-label="Create folder"]').trigger("click");
    await wrapper.get('button[aria-label="New ledger"]').trigger("click");
    await wrapper.find('input[placeholder="New ledger"]').setValue("journal");
    await wrapper.get('button[aria-label="Create ledger"]').trigger("click");

    expect(goUp).toHaveBeenCalledTimes(1);
    expect(createFolder).toHaveBeenCalledWith("notes");
    expect(createLedger).toHaveBeenCalledWith("journal");
  });

  it("prompts for identity when ledger creation fails without an active identity", async () => {
    createLedger.mockResolvedValueOnce(false);

    const wrapper = mount(RunExplorerPanel);

    await wrapper.get('button[aria-label="New ledger"]').trigger("click");
    await wrapper.find('input[placeholder="New ledger"]').setValue("journal");
    await wrapper.get('button[aria-label="Create ledger"]').trigger("click");
    await flushPromises();

    expect(createLedger).toHaveBeenCalledWith("journal");
    expect(wrapper.text()).toContain("Create or import an identity to create a ledger.");
    expect(wrapper.text()).toContain("Create or load identity");
    expect(openConnect).toHaveBeenCalledWith("create");
  });

  it("opens a ledger directly into Tasks from the row action", async () => {
    const wrapper = mount(RunExplorerPanel);
    const openTasksButton = wrapper.get('button[aria-label="Open tasks for explorer item journal.json"]');

    await openTasksButton.trigger("click");
    await flushPromises();
    expect(openTasks).toHaveBeenCalledWith("https://pod.example/private/journal.json");
    expect(closePanel).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith("/tasks");
    expect(closePanel.mock.invocationCallOrder[0]).toBeLessThan(
      routerPush.mock.invocationCallOrder[0],
    );
  });

  it("closes Explorer and reuses the current Tasks route when Tasks is already open", async () => {
    currentRoutePath.value = "/tasks/permissions";

    const wrapper = mount(RunExplorerPanel);
    const openTasksButton = wrapper.get('button[aria-label="Open tasks for explorer item journal.json"]');

    await openTasksButton.trigger("click");
    await flushPromises();

    expect(openTasks).toHaveBeenCalledWith("https://pod.example/private/journal.json");
    expect(closePanel).toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });
});

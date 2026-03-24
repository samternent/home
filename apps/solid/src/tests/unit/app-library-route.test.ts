import { computed, ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteAppFiles from "@/routes/app/RouteAppFiles.vue";

const push = vi.fn(async () => undefined);
const openChooser = vi.fn(() => undefined);

const state = {
  currentScope: ref<"private" | "shared" | "public">("private"),
  identityReady: ref(true),
  currentBrowse: ref({
    url: "https://pod.example/concord/workspace/private/",
    scope: "private" as const,
    entries: [],
  }),
  paths: ref({
    workspacePrivateRootUrl: "https://pod.example/concord/workspace/private/",
    workspaceSharedRootUrl: "https://pod.example/concord/workspace/shared/",
    workspacePublicRootUrl: "https://pod.example/concord/workspace/public/",
  }),
  treeNodes: ref([]),
  treeSelection: ref(["https://pod.example/concord/workspace/private/"]),
  selectedEntry: ref({
    url: "https://pod.example/concord/workspace/private/roadmap.json",
    name: "roadmap.json",
    path: "roadmap.json",
    kind: "file" as const,
    scope: "private" as const,
    contentType: "application/vnd.ternent.concord-ledger+json",
    size: 128,
    lastModified: "2026-03-23T12:00:00.000Z",
    etag: null,
    isLedger: true,
  }),
  preview: ref(null),
};

const library = {
  ledgers: ref([
    {
      entry: state.selectedEntry.value,
      kind: "ledger" as const,
      title: "roadmap",
      summary: "Portable Concord history ready to open in compatible apps.",
      badges: ["ledger", "private"],
      capabilities: [
        {
          id: "todo",
          appId: "todo",
          label: "Todo",
          description: "A simple Concord task app for durable lists and completion history.",
          status: "available" as const,
          actionLabel: "Open in Todo",
          isDefault: true,
        },
      ],
      appCountLabel: "1 compatible app",
      modifiedLabel: "Updated 23 Mar",
      primaryCapability: {
        id: "todo",
        appId: "todo",
        label: "Todo",
        description: "A simple Concord task app for durable lists and completion history.",
        status: "available" as const,
        actionLabel: "Open in Todo",
        isDefault: true,
      },
    },
  ]),
  spaces: ref([]),
  resources: ref([]),
  selectedItem: ref(null as any),
};
library.selectedItem.value = library.ledgers.value[0];

const workbench = {
  currentWork: ref({
    url: state.selectedEntry.value.url,
    title: "roadmap",
    scope: "private" as const,
    appId: null,
    appLabel: null,
    kind: "ledger" as const,
  }),
  recentWork: ref([
    {
      url: "https://pod.example/concord/workspace/private/planning.json",
      title: "planning",
      scope: "private" as const,
      appId: "todo",
      appLabel: "Todo",
      kind: "active-app" as const,
    },
  ]),
  ledgerCreationHint: ref(
    "Creates a Concord ledger at <name>.json and keeps it ready for compatible apps.",
  ),
  libraryEmptyLabel: ref("No ledgers here yet."),
};

vi.mock("@/modules/concord-os", () => ({
  buildConcordOsHostedAppRoute: (target: { scope: string; path: string }, appId: string) => ({
    name: "app-open",
    params: {
      scope: target.scope,
      appId,
      encodedPath: encodeURIComponent(target.path),
    },
  }),
  createConcordOsOpenTarget: (entry: typeof state.selectedEntry.value) => ({
    url: entry.url,
    scope: entry.scope,
    path: entry.path,
    name: entry.name,
    title: "roadmap",
    entry,
    ledgerSummary: null,
  }),
  useConcordOsCore: () => ({
    currentBrowse: computed(() => state.currentBrowse.value),
    paths: computed(() => state.paths.value),
    currentScope: computed(() => state.currentScope.value),
    treeNodes: computed(() => state.treeNodes.value),
    treeSelection: computed(() => state.treeSelection.value),
    identityReady: computed(() => state.identityReady.value),
    selectedEntry: computed(() => state.selectedEntry.value),
    preview: computed(() => state.preview.value),
    navigateTo: vi.fn(async () => undefined),
    selectScope: vi.fn(async () => undefined),
    activateTreeNode: vi.fn(async () => undefined),
    createFolder: vi.fn(async () => undefined),
    createLedger: vi.fn(async () => undefined),
    openEntry: vi.fn(async () => undefined),
    selectEntry: vi.fn(async () => undefined),
    renameSelected: vi.fn(async () => undefined),
    moveSelected: vi.fn(async () => undefined),
    downloadSelected: vi.fn(async () => undefined),
    deleteSelected: vi.fn(async () => undefined),
    lookupEntry: vi.fn(async (url: string) =>
      url === state.selectedEntry.value.url ? state.selectedEntry.value : null,
    ),
  }),
  useConcordOsAppHost: () => ({
    activeTarget: computed(() => null),
    chooserOpen: computed(() => false),
    chooserTarget: computed(() => null),
    chooserApps: computed(() => []),
    tabs: computed(() => []),
    activeTabId: computed(() => null),
    openChooser,
    closeChooser: vi.fn(),
    openChosenApp: vi.fn(async () => undefined),
    activateTab: vi.fn(async () => undefined),
    closeTab: vi.fn(async () => undefined),
  }),
  useConcordOsLibrary: () => ({
    ledgers: computed(() => library.ledgers.value),
    spaces: computed(() => library.spaces.value),
    resources: computed(() => library.resources.value),
    selectedItem: computed(() => library.selectedItem.value),
  }),
  useConcordOsWorkbenchView: () => ({
    currentWork: computed(() => workbench.currentWork.value),
    recentWork: computed(() => workbench.recentWork.value),
    ledgerCreationHint: computed(() => workbench.ledgerCreationHint.value),
    libraryEmptyLabel: computed(() => workbench.libraryEmptyLabel.value),
  }),
  useConcordOsUi: () => ({
    inspectorOpen: computed(() => true),
    toggleInspector: vi.fn(),
  }),
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRouter: () => ({
      push,
    }),
  };
});

function createWrapper() {
  return mount(RouteAppFiles, {
    global: {
      stubs: {
        TreeView: {
          template: "<div>Tree</div>",
        },
      },
    },
  });
}

describe("RouteAppFiles", () => {
  beforeEach(() => {
    push.mockClear();
    openChooser.mockClear();
  });

  it("focuses the library on ledgers and current work instead of raw resources", () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("Recent");
    expect(wrapper.text()).toContain("New");
    expect(wrapper.text()).toContain("Open in Todo");
    expect(wrapper.text()).toContain("Show structure");
    expect(wrapper.text()).not.toContain("Add resource");
    expect(wrapper.text()).not.toContain("Supporting resources");
  });

  it("opens a ledger immediately when only one capability is available", async () => {
    const wrapper = createWrapper();

    const openButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text().includes("Open in Todo"));

    expect(openButton).toBeTruthy();
    await openButton!.trigger("click");

    expect(openChooser).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith({
      name: "app-open",
      params: {
        scope: "private",
        appId: "todo",
        encodedPath: "roadmap.json",
      },
    });
  });
});

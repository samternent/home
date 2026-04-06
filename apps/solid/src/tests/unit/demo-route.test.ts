import { computed, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunTasksDemoPage from "@/modules/run/tasks/RunTasksDemoPage.vue";

const addDialogOpen = vi.fn();
const openConnect = vi.fn();
const createLocalLedger = vi.fn();
const importLedgerFile = vi.fn();
const exportActiveLedger = vi.fn();
const createDemoIdentity = vi.fn();
const switchDemoIdentity = vi.fn();
const dismissPrompt = vi.fn();
const handleToggleComplete = vi.fn();
const submitCreateTask = vi.fn();
const submitEditTask = vi.fn();

const activeProjection = ref({
  ledgerId: null as string | null,
});

const surfaceMode = ref<"unavailable" | "inspect" | "interactive">("unavailable");
const surfaceStatus = ref<"idle" | "loading" | "ready" | "error">("idle");
const surfaceTransition = ref<"idle" | "loading-ledger" | "switching-identity">("idle");
const surfaceReason = ref<string | null>("Open a ledger to view Tasks.");
const surfaceEmpty = ref(true);
const surfaceTitle = ref("No document open");
const surfaceTasks = ref<any[]>([]);
const surfaceTaskLists = ref<any[]>([]);
const surfaceUsers = ref<any[]>([]);
const surfacePermissions = ref<any[]>([]);
const surfaceAccessiblePermissions = ref<any[]>([]);
const surfaceTotalTasks = ref(0);
const surfaceOpenTasks = ref(0);
const surfaceDoneTasks = ref(0);
const surfaceHasHiddenProtectedEntries = ref(false);
const surfaceHiddenProtectedTaskCount = ref(0);
const surfaceAccessSummary = ref("No permission groups in this ledger yet.");
const surfaceEmptyBody = ref("This task document is stored in the current ledger.");
const bootstrapStatus = ref<"idle" | "loading" | "ready" | "error">("ready");
const demoError = ref<string | null>(null);
const demoIdentities = ref<any[]>([
  {
    id: "identity:1",
    profile: {
      label: "Demo user 1",
    },
    identity: {
      publicKey: "public-key-1",
    },
  },
]);
const activeDemoIdentity = ref<any>(demoIdentities.value[0]);

vi.mock("@/modules/ui/useAppShellAddDialogModel", () => ({
  useAppShellAddDialogModel: () => ({
    open: addDialogOpen,
  }),
}));

vi.mock("@/modules/ui/useAppShellState", () => ({
  useAppShellState: () => ({
    openConnect,
  }),
}));

vi.mock("@/modules/run/replay", () => ({
  useRunProjectionState: () => ({
    activeProjection,
  }),
}));

vi.mock("@/modules/run/services", () => ({
  useRunLedgerFileActions: () => ({
    createLocalLedger,
    importLedgerFile,
    exportActiveLedger,
  }),
}));

vi.mock("@/modules/run/tasks/useRunDemoIdentityModel", () => ({
  useRunDemoIdentityModel: () => ({
    bootstrapStatus: computed(() => bootstrapStatus.value),
    error: computed(() => demoError.value),
    identities: computed(() => demoIdentities.value),
    activeIdentity: computed(() => activeDemoIdentity.value),
    createDemoIdentity,
    switchIdentity: switchDemoIdentity,
  }),
}));

vi.mock("@/modules/run/tasks/useRunTasksSurface", () => ({
  useRunTasksSurface: () => ({
    mode: computed(() => surfaceMode.value),
    status: computed(() => surfaceStatus.value),
    transition: computed(() => surfaceTransition.value),
    reason: computed(() => surfaceReason.value),
    empty: computed(() => surfaceEmpty.value),
    documentTitle: computed(() => surfaceTitle.value),
    taskLists: computed(() => surfaceTaskLists.value),
    users: computed(() => surfaceUsers.value),
    permissions: computed(() => surfacePermissions.value),
    accessiblePermissions: computed(() => surfaceAccessiblePermissions.value),
    totalTasks: computed(() => surfaceTotalTasks.value),
    openTasks: computed(() => surfaceOpenTasks.value),
    doneTasks: computed(() => surfaceDoneTasks.value),
    hasHiddenProtectedEntries: computed(() => surfaceHasHiddenProtectedEntries.value),
    hiddenProtectedTaskCount: computed(() => surfaceHiddenProtectedTaskCount.value),
    accessSummary: computed(() => surfaceAccessSummary.value),
    tasks: computed(() => surfaceTasks.value),
    emptyStateBody: computed(() => surfaceEmptyBody.value),
    formatRelativeTime: vi.fn(() => "just now"),
  }),
}));

vi.mock("@/modules/run/tasks/useRunTaskComposer", () => ({
  useRunTaskComposer: () => ({
    createError: ref<string | null>(null),
    mutationPrompt: ref<string | null>(null),
    statusTaskId: ref<string | null>(null),
    dismissPrompt,
    submitCreateTask,
    submitEditTask,
    handleToggleComplete,
  }),
}));

vi.mock("@/modules/run/tasks/createTaskDialogSchema", () => ({
  createTaskDialogSchema: vi.fn(() => ({
    title: "Task dialog",
  })),
}));

vi.mock("@/modules/run/tasks/RunTasksListView.vue", () => ({
  default: {
    props: ["tasks"],
    template: `
      <div data-test="tasks-list">
        <button
          v-if="tasks.length"
          data-test="edit-task"
          @click="$emit('edit', tasks[0])"
        >
          Edit task
        </button>
      </div>
    `,
  },
}));

vi.mock("@/modules/run/ledger/RunLedgerAuditView.vue", () => ({
  default: {
    template: '<div data-test="audit-view">Audit view</div>',
  },
}));

vi.mock("@/modules/run/tasks/RunTasksDemoPermissionsView.vue", () => ({
  default: {
    template: '<div data-test="permissions-view">Permissions view</div>',
  },
}));

vi.mock("@/modules/run/tasks/RunTaskCommitBar.vue", () => ({
  default: {
    template: '<div data-test="commit-bar">Commit bar</div>',
  },
}));

describe("RunTasksDemoPage", () => {
  beforeEach(() => {
    addDialogOpen.mockClear();
    openConnect.mockClear();
    createLocalLedger.mockReset();
    createLocalLedger.mockResolvedValue({
      ok: true,
      value: {
        entry: {
          url: "local://workspace/demo.json",
        },
      },
    });
    importLedgerFile.mockReset();
    importLedgerFile.mockResolvedValue({
      ok: true,
      value: {
        entry: {
          url: "local://workspace/imported.json",
        },
      },
    });
    exportActiveLedger.mockReset();
    exportActiveLedger.mockResolvedValue({
      ok: true,
      value: {
        filename: "demo.json",
        content: "{}",
      },
    });
    createDemoIdentity.mockReset();
    createDemoIdentity.mockResolvedValue({
      id: "identity:2",
    });
    switchDemoIdentity.mockReset();
    switchDemoIdentity.mockResolvedValue({
      id: "identity:1",
    });

    activeProjection.value = {
      ledgerId: null,
    };
    surfaceMode.value = "unavailable";
    surfaceStatus.value = "idle";
    surfaceTransition.value = "idle";
    surfaceReason.value = "Open a ledger to view Tasks.";
    surfaceEmpty.value = true;
    surfaceTitle.value = "No document open";
    surfaceTasks.value = [];
    surfaceTaskLists.value = [];
    surfaceUsers.value = [];
    surfacePermissions.value = [];
    surfaceAccessiblePermissions.value = [];
    surfaceTotalTasks.value = 0;
    surfaceOpenTasks.value = 0;
    surfaceDoneTasks.value = 0;
    surfaceHasHiddenProtectedEntries.value = false;
    surfaceHiddenProtectedTaskCount.value = 0;
    surfaceAccessSummary.value = "No permission groups in this ledger yet.";
    bootstrapStatus.value = "ready";
    demoError.value = null;
    demoIdentities.value = [
      {
        id: "identity:1",
        profile: {
          label: "Demo user 1",
        },
        identity: {
          publicKey: "public-key-1",
        },
      },
      {
        id: "identity:2",
        profile: {
          label: "Demo user 2",
        },
        identity: {
          publicKey: "public-key-2",
        },
      },
    ];
    activeDemoIdentity.value = demoIdentities.value[0];
  });

  it("renders the empty-state affordances when no concord is loaded", () => {
    const wrapper = mount(RunTasksDemoPage);

    expect(wrapper.text()).toContain("Create");
    expect(wrapper.text()).toContain("Load Ledger");
    expect(wrapper.text()).toContain("New user");
    expect(wrapper.text()).not.toContain("Export");
    expect(wrapper.text()).not.toContain("Add identity");
  });

  it("creates and switches demo users from the header", async () => {
    activeProjection.value = {
      ledgerId: "ledger:1",
    };
    surfaceMode.value = "interactive";
    surfaceStatus.value = "ready";
    surfaceReason.value = null;
    surfaceTitle.value = "demo";

    const wrapper = mount(RunTasksDemoPage);

    const userButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text() === "New user");
    expect(userButton).toBeTruthy();
    await userButton!.trigger("click");

    const switcher = wrapper.findAll("select")[0];
    await switcher.setValue("identity:2");

    expect(createDemoIdentity).toHaveBeenCalledTimes(1);
    expect(switchDemoIdentity).toHaveBeenCalledWith("identity:2");
  });

  it("routes dropped files through ledger import", async () => {
    const wrapper = mount(RunTasksDemoPage);
    const file = new File(["{}"], "import.json", {
      type: "application/json",
    });

    await wrapper.trigger("drop", {
      dataTransfer: {
        files: [file],
        types: ["Files"],
      },
      preventDefault: () => undefined,
    });
    await flushPromises();

    expect(importLedgerFile).toHaveBeenCalledWith(file);
  });

  it("shows the add-identity action when a concord is loaded read-only", () => {
    activeProjection.value = {
      ledgerId: "ledger:1",
    };
    surfaceMode.value = "inspect";
    surfaceStatus.value = "ready";
    surfaceReason.value = null;
    surfaceTitle.value = "demo";

    const wrapper = mount(RunTasksDemoPage);

    expect(wrapper.text()).toContain("Add identity");
  });

  it("switches to the history audit view when requested", async () => {
    activeProjection.value = {
      ledgerId: "ledger:1",
    };
    surfaceMode.value = "interactive";
    surfaceStatus.value = "ready";
    surfaceReason.value = null;
    surfaceEmpty.value = false;
    surfaceTitle.value = "demo";
    surfaceTasks.value = [];

    const wrapper = mount(RunTasksDemoPage);

    const historyButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text() === "History");
    expect(historyButton).toBeTruthy();

    await historyButton!.trigger("click");

    expect(wrapper.find('[data-test="audit-view"]').exists()).toBe(true);
  });

  it("switches to the permissions view when requested", async () => {
    activeProjection.value = {
      ledgerId: "ledger:1",
    };
    surfaceMode.value = "interactive";
    surfaceStatus.value = "ready";
    surfaceReason.value = null;
    surfaceEmpty.value = false;
    surfaceTitle.value = "demo";

    const wrapper = mount(RunTasksDemoPage);

    const permissionsButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text() === "Permissions");
    expect(permissionsButton).toBeTruthy();
    await permissionsButton!.trigger("click");
    expect(wrapper.find('[data-test="permissions-view"]').exists()).toBe(true);
  });

  it("opens add and edit flows and exports in interactive mode", async () => {
    const anchorClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    if (!("createObjectURL" in URL)) {
      Object.defineProperty(URL, "createObjectURL", {
        writable: true,
        value: () => "blob:demo",
      });
    }
    if (!("revokeObjectURL" in URL)) {
      Object.defineProperty(URL, "revokeObjectURL", {
        writable: true,
        value: () => undefined,
      });
    }
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string) => {
        if (tagName.toLowerCase() === "a") {
          return {
            click: anchorClick,
            set href(_value: string) {},
            set download(_value: string) {},
          } as unknown as HTMLAnchorElement;
        }

        return originalCreateElement(tagName);
      }) as typeof document.createElement);
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:demo");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);

    activeProjection.value = {
      ledgerId: "ledger:1",
    };
    surfaceMode.value = "interactive";
    surfaceStatus.value = "ready";
    surfaceReason.value = null;
    surfaceEmpty.value = false;
    surfaceTitle.value = "demo";
    surfaceTasks.value = [
      {
        taskId: "task:1",
        taskListId: null,
        title: "Ship demo",
        notes: null,
        status: "backlog",
        priority: "normal",
        area: null,
        assignee: null,
        assigneeId: null,
        permissionId: null,
        dueAt: null,
        tags: [],
        createdAt: "2026-03-30T00:00:00.000Z",
        updatedAt: "2026-03-30T00:00:00.000Z",
      },
    ];
    surfaceTotalTasks.value = 1;
    surfaceOpenTasks.value = 1;
    surfaceDoneTasks.value = 0;

    const wrapper = mount(RunTasksDemoPage);

    await wrapper.get('[data-test="edit-task"]').trigger("click");
    const addTaskButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text() === "Add task");
    expect(addTaskButton).toBeTruthy();
    await addTaskButton!.trigger("click");

    const exportButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text() === "Export");
    expect(exportButton).toBeTruthy();
    await exportButton!.trigger("click");
    await flushPromises();

    expect(addDialogOpen).toHaveBeenCalledTimes(2);
    expect(exportActiveLedger).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);

    createElementSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });
});

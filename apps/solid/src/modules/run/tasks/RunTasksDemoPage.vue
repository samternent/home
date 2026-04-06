<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Badge, Button, Input, Spinner } from "ternent-ui/primitives";
import RunLedgerAuditView from "@/modules/run/ledger/RunLedgerAuditView.vue";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunLedgerFileActions } from "@/modules/run/services";
import { useAppShellAddDialogModel } from "@/modules/ui/useAppShellAddDialogModel";
import { useAppShellState } from "@/modules/ui/useAppShellState";
import { createTaskDialogSchema } from "@/modules/run/tasks/createTaskDialogSchema";
import RunTasksListView from "@/modules/run/tasks/RunTasksListView.vue";
import RunTasksDemoPermissionsView from "@/modules/run/tasks/RunTasksDemoPermissionsView.vue";
import RunTaskCommitBar from "@/modules/run/tasks/RunTaskCommitBar.vue";
import { useRunDemoIdentityModel } from "@/modules/run/tasks/useRunDemoIdentityModel";
import { useRunTaskComposer } from "@/modules/run/tasks/useRunTaskComposer";
import { useRunTasksSurface } from "@/modules/run/tasks/useRunTasksSurface";
import type { TaskRecord, TaskStatus } from "./types";

type TaskStatusFilter = TaskStatus | "all";

const shellState = useAppShellState();
const addDialog = useAppShellAddDialogModel();
const projection = useRunProjectionState();
const surface = useRunTasksSurface();
const composer = useRunTaskComposer();
const ledgerFiles = useRunLedgerFileActions();
const demoIdentity = useRunDemoIdentityModel();

const {
  createError,
  statusTaskId,
  submitCreateTask,
  submitEditTask,
  handleToggleComplete,
} = composer;

const fileInput = ref<HTMLInputElement | null>(null);
const dragDepth = ref(0);
const ledgerActionBusy = ref<"create" | null>(null);
const fileActionBusy = ref<"import" | "export" | null>(null);
const quickAddBusy = ref(false);
const ledgerActionError = ref<string | null>(null);
const fileActionError = ref<string | null>(null);
const identityError = ref<string | null>(null);
const identityBusy = ref<"create" | "switch" | null>(null);
const pendingIdentityId = ref<string | null>(null);
const displayedIdentityId = ref<string>("");
const quickAddTitle = ref("");
const quickAddTaskListId = ref<string>("document");
const quickAddAssigneeId = ref<string>("unassigned");
const quickAddPermissionId = ref<string>("none");
const searchQuery = ref("");
const statusFilter = ref<TaskStatusFilter>("all");
const selectedTaskListId = ref<string>("all");
const selectedAssigneeId = ref<string>("all");
const selectedPermissionId = ref<string>("all");
const sortMode = ref<"recent">("recent");
const viewMode = ref<"tasks" | "permissions" | "history">("tasks");

const statusLabels = {
  backlog: "Backlog",
  active: "In progress",
  blocked: "Blocked",
  done: "Done",
} as const;

const viewTabs = [
  { label: "Tasks", value: "tasks" },
  { label: "Permissions", value: "permissions" },
  { label: "History", value: "history" },
] as const;

const hasActiveLedger = computed(() =>
  Boolean(projection.activeProjection.value.ledgerId),
);
const dragActive = computed(() => dragDepth.value > 0);
const bootstrapLoading = computed(
  () =>
    !hasActiveLedger.value && demoIdentity.bootstrapStatus.value === "loading",
);
const workspaceTitle = computed(
  () => surface.documentTitle.value || "Concord Demo",
);
const currentViewLabel = computed(
  () =>
    viewTabs.find((item) => item.value === viewMode.value)?.label ?? "Tasks",
);
const userSwitchPending = computed(
  () =>
    identityBusy.value === "switch" ||
    pendingIdentityId.value !== null ||
    surface.transition.value === "switching-identity",
);
const runtimeLoading = computed(
  () =>
    surface.status.value === "loading" ||
    surface.transition.value === "loading-ledger" ||
    surface.transition.value === "switching-identity",
);

const localAssignees = computed(() =>
  demoIdentity.identities.value.map((identity) => ({
    userId: `user:${identity.identity.keyId}`,
    name: identity.profile.label,
  })),
);

const taskListOptions = computed(() => [
  { value: "all", label: "All lists" },
  { value: "document", label: "Document root" },
  ...surface.taskLists.value.map((taskList) => ({
    value: taskList.taskListId,
    label: taskList.title,
  })),
]);

const assigneeOptions = computed(() => [
  { value: "all", label: "All assignees" },
  { value: "unassigned", label: "Unassigned" },
  ...localAssignees.value.map((assignee) => ({
    value: assignee.userId,
    label: assignee.name,
  })),
]);

const permissionOptions = computed(() => [
  { value: "all", label: "All scopes" },
  { value: "none", label: "No permission" },
  ...surface.permissions.value.map((permission) => ({
    value: permission.permissionId,
    label: permission.title,
  })),
]);

const quickAddTaskListOptions = computed(() => [
  { value: "document", label: "Document root" },
  ...surface.taskLists.value.map((taskList) => ({
    value: taskList.taskListId,
    label: taskList.title,
  })),
]);

const quickAddPermissionOptions = computed(() => [
  { value: "none", label: "No permission" },
  ...surface.accessiblePermissions.value.map((permission) => ({
    value: permission.permissionId,
    label: permission.title,
  })),
]);

const taskListLabels = computed<Record<string, string>>(() =>
  Object.fromEntries(
    surface.taskLists.value.map((taskList) => [
      taskList.taskListId,
      taskList.title,
    ]),
  ),
);

const filteredTasks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return surface.tasks.value.filter((task) => {
    const matchesQuery =
      query.length === 0 ||
      [
        task.title,
        task.notes ?? "",
        task.area ?? "",
        task.assignee ?? "",
        task.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    const matchesStatus =
      statusFilter.value === "all" || task.status === statusFilter.value;

    const matchesTaskList =
      selectedTaskListId.value === "all" ||
      (selectedTaskListId.value === "document" && !task.taskListId) ||
      task.taskListId === selectedTaskListId.value;

    const matchesAssignee =
      selectedAssigneeId.value === "all" ||
      (selectedAssigneeId.value === "unassigned" && !task.assigneeId) ||
      task.assigneeId === selectedAssigneeId.value;

    const matchesPermission =
      selectedPermissionId.value === "all" ||
      (selectedPermissionId.value === "none" && !task.permissionId) ||
      task.permissionId === selectedPermissionId.value;

    return (
      matchesQuery &&
      matchesStatus &&
      matchesTaskList &&
      matchesAssignee &&
      matchesPermission
    );
  });
});

const recentTasks = computed(() =>
  [...filteredTasks.value].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  ),
);

async function yieldToHost() {
  await nextTick();

  if (typeof requestAnimationFrame === "function") {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    return;
  }

  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, 0);
  });
}

watch(hasActiveLedger, (next) => {
  if (!next) {
    viewMode.value = "tasks";
  }
});

watch(
  () =>
    [
      demoIdentity.activeIdentity.value?.id ?? "",
      pendingIdentityId.value,
    ] as const,
  ([activeIdentityId, pendingId]) => {
    if (!pendingId) {
      displayedIdentityId.value = activeIdentityId;
    }
  },
  { immediate: true },
);

watch(
  () =>
    [
      pendingIdentityId.value,
      demoIdentity.activeIdentity.value?.id ?? null,
      surface.status.value,
      surface.transition.value,
      identityBusy.value,
    ] as const,
  ([pendingId, activeIdentityId, status, transition, busy]) => {
    if (!pendingId) {
      return;
    }

    if (
      busy !== "switch" &&
      activeIdentityId === pendingId &&
      transition === "idle" &&
      (status === "ready" || status === "error" || status === "idle")
    ) {
      pendingIdentityId.value = null;
    }
  },
);

function clearLedgerError() {
  ledgerActionError.value = null;
}

function clearFileError() {
  fileActionError.value = null;
}

function clearIdentityError() {
  identityError.value = null;
}

function maybePromptForIdentity(error: string) {
  if (error.toLowerCase().includes("identity")) {
    shellState.openConnect("create");
  }
}

function openTaskCreateDialog() {
  addDialog.open({
    schema: createTaskDialogSchema({
      mode: "create",
      taskLists: surface.taskLists.value,
      assignees: localAssignees.value,
      permissions: surface.accessiblePermissions.value,
    }),
    initialValues: {
      taskListId:
        selectedTaskListId.value === "all" ||
        selectedTaskListId.value === "document"
          ? ""
          : selectedTaskListId.value,
      assigneeId:
        selectedAssigneeId.value === "all" ||
        selectedAssigneeId.value === "unassigned"
          ? ""
          : selectedAssigneeId.value,
      permissionId:
        selectedPermissionId.value === "all" ||
        selectedPermissionId.value === "none"
          ? ""
          : selectedPermissionId.value,
    },
    submit: submitCreateTask,
  });
}

function openTaskEditDialog(task: TaskRecord) {
  addDialog.open({
    schema: createTaskDialogSchema({
      mode: "edit",
      taskLists: surface.taskLists.value,
      assignees: localAssignees.value,
      permissions: surface.accessiblePermissions.value,
    }),
    initialValues: {
      taskListId: task.taskListId ?? "",
      title: task.title,
      notes: task.notes ?? "",
      assigneeId: task.assigneeId ?? "",
      permissionId: task.permissionId ?? "",
      area: task.area ?? "",
      priority: task.priority,
      dueAt: task.dueAt ?? "",
      tags: task.tags.join(", "),
    },
    submit: (payload) => submitEditTask(task.taskId, payload),
  });
}

async function handleCreateLedger() {
  clearLedgerError();
  ledgerActionBusy.value = "create";

  try {
    const result = await ledgerFiles.createLocalLedger();
    if (!result.ok) {
      ledgerActionError.value = result.error;
      maybePromptForIdentity(result.error);
    }
  } finally {
    ledgerActionBusy.value = null;
  }
}

async function handleCreateDemoIdentity() {
  clearIdentityError();
  identityBusy.value = "create";

  try {
    await demoIdentity.createDemoIdentity();
  } catch (error) {
    identityError.value =
      error instanceof Error ? error.message : String(error);
  } finally {
    identityBusy.value = null;
  }
}

async function handleIdentityChange(event: Event) {
  const target = event.target as HTMLSelectElement | null;
  const identityId = target?.value?.trim();
  if (!identityId || identityId === displayedIdentityId.value) {
    return;
  }

  clearIdentityError();
  displayedIdentityId.value = identityId;
  identityBusy.value = "switch";
  pendingIdentityId.value = identityId;
  target?.blur();

  try {
    await yieldToHost();
    await demoIdentity.switchIdentity(identityId);
  } catch (error) {
    displayedIdentityId.value = demoIdentity.activeIdentity.value?.id ?? "";
    pendingIdentityId.value = null;
    identityError.value =
      error instanceof Error ? error.message : String(error);
  } finally {
    identityBusy.value = null;
  }
}

async function handleQuickAdd() {
  const title = quickAddTitle.value.trim();
  if (!title) {
    return;
  }

  quickAddBusy.value = true;
  try {
    const assigneeId =
      quickAddAssigneeId.value === "unassigned"
        ? null
        : quickAddAssigneeId.value;
    const assignee = assigneeId
      ? localAssignees.value.find((user) => user.userId === assigneeId)?.name ??
        null
      : null;
    const permissionId =
      quickAddPermissionId.value === "none" ? null : quickAddPermissionId.value;
    const taskListId =
      quickAddTaskListId.value === "document" ? null : quickAddTaskListId.value;

    const result = await submitCreateTask({
      title,
      assigneeId,
      assignee,
      permissionId,
      taskListId,
    });

    if (result.ok) {
      quickAddTitle.value = "";
      quickAddAssigneeId.value = "unassigned";
      quickAddPermissionId.value = "none";
      quickAddTaskListId.value = "document";
    }
  } finally {
    quickAddBusy.value = false;
  }
}

async function importFile(file: File | null | undefined) {
  if (!file) {
    return;
  }

  clearFileError();
  fileActionBusy.value = "import";

  try {
    const result = await ledgerFiles.importLedgerFile(file);
    if (!result.ok) {
      fileActionError.value = result.error;
    }
  } finally {
    fileActionBusy.value = null;
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  await importFile(target?.files?.[0]);
}

function openFilePicker() {
  clearFileError();
  fileInput.value?.click();
}

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function handleExportLedger() {
  clearFileError();
  fileActionBusy.value = "export";

  try {
    const result = await ledgerFiles.exportActiveLedger();
    if (!result.ok) {
      fileActionError.value = result.error;
      return;
    }

    triggerDownload(result.value.filename, result.value.content);
  } finally {
    fileActionBusy.value = null;
  }
}

function dragHasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

function handleDragEnter(event: DragEvent) {
  if (!dragHasFiles(event)) {
    return;
  }

  event.preventDefault();
  dragDepth.value += 1;
}

function handleDragOver(event: DragEvent) {
  if (!dragHasFiles(event)) {
    return;
  }

  event.preventDefault();
}

function handleDragLeave(event: DragEvent) {
  if (!dragHasFiles(event)) {
    return;
  }

  event.preventDefault();
  dragDepth.value = Math.max(0, dragDepth.value - 1);
}

async function handleDrop(event: DragEvent) {
  if (!dragHasFiles(event)) {
    return;
  }

  event.preventDefault();
  dragDepth.value = 0;
  await importFile(event.dataTransfer?.files?.[0]);
}
</script>

<template>
  <section
    data-theme="concordos-dark"
    class="relative min-h-full overflow-auto h-screen max-h-screen"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <input
      ref="fileInput"
      class="hidden"
      type="file"
      accept=".json,application/json"
      @change="handleFileChange"
    />

    <div
      v-if="dragActive"
      class="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[color:color-mix(in_srgb,var(--ui-bg)_70%,transparent)] backdrop-blur-xl"
    >
      <div
        class="rounded-[24px] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)]/90 px-8 py-9 text-center shadow-[var(--ui-shadow-md)]"
      >
        <p
          class="m-0 text-[11px] uppercase tracking-[0.26em] text-[var(--ui-fg-muted)]"
        >
          Import
        </p>
        <p
          class="m-0 mt-3 text-xl font-semibold tracking-[-0.02em] text-[var(--ui-fg)]"
        >
          Drop ledger
        </p>
      </div>
    </div>

    <div class="mx-auto flex min-h-full w-full max-w-[1440px] flex-col">
      <header class="sticky top-0 z-10 backdrop-blur">
        <div class="flex flex-col gap-5 px-6 py-5 lg:px-8">
          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div class="min-w-0 space-y-3">
              <nav class="flex gap-1 overflow-x-auto">
                <Button
                  v-for="tab in viewTabs"
                  :key="tab.value"
                  size="sm"
                  variant="plain-secondary"
                  class="shrink-0 rounded-[var(--ui-radius-md)] px-3"
                  :class="
                    viewMode === tab.value
                      ? 'bg-[var(--ui-primary-muted)] text-[var(--ui-primary)]'
                      : 'text-[var(--ui-fg-muted)]'
                  "
                  @click="viewMode = tab.value"
                >
                  {{ tab.label }}
                </Button>
              </nav>
            </div>

            <div class="flex flex-col gap-3 lg:min-w-[20rem]">
              <div class="flex min-w-[15rem] items-center gap-2 px-2 py-2">
                <select
                  class="min-w-0 flex-1 rounded-[var(--ui-radius-md)] bg-transparent px-2 py-1.5 text-sm text-[var(--ui-fg)] outline-none"
                  :value="displayedIdentityId"
                  :disabled="
                    !demoIdentity.identities.value.length || runtimeLoading
                  "
                  @change="handleIdentityChange"
                >
                  <option
                    v-for="identity in demoIdentity.identities.value"
                    :key="identity.id"
                    :value="identity.id"
                  >
                    {{ identity.profile.label }}
                  </option>
                </select>

                <Spinner
                  v-if="runtimeLoading"
                  size="sm"
                  tone="muted"
                  class="shrink-0 text-[var(--ui-fg-muted)]"
                />

                <Button
                  size="sm"
                  variant="secondary"
                  class="rounded-[var(--ui-radius-md)]"
                  :disabled="
                    identityBusy === 'create' ||
                    bootstrapLoading ||
                    runtimeLoading
                  "
                  @click="handleCreateDemoIdentity"
                >
                  {{ identityBusy === "create" ? "Creating..." : "New user" }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 px-6 pb-10 pt-8 lg:px-8">
        <div class="mx-auto max-w-[1100px] space-y-4">
          <div
            v-if="
              ledgerActionError ||
              (!hasActiveLedger && demoIdentity.error.value)
            "
            class="rounded-[var(--ui-radius-lg)] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-4 py-3 text-sm text-[var(--ui-critical)]"
          >
            {{ ledgerActionError || demoIdentity.error.value }}
          </div>

          <div
            v-if="fileActionError"
            class="rounded-[var(--ui-radius-lg)] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-4 py-3 text-sm text-[var(--ui-critical)]"
          >
            {{ fileActionError }}
          </div>

          <div
            v-if="identityError"
            class="rounded-[var(--ui-radius-lg)] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-4 py-3 text-sm text-[var(--ui-critical)]"
          >
            {{ identityError }}
          </div>

          <div
            v-if="createError"
            class="rounded-[var(--ui-radius-lg)] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-4 py-3 text-sm text-[var(--ui-critical)]"
          >
            {{ createError }}
          </div>

          <section
            v-if="!hasActiveLedger"
            class="flex min-h-[28rem] items-center justify-center rounded-[28px] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-6 py-8 shadow-[var(--ui-shadow-md)]"
          >
            <div class="flex flex-wrap justify-center gap-3">
              <Button
                class="rounded-[var(--ui-radius-md)]"
                :loading="bootstrapLoading || ledgerActionBusy === 'create'"
                @click="handleCreateLedger"
              >
                Create New
              </Button>

              <Button
                variant="plain-secondary"
                class="rounded-[var(--ui-radius-md)]"
                :loading="fileActionBusy === 'import'"
                @click="openFilePicker"
              >
                Load Ledger
              </Button>
            </div>
          </section>

          <template v-else>
            <template v-if="viewMode === 'tasks'">
              <div
                class="w-full flex justify-center gap-2 px-2 py-2 sticky top-24 z-10"
              >
                <div
                  v-if="surface.mode.value === 'interactive'"
                  class="flex flex-col w-full gap-4 backdrop-blur bg-[var(--ui-bg)]/80 rounded-[20px] px-4 py-3"
                >
                  <Input
                    v-model="quickAddTitle"
                    placeholder="Add a task title"
                    :disabled="quickAddBusy || runtimeLoading"
                    @keydown.enter.prevent="handleQuickAdd"
                  />
                  <div class="flex gap-2 justify-end">
                    <select
                      v-model="quickAddPermissionId"
                      class="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2.5 text-sm text-[var(--ui-fg)] outline-none"
                      :disabled="quickAddBusy || runtimeLoading"
                    >
                      <option
                        v-for="option in quickAddPermissionOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                    <Button
                      size="sm"
                      class="rounded-[var(--ui-radius-md)]"
                      :disabled="
                        quickAddBusy ||
                        runtimeLoading ||
                        quickAddTitle.trim().length === 0
                      "
                      @click="handleQuickAdd"
                    >
                      {{ quickAddBusy ? "Adding..." : "Add task" }}
                    </Button>
                  </div>
                </div>
              </div>
              <div
                v-if="
                  surface.transition.value === 'loading-ledger' ||
                  (surface.status.value === 'loading' &&
                    surface.transition.value !== 'switching-identity')
                "
                class="flex items-center gap-3 rounded-[20px] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-sm text-[var(--ui-fg)]"
              >
                <Spinner size="sm" tone="muted" />
                <span
                  >Replaying ledger and decrypting protected task access…</span
                >
              </div>

              <div
                v-if="surface.mode.value === 'inspect'"
                class="rounded-[20px] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-4 text-sm text-[var(--ui-fg)]"
              >
                <div
                  class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <p class="m-0">
                    You’re viewing this task document read-only. Add identity
                    when you want to stage changes.
                  </p>
                  <Button
                    size="sm"
                    class="rounded-[var(--ui-radius-md)]"
                    @click="shellState.openConnect('create')"
                  >
                    Add identity
                  </Button>
                </div>
              </div>

              <div
                class="space-y-6"
                :class="runtimeLoading ? 'opacity-85' : ''"
              >
                <Input
                  v-model="searchQuery"
                  placeholder="Search"
                  class="max-w-2xl mx-auto"
                />
                <template v-if="sortMode === 'recent'">
                  <RunTasksListView
                    :tasks="recentTasks"
                    :status-labels="statusLabels"
                    :task-list-labels="taskListLabels"
                    :status-task-id="statusTaskId"
                    :format-relative-time="surface.formatRelativeTime"
                    variant="demo"
                    @edit="openTaskEditDialog"
                    @toggle-complete="handleToggleComplete"
                  />
                </template>

                <div
                  class="sticky bottom-0 p-5 bg-[var(--ui-bg)]/60 backdrop-blur"
                >
                  <RunTaskCommitBar
                    v-if="surface.mode.value === 'interactive'"
                    tone="demo"
                    :show-helper="false"
                  />
                </div>
              </div>
            </template>

            <div v-else class="space-y-8">
              <RunTasksDemoPermissionsView v-if="viewMode === 'permissions'" />
              <RunLedgerAuditView v-else-if="viewMode === 'history'" />
            </div>
          </template>
        </div>
      </main>
    </div>
  </section>
</template>

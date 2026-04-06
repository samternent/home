<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Badge, Button, Input, Spinner } from "ternent-ui/primitives";
import { useRunIdentityService } from "@/modules/run/identity";
import { useAppShellAddDialogModel } from "@/modules/ui/useAppShellAddDialogModel";
import { useAppShellState } from "@/modules/ui/useAppShellState";
import RunTasksDocumentNav from "./RunTasksDocumentNav.vue";
import RunTaskCommitBar from "./RunTaskCommitBar.vue";
import RunTasksListView from "./RunTasksListView.vue";
import { createTaskListDialogSchema } from "./createTaskListDialogSchema";
import { createTaskDialogSchema } from "./createTaskDialogSchema";
import { useRunTaskComposer } from "./useRunTaskComposer";
import { useRunTasksSurface } from "./useRunTasksSurface";
import type { TaskPriority, TaskRecord, TaskStatus } from "./types";

type TaskStatusFilter = TaskStatus | "all";
type TaskPriorityFilter = TaskPriority | "all";

const shellState = useAppShellState();
const addDialog = useAppShellAddDialogModel();
const identity = useRunIdentityService();
const surface = useRunTasksSurface();
const composer = useRunTaskComposer();

const {
  createError,
  mutationPrompt,
  statusTaskId,
  createHint,
  dismissPrompt,
  submitCreateTask,
  submitEditTask,
  submitCreateTaskList,
  handleToggleComplete,
} = composer;

const statusLabels = {
  backlog: "Backlog",
  active: "In progress",
  blocked: "Blocked",
  done: "Done",
} as const;

const priorityLabels = {
  low: "Low",
  normal: "Medium",
  high: "High",
} as const;

const statusFilterOptions = [
  { value: "all" as const, label: "All" },
  { value: "backlog" as const, label: statusLabels.backlog },
  { value: "active" as const, label: statusLabels.active },
  { value: "blocked" as const, label: statusLabels.blocked },
  { value: "done" as const, label: statusLabels.done },
];

const priorityFilterOptions = [
  { value: "all" as const, label: "All" },
  { value: "low" as const, label: priorityLabels.low },
  { value: "normal" as const, label: priorityLabels.normal },
  { value: "high" as const, label: priorityLabels.high },
];

const searchOpen = ref(false);
const filterOpen = ref(false);
const searchQuery = ref("");
const selectedTaskListId = ref<string>("all");
const selectedStatus = ref<TaskStatusFilter>("backlog");
const selectedPriority = ref<TaskPriorityFilter>("all");

watch(
  () => ({
    total: surface.totalTasks.value,
    backlog: surface.countsByStatus.value.backlog,
  }),
  ({ total, backlog }) => {
    if (total > 0 && backlog === 0 && selectedStatus.value === "backlog") {
      selectedStatus.value = "all";
    }
  },
  { immediate: true },
);

const visibleTasks = computed(() =>
  surface.tasks.value.filter((task) => {
    const query = searchQuery.value.trim().toLowerCase();
    const matchesTaskList =
      selectedTaskListId.value === "all" ||
      (selectedTaskListId.value === "document" && !task.taskListId) ||
      task.taskListId === selectedTaskListId.value;
    const matchesStatus =
      selectedStatus.value === "all" || task.status === selectedStatus.value;
    const matchesPriority =
      selectedPriority.value === "all" ||
      task.priority === selectedPriority.value;
    const haystack = [
      task.title,
      task.notes ?? "",
      task.area ?? "",
      task.assignee ?? "",
      task.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = query.length === 0 || haystack.includes(query);

    return matchesTaskList && matchesStatus && matchesPriority && matchesQuery;
  }),
);

const headingTitle = computed(() => {
  return surface.documentTitle.value;
});

const activeStageLabel = computed(() =>
  selectedStatus.value === "all"
    ? "All stages"
    : statusLabels[selectedStatus.value],
);

const headingBody = computed(() => {
  if (surface.mode.value === "unavailable") {
    return (
      surface.reason.value ?? "Tasks is not available for the current ledger."
    );
  }

  if (surface.empty.value) {
    return surface.mode.value === "interactive"
      ? "This verified task document is empty. Add the first task when you're ready."
      : "You’re viewing a verified task document. Add identity when you want to make changes.";
  }

  const filters: string[] = [];
  if (selectedTaskListId.value !== "all") {
    if (selectedTaskListId.value === "document") {
      filters.push("document root");
    } else {
      const selectedTaskList = surface.taskLists.value.find(
        (taskList) => taskList.taskListId === selectedTaskListId.value,
      );
      if (selectedTaskList) {
        filters.push(selectedTaskList.title);
      }
    }
  }
  if (selectedPriority.value !== "all") {
    filters.push(priorityLabels[selectedPriority.value]);
  }
  if (searchQuery.value.trim()) {
    filters.push(`matching “${searchQuery.value.trim()}”`);
  }

  const summary = `${visibleTasks.value.length} of ${surface.totalTasks.value} tasks visible`;
  const suffix = filters.length > 0 ? ` · ${filters.join(" · ")}` : "";

  if (surface.mode.value === "interactive") {
    return `${summary}${suffix}. Assignees come from your local identities and permission groups are stored in this ledger. Changes stage locally until you commit them.`;
  }

  return `${summary}${suffix}. Assignees come from your local identities and permissions stay local to this ledger. Add identity when you want to make changes.`;
});

const taskListFilterOptions = computed(() => [
  {
    value: "all",
    label: "All tasks",
  },
  {
    value: "document",
    label: "Document root",
  },
  ...surface.taskLists.value.map((taskList) => ({
    value: taskList.taskListId,
    label: taskList.title,
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

const localAssignees = computed(() =>
  identity.identities.value.map((record) => ({
    userId: `user:${record.identity.keyId}`,
    name: record.profile.label,
  })),
);

const runtimeLoading = computed(
  () =>
    surface.status.value === "loading" ||
    surface.transition.value === "loading-ledger" ||
    surface.transition.value === "switching-identity",
);

function toggleSearch() {
  searchOpen.value = !searchOpen.value;
  if (!searchOpen.value) {
    searchQuery.value = "";
  }
}

function toggleFilters() {
  filterOpen.value = !filterOpen.value;
}

function clearFilters() {
  selectedTaskListId.value = "all";
  selectedStatus.value =
    surface.countsByStatus.value.backlog > 0 ? "backlog" : "all";
  selectedPriority.value = "all";
  searchQuery.value = "";
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
    },
    submit: submitCreateTask,
  });
}

function openTaskListCreateDialog() {
  addDialog.open({
    schema: createTaskListDialogSchema(),
    submit: submitCreateTaskList,
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
</script>

<template>
  <section class="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col py-2">
    <header class="px-5 py-4 sm:px-6">
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="min-w-0 space-y-3">
          <p
            class="m-0 text-[11px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
          >
            Tasks
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <h1
              class="m-0 text-[1.75rem] font-medium tracking-[-0.02em] text-[var(--ui-fg)]"
            >
              {{ headingTitle }}
            </h1>
            <span
              class="inline-flex items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-2.5 py-1 text-xs text-[var(--ui-fg-muted)]"
            >
              {{ visibleTasks.length }}
            </span>
            <Badge tone="neutral" variant="outline" size="xs">
              {{ activeStageLabel }}
            </Badge>
          </div>
          <p
            class="m-0 max-w-2xl text-[13px] leading-6 text-[var(--ui-fg-muted)]"
          >
            {{ headingBody }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <RunTasksDocumentNav />
            <Badge
              v-if="surface.verified.value"
              tone="success"
              variant="soft"
              size="xs"
            >
              Verified
            </Badge>
            <Badge
              v-if="surface.mode.value !== 'unavailable'"
              :tone="
                surface.mode.value === 'interactive' ? 'primary' : 'neutral'
              "
              :variant="
                surface.mode.value === 'interactive' ? 'soft' : 'outline'
              "
              size="xs"
            >
              {{
                surface.mode.value === "interactive"
                  ? "Ready to edit"
                  : "Read-only"
              }}
            </Badge>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-sm">
          <Button
            size="sm"
            variant="plain-secondary"
            class="rounded-lg"
            @click="toggleSearch"
          >
            {{ searchOpen ? "Hide search" : "Search" }}
          </Button>
          <Button
            size="sm"
            variant="plain-secondary"
            class="rounded-lg"
            @click="toggleFilters"
          >
            {{ filterOpen ? "Hide filters" : "Filter" }}
          </Button>
          <Button size="sm" class="rounded-lg" @click="openTaskCreateDialog">
            Add task
          </Button>
          <Button
            size="sm"
            variant="plain-secondary"
            class="rounded-lg"
            @click="shellState.openPanel('explorer')"
          >
            Explorer
          </Button>
        </div>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-auto px-3 pb-4 pt-3 sm:px-4 sm:pb-5">
      <div class="space-y-3 px-2 sm:px-3">
        <div
          v-if="surface.mode.value === 'unavailable'"
          class="rounded-[0.875rem] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-4 py-4"
        >
          <p class="m-0 text-sm text-[var(--ui-critical)]">
            {{ surface.reason.value }}
          </p>
        </div>

        <div
          v-else-if="surface.mode.value === 'inspect'"
          class="rounded-[0.875rem] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-4 py-4"
        >
          <div
            class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
              You’re viewing this task document. Add identity to make changes.
            </p>
            <Button
              size="sm"
              class="rounded-lg"
              @click="shellState.openConnect('create')"
              >Add identity</Button
            >
          </div>
        </div>

        <div
          v-if="runtimeLoading"
          class="rounded-[0.875rem] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-4 py-4"
        >
          <div class="flex items-center gap-3 text-sm text-[var(--ui-fg-muted)]">
            <Spinner size="sm" tone="muted" />
            <span>Replaying ledger and decrypting protected task access…</span>
          </div>
        </div>

        <div
          v-if="
            surface.taskLists.value.length ||
            surface.mode.value === 'interactive'
          "
          class="rounded-[0.875rem] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-4 py-4"
        >
          <div
            class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
          >
            <div class="space-y-2">
              <p
                class="m-0 text-xs uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
              >
                Task lists
              </p>
              <div class="flex flex-wrap gap-2">
                <Button
                  v-for="taskList in taskListFilterOptions"
                  :key="taskList.value"
                  size="xs"
                  :variant="
                    selectedTaskListId === taskList.value
                      ? 'secondary'
                      : 'plain-secondary'
                  "
                  class="rounded-lg"
                  @click="selectedTaskListId = taskList.value"
                >
                  {{ taskList.label }}
                </Button>
              </div>
            </div>

            <div
              v-if="surface.mode.value === 'interactive'"
              class="flex justify-start md:justify-end"
            >
              <Button
                size="sm"
                class="rounded-lg"
                @click="openTaskListCreateDialog"
              >
                Add list
              </Button>
            </div>
          </div>
        </div>

        <div
          v-if="searchOpen || filterOpen"
          class="rounded-[0.875rem] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-4 py-4"
        >
          <div class="flex flex-col gap-4">
            <div v-if="searchOpen" class="space-y-2">
              <p
                class="m-0 text-xs uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
              >
                Search
              </p>
              <Input
                v-model="searchQuery"
                placeholder="Search title, notes, assignee, area, or tags"
              />
            </div>

            <div
              v-if="filterOpen"
              class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
            >
              <div class="space-y-4">
                <div class="space-y-2">
                  <p
                    class="m-0 text-xs uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
                  >
                    Status
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <Button
                      v-for="status in statusFilterOptions"
                      :key="status.value"
                      size="xs"
                      :variant="
                        selectedStatus === status.value
                          ? 'secondary'
                          : 'plain-secondary'
                      "
                      class="rounded-lg"
                      @click="selectedStatus = status.value"
                    >
                      {{ status.label }}
                    </Button>
                  </div>
                </div>

                <div class="space-y-2">
                  <p
                    class="m-0 text-xs uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]"
                  >
                    Priority
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <Button
                      v-for="priority in priorityFilterOptions"
                      :key="priority.value"
                      size="xs"
                      :variant="
                        selectedPriority === priority.value
                          ? 'secondary'
                          : 'plain-secondary'
                      "
                      class="rounded-lg"
                      @click="selectedPriority = priority.value"
                    >
                      {{ priority.label }}
                    </Button>
                  </div>
                </div>
              </div>

              <div class="flex justify-start lg:justify-end">
                <Button
                  size="sm"
                  variant="plain-secondary"
                  class="rounded-lg"
                  @click="clearFilters"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="mutationPrompt"
          class="rounded-[0.875rem] border border-[var(--ui-warning-muted)] bg-[var(--ui-warning-muted)] px-4 py-4"
        >
          <div
            class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <p class="m-0 text-sm text-[var(--ui-fg)]">
              {{ mutationPrompt }}
            </p>
            <div class="flex gap-2">
              <Button
                size="sm"
                class="rounded-lg"
                @click="shellState.openConnect('create')"
                >Add identity</Button
              >
              <Button
                size="sm"
                variant="plain-secondary"
                class="rounded-lg"
                @click="dismissPrompt"
                >Dismiss</Button
              >
            </div>
          </div>
        </div>

        <div
          v-if="createError"
          class="rounded-[0.875rem] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-4 py-4"
        >
          <p class="m-0 text-sm text-[var(--ui-critical)]">
            {{ createError }}
          </p>
        </div>

        <div
          v-if="surface.mode.value !== 'unavailable' && surface.empty.value"
          class="rounded-[1rem] border border-dashed border-[var(--ui-border)]/80 px-5 py-8 text-center"
        >
          <div class="mx-auto flex max-w-xl flex-col items-center gap-3">
            <p class="m-0 text-lg font-medium text-[var(--ui-fg)]">
              This task document is empty.
            </p>
            <p class="m-0 text-sm leading-6 text-[var(--ui-fg-muted)]">
              {{ surface.emptyStateBody.value }}
            </p>
            <div class="flex flex-wrap justify-center gap-2">
              <Button class="rounded-lg" @click="openTaskCreateDialog"
                >Add your first task</Button
              >
              <Button
                v-if="surface.mode.value !== 'interactive'"
                variant="plain-secondary"
                class="rounded-lg"
                @click="shellState.openConnect('create')"
              >
                Add identity
              </Button>
            </div>
          </div>
        </div>

        <template v-else-if="surface.mode.value !== 'unavailable'">
          <RunTasksListView
            :tasks="visibleTasks"
            :status-labels="statusLabels"
            :task-list-labels="taskListLabels"
            :status-task-id="statusTaskId"
            :format-relative-time="surface.formatRelativeTime"
            @edit="openTaskEditDialog"
            @toggle-complete="handleToggleComplete"
          />

          <div class="mt-2 border-t border-[var(--ui-border)]/60 pt-3">
            <button
              class="flex w-full items-center gap-3 rounded-[0.875rem] px-4 py-2.5 text-left text-[var(--ui-fg-muted)] transition hover:bg-[var(--ui-tonal-secondary)] hover:text-[var(--ui-fg)]"
              @click="openTaskCreateDialog"
            >
              <span class="text-lg leading-none">＋</span>
              <span class="text-[15px]">Add a task</span>
            </button>
            <p class="m-0 px-4 pt-2 text-[12px] text-[var(--ui-fg-muted)]">
              {{ createHint }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <RunTaskCommitBar v-if="surface.mode.value === 'interactive'" />
  </section>
</template>

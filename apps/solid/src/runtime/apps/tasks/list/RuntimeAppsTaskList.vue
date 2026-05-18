<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Badge, Button, Card } from "ternent-ui/primitives";
import { useAppApi } from "@/app/api";
import type { TaskRecord } from "@/app/plugins";
import type { RuntimeAppSurfaceDefinition } from "@/runtime/apps";
import { useEntityDetailsPanel } from "@/runtime/entities";
import { createRuntimeTaskEntryEditor } from "./runtimeTaskEntryEditor";

const props = defineProps<{
  surface?: RuntimeAppSurfaceDefinition | null;
}>();

const appApi = useAppApi();
const detailsPanel = useEntityDetailsPanel();
const taskEntryEditor = createRuntimeTaskEntryEditor();

const loadError = ref<string | null>(null);
const actionError = ref<string | null>(null);

const users = computed(() => appApi.users.all());
const profiles = computed(() => appApi.profiles.all());
const permissionLists = computed(() => appApi.tasks.permissionLists());
const publicLists = computed(() => appApi.tasks.publicLists());
const boardId = computed(() => appApi.tasks.defaultBoardId());
const columns = computed(() => appApi.tasks.boardColumns(boardId.value));
const tasks = computed(() => appApi.tasks.byBoard(boardId.value));
const stagedCount = computed(() => appApi.getState().stagedCount);

const userLabelByIdentityKey = computed(
  () =>
    new Map(
      users.value.map((user) => {
        const profile = profiles.value.find(
          (candidate) => candidate.identityKey === user.identityKey,
        );
        const label =
          profile?.displayName ?? user.label ?? user.identityKey.slice(0, 20);
        return [user.identityKey, label] as const;
      }),
    ),
);

const publicListTitleById = computed(
  () => new Map(publicLists.value.map((list) => [list.id, list.title] as const)),
);

const permissionTitleById = computed(
  () =>
    new Map(
      permissionLists.value.map((permission) => [permission.id, permission.title] as const),
    ),
);

const columnLabelById = computed(
  () => new Map(columns.value.map((column) => [column.id, column.title] as const)),
);

const visibleTaskCount = computed(() => tasks.value.length);
const privateTaskCount = computed(() => tasks.value.filter((task) => Boolean(task.permissionId)).length);
const publicTaskCount = computed(() => tasks.value.filter((task) => !task.permissionId).length);

function visibilityLabel(task: TaskRecord): string {
  if (task.permissionId) {
    const permissionTitle = permissionTitleById.value.get(task.permissionId);
    return permissionTitle ? `Private · ${permissionTitle}` : "Private";
  }

  if (task.taskListId) {
    const listTitle = publicListTitleById.value.get(task.taskListId);
    return listTitle ? `List · ${listTitle}` : "List";
  }

  return "Public";
}

function assigneeLabel(task: TaskRecord): string {
  if (!task.assigneeIdentityKey) {
    return "Unassigned";
  }
  return userLabelByIdentityKey.value.get(task.assigneeIdentityKey) ?? task.assigneeIdentityKey;
}

function assigneeInitials(task: TaskRecord): string {
  const label = assigneeLabel(task);
  if (label === "Unassigned") {
    return "U";
  }
  const chunks = label
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  return (chunks.map((part) => part[0]).join("") || label.slice(0, 1)).toUpperCase();
}

async function ensureLoaded(): Promise<void> {
  loadError.value = null;
  try {
    await appApi.load();
    await appApi.identity.ensureActiveIdentity();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error);
  }
}

onMounted(() => {
  void ensureLoaded();
});

function openCreateTaskDrawer(): void {
  actionError.value = null;

  try {
    detailsPanel.open(
      taskEntryEditor.buildCreatePanelConfig({
        appApi,
        surfaceEditor: props.surface?.entryEditor,
      }),
    );
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  }
}

function openTaskEditDrawer(task: TaskRecord): void {
  actionError.value = null;

  try {
    detailsPanel.open(
      taskEntryEditor.buildEditPanelConfig(task, {
        appApi,
        surfaceEditor: props.surface?.entryEditor,
      }),
    );
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-6xl p-4 md:p-6" data-test="runtime-task-list-v1">
    <header class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="m-0 text-2xl font-semibold tracking-tight text-slate-950">Tasks</h2>
          <p class="m-0 mt-1 text-sm text-slate-600">
            Plan, assign, and verify work across this ledger.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            data-test="runtime-task-list-open-create"
            @click="openCreateTaskDrawer"
          >
            New task
          </Button>
          <Badge tone="warning" variant="soft" size="xs" data-test="runtime-task-list-staged">
            {{ stagedCount > 0 ? `${stagedCount} staged` : "Ready" }}
          </Badge>
        </div>
      </div>
    </header>

    <p
      v-if="loadError"
      class="m-0 mb-3 mt-4 text-sm text-[var(--ui-critical)]"
      data-test="runtime-task-list-load-error"
    >
      {{ loadError }}
    </p>

    <p
      v-if="actionError"
      class="m-0 mb-3 mt-4 text-sm text-[var(--ui-critical)]"
      data-test="runtime-task-list-action-error"
    >
      {{ actionError }}
    </p>

    <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" data-test="runtime-task-list-items">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div class="flex flex-wrap items-center gap-2">
          <Badge tone="neutral" variant="soft" size="xs">{{ visibleTaskCount }} tasks</Badge>
          <Badge tone="success" variant="soft" size="xs">{{ publicTaskCount }} shared</Badge>
          <Badge tone="secondary" variant="soft" size="xs">{{ privateTaskCount }} private</Badge>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Badge tone="neutral" variant="outline" size="xs">Sort · Latest</Badge>
          <Badge tone="neutral" variant="outline" size="xs">View · List</Badge>
        </div>
      </div>

      <div class="divide-y divide-slate-200/90">
        <Card
          v-for="task in tasks"
          :key="task.id"
          variant="default"
          class="rounded-none border-0 bg-transparent p-0 shadow-none"
        >
          <div class="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4">
            <div class="min-w-0">
              <div class="flex min-w-0 items-start gap-3">
                <div
                  class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  {{ assigneeInitials(task) }}
                </div>
                <div class="min-w-0">
                  <p class="m-0 truncate text-sm font-semibold text-slate-900">
                    {{ task.title }}
                  </p>
                  <p class="m-0 mt-1 truncate text-xs text-slate-600">
                    Assignee · {{ assigneeLabel(task) }}
                  </p>
                  <p class="m-0 mt-0.5 truncate text-xs text-slate-500">
                    Column · {{ columnLabelById.get(task.columnId) ?? task.columnId }}
                  </p>
                </div>
              </div>

              <div class="mt-2.5 flex flex-wrap items-center gap-1.5 pl-11">
                <Badge tone="neutral" variant="outline" size="xs">{{ task.audienceType }}</Badge>
                <Badge
                  v-if="task.permissionId"
                  tone="secondary"
                  variant="soft"
                  size="xs"
                  class="!border-violet-200 !bg-violet-50 !text-violet-700"
                >
                  {{ visibilityLabel(task) }}
                </Badge>
                <Badge
                  v-else-if="task.taskListId"
                  tone="primary"
                  variant="soft"
                  size="xs"
                >
                  {{ visibilityLabel(task) }}
                </Badge>
                <Badge
                  v-else
                  tone="success"
                  variant="soft"
                  size="xs"
                  class="!border-emerald-200 !bg-emerald-50 !text-emerald-700"
                >
                  {{ visibilityLabel(task) }}
                </Badge>
              </div>
            </div>

            <div class="flex justify-end md:justify-start">
              <Button
                type="button"
                size="xs"
                variant="plain-secondary"
                :data-test="`runtime-task-list-open-edit-${task.id}`"
                @click="openTaskEditDrawer(task)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M12.5 3.5a1.414 1.414 0 0 1 2 0l2 2a1.414 1.414 0 0 1 0 2L8 16H4v-4l8.5-8.5Z"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linejoin="round"
                  />
                </svg>
                Edit
              </Button>
            </div>
          </div>
        </Card>

        <p
          v-if="tasks.length === 0"
          class="m-0 rounded-none border-0 p-6 text-sm text-slate-500"
          data-test="runtime-task-list-empty"
        >
          No visible tasks.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Badge, Button } from "ternent-ui/primitives";
import { useAppApi } from "@/app/api";
import type { TaskRecord } from "@/app/plugins";
import { useEntityDetailsPanel } from "@/runtime/entities";
import { createRuntimeTaskEntryEditor } from "../list/runtimeTaskEntryEditor";

const appApi = useAppApi();
const detailsPanel = useEntityDetailsPanel();
const taskEntryEditor = createRuntimeTaskEntryEditor();

const loadError = ref<string | null>(null);
const actionError = ref<string | null>(null);

const boardId = computed(() => appApi.tasks.defaultBoardId());
const columns = computed(() => appApi.tasks.boardColumns(boardId.value));
const tasks = computed(() => appApi.tasks.byBoard(boardId.value));

const users = computed(() => appApi.users.all());
const profiles = computed(() => appApi.profiles.all());
const permissionLists = computed(() => appApi.tasks.permissionLists());
const publicLists = computed(() => appApi.tasks.publicLists());

const userLabelByIdentityKey = computed(
  () =>
    new Map(
      users.value.map((user) => {
        const profile = profiles.value.find(
          (candidate) => candidate.identityKey === user.identityKey,
        );
        const label = profile?.displayName ?? user.label ?? user.identityKey.slice(0, 20);
        return [user.identityKey, label] as const;
      }),
    ),
);

const publicListTitleById = computed(
  () => new Map(publicLists.value.map((list) => [list.id, list.title] as const)),
);

const permissionTitleById = computed(
  () => new Map(permissionLists.value.map((permission) => [permission.id, permission.title] as const)),
);

const tasksByColumnId = computed(() =>
  Object.fromEntries(
    columns.value.map((column) => [
      column.id,
      appApi.tasks.byColumn(boardId.value, column.id),
    ]),
  ) as Record<string, ReturnType<typeof appApi.tasks.byColumn>>,
);

function columnIndexById(columnId: string): number {
  return columns.value.findIndex((column) => column.id === columnId);
}

function adjacentColumnId(columnId: string, direction: -1 | 1): string | null {
  const index = columnIndexById(columnId);
  if (index < 0) {
    return null;
  }

  const nextColumn = columns.value[index + direction];
  return nextColumn?.id ?? null;
}

function assigneeLabel(task: TaskRecord): string {
  if (!task.assigneeIdentityKey) {
    return "Unassigned";
  }
  return userLabelByIdentityKey.value.get(task.assigneeIdentityKey) ?? task.assigneeIdentityKey;
}

function visibilityLabel(task: TaskRecord): string {
  if (task.permissionId) {
    const permissionTitle = permissionTitleById.value.get(task.permissionId);
    return permissionTitle ? permissionTitle : "Private";
  }

  if (task.taskListId) {
    const listTitle = publicListTitleById.value.get(task.taskListId);
    return listTitle ? listTitle : "List";
  }

  return "Shared";
}

function visibilityPillClass(task: TaskRecord): string {
  if (task.permissionId) {
    return "border-[color-mix(in_srgb,var(--ui-primary)_22%,var(--ui-border))] bg-[var(--ui-primary-muted)] text-[var(--ui-primary)]";
  }

  return "border-[color-mix(in_srgb,var(--ui-success)_22%,var(--ui-border))] bg-[var(--ui-success-muted)] text-[var(--ui-success)]";
}

function accessTagClass(task: TaskRecord): string {
  if (task.permissionId) {
    return "border-[color-mix(in_srgb,var(--ui-primary)_22%,var(--ui-border))] bg-[var(--ui-primary-muted)] text-[var(--ui-primary)]";
  }
  return "border-[color-mix(in_srgb,var(--ui-success)_22%,var(--ui-border))] bg-[var(--ui-success-muted)] text-[var(--ui-success)]";
}

function columnDotClass(index: number): string {
  if (index === 0) {
    return "bg-[var(--ui-border-strong)]";
  }
  if (index === 1) {
    return "bg-[var(--ui-warning)]";
  }
  return "bg-[var(--ui-success)]";
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
    detailsPanel.open(taskEntryEditor.buildCreatePanelConfig({ appApi }));
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  }
}

function openTaskEditDrawer(task: TaskRecord): void {
  actionError.value = null;

  try {
    detailsPanel.open(taskEntryEditor.buildEditPanelConfig(task, { appApi }));
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  }
}

async function moveTask(taskId: string, nextColumnId: string | null): Promise<void> {
  actionError.value = null;
  if (!nextColumnId) {
    return;
  }

  try {
    await appApi.tasks.move({ taskId, columnId: nextColumnId });
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  }
}

async function archiveTask(taskId: string): Promise<void> {
  actionError.value = null;
  try {
    await appApi.tasks.archive({ taskId });
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  }
}
</script>

<template>
  <section class="h-full min-h-0 w-full overflow-hidden" data-test="runtime-task-board-v1">
    <div class="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[color-mix(in_srgb,var(--ui-surface)_86%,transparent)] backdrop-blur">
      <div class="flex h-20 shrink-0 items-center justify-between border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_92%,transparent)] px-6 md:px-8">
        <div>
          <h2 class="m-0 text-[30px] font-semibold tracking-[-0.04em] text-[var(--ui-fg)]">Board</h2>
          <p class="m-0 mt-1 text-xs font-semibold text-[var(--ui-fg-muted)]" data-test="runtime-task-board-count">
            {{ tasks.length }} visible
          </p>
        </div>

        <div class="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" disabled>
            Filter
          </Button>
          <Button type="button" variant="primary" size="sm" data-test="runtime-task-board-open-create" @click="openCreateTaskDrawer">
            Add task
          </Button>
        </div>
      </div>

      <p
        v-if="loadError"
        class="m-0 border-b border-[var(--ui-border)] px-6 py-3 text-sm text-[var(--ui-critical)] md:px-8"
        data-test="runtime-task-board-load-error"
      >
        {{ loadError }}
      </p>
      <p
        v-if="actionError"
        class="m-0 border-b border-[var(--ui-border)] px-6 py-3 text-sm text-[var(--ui-critical)] md:px-8"
        data-test="runtime-task-board-action-error"
      >
        {{ actionError }}
      </p>

      <div
        class="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-6 py-6"
        data-test="runtime-task-board-scroll"
      >
        <div class="flex h-full min-w-max items-stretch gap-5" data-test="runtime-task-board-columns">
          <section
            v-for="(column, index) in columns"
            :key="column.id"
            class="flex h-full w-[350px] shrink-0 flex-col rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-tonal-secondary)_55%,transparent)]"
          >
            <header class="flex h-12 shrink-0 items-center justify-between border-b border-[var(--ui-border)] px-4">
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full" :class="columnDotClass(index)"></span>
                <h3 class="m-0 text-sm font-semibold tracking-[-0.02em] text-[var(--ui-fg)]">
                  {{ column.title }}
                </h3>
                <Badge tone="neutral" variant="soft" size="xs">
                  {{ tasksByColumnId[column.id]?.length ?? 0 }}
                </Badge>
              </div>
              <button
                type="button"
                class="rounded-lg px-2 py-1 text-[var(--ui-fg-muted)] transition hover:bg-[var(--ui-surface)] hover:text-[var(--ui-fg)]"
                @click="openCreateTaskDrawer"
              >
                +
              </button>
            </header>

            <div class="min-h-0 flex-1 space-y-3 overflow-auto p-3">
              <article
                v-for="task in tasksByColumnId[column.id] ?? []"
                :key="task.id"
                class="group rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[var(--ui-shadow-sm)] transition hover:border-[color-mix(in_srgb,var(--ui-border)_70%,var(--ui-border-strong))] hover:shadow-md"
                data-test="runtime-task-board-card"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h4 class="m-0 truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ui-fg)]">
                      {{ task.title }}
                    </h4>
                    <div class="mt-1 truncate text-xs font-medium text-[var(--ui-fg-muted)]">
                      {{ assigneeLabel(task) }}
                    </div>
                  </div>
                  <span class="rounded-full border px-2 py-0.5 text-[11px] font-bold" :class="visibilityPillClass(task)">
                    {{ task.permissionId ? "Private" : "Public" }}
                  </span>
                </div>

                <div class="mt-4 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-[var(--ui-fg-muted)]">
                  <span class="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-1">
                    {{ task.permissionId ? "permission" : "everyone" }}
                  </span>
                  <span class="rounded-full border px-2 py-1" :class="accessTagClass(task)">
                    {{ visibilityLabel(task) }}
                  </span>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <Button type="button" size="xs" variant="tertiary" @click="openTaskEditDrawer(task)">
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="tertiary"
                    :disabled="!adjacentColumnId(task.columnId, -1)"
                    @click="moveTask(task.id, adjacentColumnId(task.columnId, -1))"
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="tertiary"
                    :disabled="!adjacentColumnId(task.columnId, 1)"
                    @click="moveTask(task.id, adjacentColumnId(task.columnId, 1))"
                  >
                    Next
                  </Button>
                  <Button type="button" size="xs" variant="tertiary" @click="archiveTask(task.id)">
                    Archive
                  </Button>
                </div>
              </article>

              <div
                v-if="(tasksByColumnId[column.id] ?? []).length === 0"
                class="flex min-h-28 flex-1 items-center justify-center rounded-xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)]/75 p-6"
              >
                <div class="text-center">
                  <div class="text-sm font-semibold text-[var(--ui-fg-muted)]">No tasks</div>
                  <div class="mt-1 text-xs font-medium text-[var(--ui-fg-muted)]">Completed work will appear here.</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Badge, Button } from "ternent-ui/primitives";
import { ListWorkspaceLayout } from "ternent-ui/patterns";
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
const activeFilter = ref<"all" | "private" | "shared" | "unassigned">("all");

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

const allCount = computed(() => tasks.value.length);
const privateCount = computed(() => tasks.value.filter((task) => Boolean(task.permissionId)).length);
const sharedCount = computed(() => tasks.value.filter((task) => !task.permissionId).length);
const unassignedCount = computed(() =>
  tasks.value.filter((task) => !task.assigneeIdentityKey).length,
);

const filteredTasks = computed(() => {
  if (activeFilter.value === "private") {
    return tasks.value.filter((task) => Boolean(task.permissionId));
  }

  if (activeFilter.value === "shared") {
    return tasks.value.filter((task) => !task.permissionId);
  }

  if (activeFilter.value === "unassigned") {
    return tasks.value.filter((task) => !task.assigneeIdentityKey);
  }

  return tasks.value;
});

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

function assigneeLabel(task: TaskRecord): string {
  if (!task.assigneeIdentityKey) {
    return "Unassigned";
  }
  return userLabelByIdentityKey.value.get(task.assigneeIdentityKey) ?? task.assigneeIdentityKey;
}


function accessTagClass(task: TaskRecord): string {
  if (task.permissionId) {
    return "border-[color-mix(in_srgb,var(--ui-primary)_22%,var(--ui-border))] bg-[var(--ui-primary-muted)] text-[var(--ui-primary)]";
  }
  return "border-[color-mix(in_srgb,var(--ui-success)_22%,var(--ui-border))] bg-[var(--ui-success-muted)] text-[var(--ui-success)]";
}

function statusLabel(task: TaskRecord): string {
  return columnLabelById.value.get(task.columnId) ?? task.columnId;
}

function selectFilter(nextFilter: "all" | "private" | "shared" | "unassigned"): void {
  activeFilter.value = nextFilter;
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
  <section class="h-full min-h-0 w-full" data-test="runtime-task-list-v1">
    <ListWorkspaceLayout data-test-prefix="runtime-task-layout">
      <template #rail>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]">Task lists</h2>
          <button class="rounded-lg px-2 py-1 text-xs font-bold text-[var(--ui-fg-muted)] transition hover:bg-[var(--ui-tonal-secondary)] hover:text-[var(--ui-fg)]">+</button>
        </div>

        <div class="space-y-1" data-test="runtime-task-list-filters">
          <button
            class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition"
            :class="activeFilter === 'all' ? 'border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-sm)]' : 'text-[var(--ui-fg-muted)] hover:bg-[var(--ui-tonal-secondary)] hover:text-[var(--ui-fg)]'"
            data-test="runtime-task-filter-all"
            @click="selectFilter('all')"
          >
            <span>All tasks</span>
            <span class="rounded-full bg-[var(--ui-tonal-secondary)] px-2 py-0.5 text-xs text-[var(--ui-fg-muted)]">{{ allCount }}</span>
          </button>

          <button
            class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition"
            :class="activeFilter === 'private' ? 'border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-sm)]' : 'text-[var(--ui-fg-muted)] hover:bg-[var(--ui-tonal-secondary)] hover:text-[var(--ui-fg)]'"
            data-test="runtime-task-filter-private"
            @click="selectFilter('private')"
          >
            <span>Private</span>
            <span class="text-xs text-[var(--ui-fg-muted)]">{{ privateCount }}</span>
          </button>

          <button
            class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition"
            :class="activeFilter === 'shared' ? 'border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-sm)]' : 'text-[var(--ui-fg-muted)] hover:bg-[var(--ui-tonal-secondary)] hover:text-[var(--ui-fg)]'"
            data-test="runtime-task-filter-shared"
            @click="selectFilter('shared')"
          >
            <span>Shared</span>
            <span class="text-xs text-[var(--ui-fg-muted)]">{{ sharedCount }}</span>
          </button>

          <button
            class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition"
            :class="activeFilter === 'unassigned' ? 'border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-sm)]' : 'text-[var(--ui-fg-muted)] hover:bg-[var(--ui-tonal-secondary)] hover:text-[var(--ui-fg)]'"
            data-test="runtime-task-filter-unassigned"
            @click="selectFilter('unassigned')"
          >
            <span>Unassigned</span>
            <span class="text-xs text-[var(--ui-fg-muted)]">{{ unassignedCount }}</span>
          </button>
        </div>
      </template>

      <div class="flex shrink-0 items-center justify-between border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_92%,transparent)] p-2">
        <div></div>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="xs"
            data-test="runtime-task-list-open-create"
            @click="openCreateTaskDrawer"
          >
            <span class="text-base leading-none">+</span>
            New task
          </Button>
        </div>
      </div>

      <p
        v-if="loadError"
        class="m-0 border-b border-[var(--ui-border)] px-6 py-3 text-sm text-[var(--ui-critical)] md:px-8"
        data-test="runtime-task-list-load-error"
      >
        {{ loadError }}
      </p>

      <p
        v-if="actionError"
        class="m-0 border-b border-[var(--ui-border)] px-6 py-3 text-sm text-[var(--ui-critical)] md:px-8"
        data-test="runtime-task-list-action-error"
      >
        {{ actionError }}
      </p>

      <div
        class="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--ui-primary-muted)_42%,transparent),transparent_35%)]"
        data-test="runtime-task-layout-scroll"
      >
        <div
          class="sticky top-0 grid h-11 grid-cols-[minmax(260px,1.5fr)_minmax(150px,0.7fr)_120px_180px_80px] items-center border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] px-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)] backdrop-blur md:px-8"
          data-test="runtime-task-layout-table-head"
        >
          <div>Task</div>
          <div>Assignee</div>
          <div>Column</div>
          <div>Access</div>
          <div class="text-right">Action</div>
        </div>

        <div data-test="runtime-task-list-items">
          <article
            v-for="task in filteredTasks"
            :key="task.id"
            class="group py-3 grid grid-cols-[minmax(260px,1.5fr)_minmax(150px,0.7fr)_120px_180px_80px] items-center border-b border-[var(--ui-border)] bg-transparent px-6 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--ui-tonal-tertiary)_78%,transparent)] md:px-8"
          >
          <div class="flex min-w-0 items-center gap-4 justify-between pr-8">
              <div class="flex items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="['size-6 stroke-[var(--ui-fg-muted)]/40'] "><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                <span class="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ui-fg)]">{{ task.title }}</span>
              </div>
              <svg v-if="task.permissionId" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>

            <div class="truncate text-[13px] font-medium text-[var(--ui-fg-muted)]">{{ assigneeLabel(task) }}</div>

            <div>
              <span class="rounded-full bg-[var(--ui-tonal-secondary)] px-2 py-1 text-xs font-bold text-[var(--ui-fg-muted)]">
                {{ statusLabel(task) }}
              </span>
            </div>

            <div class="flex min-w-0 items-center gap-1.5">
              <span class="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ui-fg-muted)]">
                {{ task.permissionId ? 'permission' : 'everyone' }}
              </span>
              <span
                class="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                :class="accessTagClass(task)"
              >
                {{ visibilityLabel(task) }}
              </span>
            </div>

            <button
              type="button"
              class="justify-self-end rounded-xl border border-transparent bg-transparent px-3 py-2 text-xs font-bold tracking-[0.02em] text-[var(--ui-fg-muted)] opacity-0 transition-all duration-200 group-hover:opacity-100 hover:border-[var(--ui-border)] hover:bg-[var(--ui-surface)] hover:text-[var(--ui-fg)] hover:shadow-sm"
              :data-test="`runtime-task-list-open-edit-${task.id}`"
              @click="openTaskEditDrawer(task)"
            >
              Edit
            </button>
          </article>

          <p
            v-if="filteredTasks.length === 0"
            class="m-0 border-b border-[var(--ui-border)] px-6 py-8 text-sm text-[var(--ui-fg-muted)] md:px-8"
            data-test="runtime-task-list-empty"
          >
            No visible tasks.
          </p>
        </div>
      </div>

      <div class="hidden">
        <Badge tone="warning" variant="soft" size="xs" data-test="runtime-task-list-staged">
          {{ stagedCount > 0 ? `${stagedCount} staged` : 'no staged entries' }}
        </Badge>
      </div>
    </ListWorkspaceLayout>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { generateId } from "ternent-utils";
import { SDialog } from "ternent-ui/components";
import { Button } from "ternent-ui/primitives";

import { useLedger } from "../../module/ledger/useLedger";
import TodoQuickAdd from "./TodoQuickAdd.vue";

const { bridge, addItem } = useLedger();

type PermissionGroup = {
  id: string;
  title: string;
  public: string;
  createdBy: string;
};

type PermissionGroupEntry = {
  entryId: string;
  data: PermissionGroup;
};

type Tasklist = {
  id: string;
  title: string;
  public?: boolean;
  createdAt?: number;
  updatedAt?: number;
};

type TasklistEntry = {
  entryId: string;
  data: Tasklist;
};

type BoardColumn = {
  id: string;
  title: string;
  createdAt?: number;
  updatedAt?: number;
  order?: number;
};

type BoardColumnEntry = {
  entryId: string;
  data: BoardColumn;
};

type LedgerItem = {
  id: string;
  title: string;
  completed?: boolean;
  boardColumnId?: string | null;
  tasklistId?: string | null;
  assignedTo?: string | null;
  permission?: string;
  permissionId?: string | null;
  createdAt?: number;
  updatedAt?: number;
};

type ItemEntry = {
  entryId: string;
  data: LedgerItem;
};

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);

const permissions = computed<PermissionGroupEntry[]>(
  () =>
    Object.values(
      bridge.collections.byKind.value?.["permission-groups"] || {}
    ) as PermissionGroupEntry[]
);

const publicTasklists = computed<TasklistEntry[]>(() =>
  Object.values(bridge.collections.byKind.value?.tasklists || {})
    .sort((a, b) => (a.data.createdAt ?? 0) - (b.data.createdAt ?? 0)) as TasklistEntry[]
);

const listOptions = computed(() => [
  {
    value: "base:public",
    label: "Public",
    kind: "base" as const,
    id: null,
  },
  ...publicTasklists.value.map((entry) => ({
    value: `public-list:${entry.data.id}`,
    label: entry.data.title,
    kind: "public-list" as const,
    id: entry.data.id,
  })),
  ...permissions.value.map((entry) => ({
    value: `permission:${entry.data.id}`,
    label: entry.data.title,
    kind: "permission" as const,
    id: entry.data.id,
  })),
]);

const columns = computed<BoardColumnEntry[]>(() =>
  Object.values(bridge.collections.byKind.value?.["board-columns"] || {})
    .sort((a, b) => {
      const aOrder = a.data.order ?? a.data.createdAt ?? 0;
      const bOrder = b.data.order ?? b.data.createdAt ?? 0;
      return aOrder - bOrder;
    })
    .map((entry) => ({
      entryId: entry.entryId,
      data: entry.data as BoardColumn,
    }))
);

const tasks = computed<ItemEntry[]>(() =>
  Object.values(bridge.collections.byKind.value?.todos || {})
    .sort((a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0))
    .map((entry) => ({
      entryId: entry.entryId,
      data: entry.data as LedgerItem,
    }))
);

const boardColumnOptions = computed(() =>
  columns.value.map((entry) => ({
    id: entry.data.id,
    title: entry.data.title,
  }))
);

const backlogTasks = computed(() =>
  tasks.value.filter((item) => !item.data.boardColumnId)
);

const tasksByColumnId = computed(() => {
  const map = new Map<string, ItemEntry[]>();
  for (const column of columns.value) {
    map.set(column.data.id, []);
  }
  for (const item of tasks.value) {
    if (!item.data.boardColumnId) continue;
    const columnTasks = map.get(item.data.boardColumnId);
    if (columnTasks) columnTasks.push(item);
  }
  return map;
});

const isAddColumnOpen = ref(false);
const newColumnTitle = shallowRef("");

const isAddTaskOpen = ref(false);
const activeBoardColumnId = shallowRef<string | null>(null);
const lockBoardColumn = ref(false);
const showBacklog = ref(true);

watch(isAddColumnOpen, (nextValue) => {
  if (nextValue) return;
  newColumnTitle.value = "";
});

watch(isAddTaskOpen, (nextValue) => {
  if (nextValue) return;
  activeBoardColumnId.value = null;
  lockBoardColumn.value = false;
});

function openAddColumn() {
  if (!canAddItem.value) return;
  isAddColumnOpen.value = true;
}

function closeAddColumn() {
  isAddColumnOpen.value = false;
}

function openAddTask(columnId?: string | null) {
  if (!canAddItem.value) return;
  activeBoardColumnId.value = columnId ?? columns.value[0]?.data.id ?? null;
  lockBoardColumn.value = Boolean(columnId);
  isAddTaskOpen.value = true;
}

function closeAddTask() {
  isAddTaskOpen.value = false;
}

async function addBoardColumn() {
  const title = newColumnTitle.value.trim();
  if (!title) return;
  const maxOrder = columns.value.reduce(
    (max, column) => Math.max(max, column.data.order ?? 0),
    0
  );
  await addItem(
    {
      id: generateId(),
      title,
      order: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    "board-columns"
  );
  closeAddColumn();
}

async function addBoardTask(payload: {
  title: string;
  assigneeId?: string | null;
  permissionId?: string | null;
  tasklistId?: string | null;
  boardColumnId?: string | null;
}) {
  const id = generateId();
  await addItem(
    {
      id,
      title: payload.title,
      ...(payload.assigneeId ? { assignedTo: payload.assigneeId } : {}),
      ...(payload.boardColumnId
        ? { boardColumnId: payload.boardColumnId }
        : {}),
      ...(payload.tasklistId ? { tasklistId: payload.tasklistId } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completed: false,
    },
    "todos",
    payload.permissionId ?? null
  );
}

async function moveTaskToColumn(item: ItemEntry, columnId: string | null) {
  await addItem(
    {
      ...item.data,
      boardColumnId: columnId,
      updatedAt: Date.now(),
    },
    "todos",
    item.data.permissionId ?? item.data.permission ?? null
  );
}

async function handleBacklogColumnChange(item: ItemEntry, event: Event) {
  const target = event.target as HTMLSelectElement;
  await moveTaskToColumn(item, target.value || null);
}
</script>

<template>
  <div class="flex w-full flex-1 min-h-0">
    <aside
      class="hidden lg:flex flex-col w-72 border-r border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 gap-4"
    >
      <div class="flex items-center justify-between">
        <div class="text-[11px] uppercase tracking-[0.16em] opacity-60">
          Backlog
        </div>
        <Button
          type="button"
          size="xs"
          variant="plain-secondary"
          class="text-[11px] uppercase tracking-[0.16em]"
          @click="showBacklog = !showBacklog"
        >
          {{ showBacklog ? "Hide" : "Show" }}
        </Button>
      </div>
      <div v-if="showBacklog" class="flex flex-col gap-3">
        <div v-if="!backlogTasks.length" class="text-xs opacity-60 px-3 py-2">
          No backlog tasks.
        </div>
        <div
          v-for="item in backlogTasks"
          :key="item.entryId"
          class="rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 65%, transparent)] p-3 flex flex-col gap-2"
        >
          <p
            class="text-sm font-thin"
            :class="
              item.data.completed
                ? 'line-through text-[var(--ui-fg-muted)]'
                : ''
            "
          >
            {{ item.data.title }}
          </p>
          <select
            class="border border-[var(--ui-border)] px-2 py-1 text-xs bg-transparent"
            :disabled="!canAddItem"
            @change="handleBacklogColumnChange(item, $event)"
          >
            <option value="">Backlog</option>
            <option
              v-for="column in boardColumnOptions"
              :key="column.id"
              :value="column.id"
            >
              {{ column.title }}
            </option>
          </select>
        </div>
      </div>
    </aside>

    <section class="flex-1 flex flex-col gap-4 min-h-0">
      <div class="flex flex-wrap items-end justify-between gap-3 px-3">
        <div class="flex flex-col gap-1">
          <h2 class="text-xl">Boards.</h2>
          <p class="text-sm opacity-70">Shape tasks into columns.</p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            :disabled="!canAddItem"
            @click="openAddColumn"
          >
            New column
          </Button>
        </div>
      </div>

      <div v-if="!columns.length" class="px-3 pb-6">
        <div
          class="rounded-3xl border border-dashed border-[var(--ui-border)] px-4 py-6 text-sm text-[var(--ui-fg-muted)]"
        >
          No board columns yet. Create your first column to start organizing
          work.
        </div>
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-3 gap-3 px-3 pb-6 items-start"
      >
        <section
          v-for="column in columns"
          :key="column.data.id"
          class="rounded-3xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 flex flex-col gap-3 min-h-[14rem]"
        >
          <header class="flex items-center justify-between">
            <h3 class="text-sm uppercase tracking-[0.2em] opacity-70">
              {{ column.data.title }}
            </h3>
            <span
              class="text-xs px-2 py-1 rounded-full border border-[var(--ui-border)]"
            >
              {{ tasksByColumnId.get(column.data.id)?.length ?? 0 }}
            </span>
          </header>
          <div class="flex flex-col gap-3">
            <article
              v-for="item in tasksByColumnId.get(column.data.id) ?? []"
              :key="item.entryId"
              class="rounded-2xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 65%, transparent)] p-3"
            >
              <p
                class="text-sm font-thin"
                :class="
                  item.data.completed
                    ? 'line-through text-[var(--ui-fg-muted)]'
                    : ''
                "
              >
                {{ item.data.title }}
              </p>
              <div class="mt-3 flex items-center gap-2 text-xs opacity-60">
                <span class="px-2 py-0.5 rounded-full border">Task</span>
                <span
                  v-if="item.data.completed"
                  class="px-2 py-0.5 rounded-full border"
                >
                  Done
                </span>
              </div>
            </article>
            <button
              type="button"
              class="rounded-2xl border border-dashed border-[var(--ui-border)] p-3 text-left text-sm opacity-60 hover:opacity-100 transition"
              :disabled="!canAddItem"
              @click="openAddTask(column.data.id)"
            >
              + Add card
            </button>
          </div>
        </section>
      </div>
    </section>

    <SDialog v-model:open="isAddColumnOpen" title="New board column">
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </template>
      <div class="flex flex-col gap-3">
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Column name
        </label>
        <input
          v-model="newColumnTitle"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. Ready to ship"
        />
        <Button
          type="button"
          size="sm"
          variant="primary"
          @click="addBoardColumn"
        >
          Create column
        </Button>
      </div>
    </SDialog>

    <SDialog
      v-model:open="isAddTaskOpen"
      size="lg"
      title="Add task"
      body-class="p-0"
    >
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </template>
      <TodoQuickAdd
        :on-create="addBoardTask"
        :list-options="listOptions"
        :board-columns="boardColumnOptions"
        :fixed-board-column-id="lockBoardColumn ? activeBoardColumnId : null"
        :initial-board-column-id="lockBoardColumn ? null : activeBoardColumnId"
        force-expanded
        class="rounded-none border-0 shadow-none"
        @created="closeAddTask"
      />
    </SDialog>
  </div>
</template>

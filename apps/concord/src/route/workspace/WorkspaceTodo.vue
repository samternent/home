<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { generateId } from "ternent-utils";

import { useLedger } from "../../module/ledger/useLedger";
import TodoQuickAdd from "./TodoQuickAdd.vue";
import TodoItemCard from "./TodoItemCard.vue";

const { bridge, addItem } = useLedger();

type LedgerItem = {
  id: string;
  title: string;
  completed?: boolean;
  assignedTo?: boolean;
  keyMissing?: boolean;
  [key: string]: unknown;
};

type ItemEntry = {
  entryId: string;
  data: LedgerItem;
};

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

function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(iso));
}

const hidePrivateItems = shallowRef(true);

const items = computed(() =>
  Object.values(bridge.collections.byKind.value?.todos || {})
    .filter((item) => {
      // if (hidePrivateItems.value && item.data.permission && !item.data.public) {
      //   return false;
      // }
      return true;
    })
    .sort((a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0))
    .map((item) => {
      const assignee = item.data.assignedTo
        ? bridge.collections.get("users", item.data.assignedTo)
        : null;

      return {
        entryId: item.entryId,
        data: {
          ...item.data,
          ...(assignee ? { assignedTo: assignee?.data } : {}),
        },
      };
    })
);

const permissions = computed<PermissionGroupEntry[]>(
  () =>
    Object.values(
      bridge.collections.byKind.value?.["permission-groups"] || {}
    ) as PermissionGroupEntry[]
);

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);

const activeEntryId = shallowRef<string | null>(null);
const selectedListId = shallowRef<string>("all");

const tasklistGroups = computed(() => {
  const permissionGroups = permissions.value.map((group) => {
    const count = items.value.filter(
      (item) => item.data.permission === group.data.id
    ).length;
    return {
      id: group.data.id,
      label: group.data.title,
      count,
    };
  });

  const baseLists = [
    {
      id: "all",
      label: "All tasks",
      count: items.value.length,
    },
    {
      id: "active",
      label: "Active",
      count: items.value.filter((item) => !item.data.completed).length,
    },
    {
      id: "completed",
      label: "Completed",
      count: items.value.filter((item) => item.data.completed).length,
    },
    {
      id: "ungrouped",
      label: "No list",
      count: items.value.filter((item) => !item.data.permission).length,
    },
  ];

  return {
    base: baseLists,
    groups: permissionGroups,
  };
});

const selectedListLabel = computed(() => {
  const baseMatch = tasklistGroups.value.base.find(
    (list) => list.id === selectedListId.value
  );
  if (baseMatch) return baseMatch.label;
  const groupMatch = tasklistGroups.value.groups.find(
    (list) => list.id === selectedListId.value
  );
  return groupMatch?.label ?? "Tasks";
});

const filteredItems = computed(() => {
  if (selectedListId.value === "all") return items.value;
  if (selectedListId.value === "active") {
    return items.value.filter((item) => !item.data.completed);
  }
  if (selectedListId.value === "completed") {
    return items.value.filter((item) => item.data.completed);
  }
  if (selectedListId.value === "ungrouped") {
    return items.value.filter((item) => !item.data.permission);
  }
  return items.value.filter(
    (item) => item.data.permission === selectedListId.value
  );
});

watch(
  filteredItems,
  (nextItems) => {
    if (!nextItems.length) {
      activeEntryId.value = null;
      return;
    }
    const isActiveStillVisible = nextItems.some(
      (item) => item.entryId === activeEntryId.value
    );
    if (!isActiveStillVisible) {
      activeEntryId.value =
        nextItems.find((item) => !item.data.completed)?.entryId ??
        nextItems[0].entryId;
    }
  },
  { immediate: true }
);

async function addTodoItem(payload: {
  title: string;
  assigneeId?: string | null;
  permissionId?: string | null;
}) {
  const id = generateId();
  await addItem(
    {
      id,
      title: payload.title,
      ...(payload.assigneeId ? { assignedTo: payload.assigneeId } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completed: false,
    },
    "todos",
    payload.permissionId ?? null
  );
}

async function completeItem(item: LedgerItem) {
  await addItem(
    {
      ...item,
      completed: !item.completed,
      ...(item.assignedTo?.id ? { assignedTo: item.assignedTo.id } : {}),
      updatedAt: Date.now(),
    },
    "todos",
    item.permission
  );
}
</script>
<template>
  <div class="w-full flex flex-1 gap-4 min-h-0">
    <aside
      class="hidden lg:flex flex-col w-64 border-r border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 gap-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-xs uppercase tracking-[0.18em] opacity-60">
            Tasklists
          </span>
          <span class="text-sm font-thin">Workspace tasks</span>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <div class="text-[11px] uppercase tracking-[0.16em] opacity-60">
          Views
        </div>
        <button
          v-for="list in tasklistGroups.base"
          :key="list.id"
          type="button"
          class="flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm transition"
          :class="
            selectedListId === list.id
              ? 'bg-[var(--ui-primary)] text-[var(--ui-on-primary)] shadow-sm'
              : 'hover:bg-[var(--ui-surface-hover)] text-[var(--ui-fg)]'
          "
          @click="selectedListId = list.id"
        >
          <span class="truncate">{{ list.label }}</span>
          <span
            class="min-w-[1.5rem] text-center text-[11px] rounded-full px-2 py-0.5"
            :class="
              selectedListId === list.id
                ? 'bg-[var(--ui-on-primary)]/15 text-[var(--ui-on-primary)]'
                : 'bg-[var(--ui-surface)] text-[var(--ui-fg-muted)]'
            "
          >
            {{ list.count }}
          </span>
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <div class="text-[11px] uppercase tracking-[0.16em] opacity-60">
          Lists
        </div>
        <button
          v-for="list in tasklistGroups.groups"
          :key="list.id"
          type="button"
          class="flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm transition"
          :class="
            selectedListId === list.id
              ? 'bg-[var(--ui-secondary)] text-[var(--ui-on-secondary)]'
              : 'hover:bg-[var(--ui-surface-hover)] text-[var(--ui-fg)]'
          "
          @click="selectedListId = list.id"
        >
          <span class="truncate">{{ list.label }}</span>
          <span
            class="min-w-[1.5rem] text-center text-[11px] rounded-full px-2 py-0.5"
            :class="
              selectedListId === list.id
                ? 'bg-[var(--ui-on-secondary)]/15 text-[var(--ui-on-secondary)]'
                : 'bg-[var(--ui-surface)] text-[var(--ui-fg-muted)]'
            "
          >
            {{ list.count }}
          </span>
        </button>
        <p
          v-if="!tasklistGroups.groups.length"
          class="text-xs opacity-60 px-3 py-2"
        >
          No tasklists yet. Create one from permissions.
        </p>
      </div>
    </aside>

    <section class="flex-1 flex flex-col gap-4 min-h-0">
      <header
        class="sticky top-0 z-10 flex flex-wrap gap-3 items-center justify-between px-4 py-3 backdrop-blur"
      >
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-thin">{{ selectedListLabel }}</h2>
            <span class="text-xs text-[var(--ui-fg-muted)]">
              {{ filteredItems.length }} tasks
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <input type="checkbox" id="hidePrivate" v-model="hidePrivateItems" />
          <label for="hidePrivate" class="opacity-70">Hide private</label>
        </div>
      </header>

      <div class="lg:hidden flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="list in [...tasklistGroups.base, ...tasklistGroups.groups]"
          :key="list.id"
          type="button"
          class="shrink-0 rounded-full px-3 py-1 text-xs border border-[var(--ui-border)] transition"
          :class="
            selectedListId === list.id
              ? 'bg-[var(--ui-primary)] text-[var(--ui-on-primary)]'
              : 'hover:bg-[var(--ui-surface-hover)] text-[var(--ui-fg)]'
          "
          @click="selectedListId = list.id"
        >
          {{ list.label }}
        </button>
      </div>

      <div class="overflow-hidden flex-1">
        <div class="flex-1 overflow-auto min-h-0 flex flex-col gap-3">
          <ul class="w-full flex flex-col gap-3">
            <li v-if="canAddItem">
              <TodoQuickAdd
                :permissions="permissions"
                :on-create="addTodoItem"
              />
            </li>
            <li v-for="item in filteredItems" :key="item.entryId">
              <TodoItemCard
                :item="item"
                :active="item.entryId === activeEntryId"
                :format-date="formatDate"
                @toggle="completeItem"
                @activate="activeEntryId = item.entryId"
              />
            </li>
            <li v-if="!filteredItems.length" class="py-8 px-3 text-sm">
              <div
                class="rounded-2xl border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                No tasks yet. Add your first task below.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

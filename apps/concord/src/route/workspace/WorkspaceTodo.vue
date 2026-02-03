<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from "vue";
import { generateId, stripIdentityKey } from "ternent-utils";
import {
  SBadge,
  SDialog,
  SListButton,
  SSegmentedControl,
} from "ternent-ui/components";
import { Button } from "ternent-ui/primitives";

import { useLedger } from "../../module/ledger/useLedger";
import TodoQuickAdd from "./TodoQuickAdd.vue";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import UserPicker from "../../module/user/UserPicker.vue";

const { bridge, addItem, createPermission, addUserPermission } = useLedger();

type LedgerItem = {
  id: string;
  title: string;
  completed?: boolean;
  assignedTo?: boolean;
  boardColumnId?: string | null;
  tasklistId?: string | null;
  keyMissing?: boolean;
  permission?: string;
  permissionId?: string | null;
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

function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(iso));
}

const items = computed(() =>
  Object.values(bridge.collections.byKind.value?.todos || {})
    .filter((item) => {
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

const publicTasklists = computed<TasklistEntry[]>(
  () =>
    Object.values(bridge.collections.byKind.value?.tasklists || {}).sort(
      (a, b) => (a.data.createdAt ?? 0) - (b.data.createdAt ?? 0)
    ) as TasklistEntry[]
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

const boardColumns = computed<BoardColumnEntry[]>(() =>
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

const boardColumnOptions = computed(() =>
  boardColumns.value.map((entry) => ({
    id: entry.data.id,
    title: entry.data.title,
  }))
);

const boardColumnLabelById = computed(() => {
  const map = new Map<string, string>();
  for (const column of boardColumns.value) {
    map.set(column.data.id, column.data.title);
  }
  return map;
});

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);

const activeEntryId = shallowRef<string | null>(null);
const selectedListId = shallowRef<string>("all");
const selectedStatus = shallowRef<"all" | "active" | "completed">("all");

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];
const isAddDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const editingItem = shallowRef<ItemEntry | null>(null);
const isListDialogOpen = ref(false);
const isMembersDialogOpen = ref(false);
const newListTitle = shallowRef("");
const newListMember = shallowRef<any | null>(null);
const newListMembers = ref<any[]>([]);
const isPublicList = ref(false);
const selectedUsersByPermission = reactive<Record<string, any>>({});

const tasklistGroups = computed(() => {
  const permissionGroups = permissions.value.map((group) => {
    const count = items.value.filter(
      (item) => item.data.permissionId === group.data.id
    ).length;
    return {
      id: group.data.id,
      label: group.data.title,
      count,
    };
  });

  const publicLists = publicTasklists.value.map((list) => {
    const count = items.value.filter(
      (item) => item.data.tasklistId === list.data.id
    ).length;
    return {
      id: list.data.id,
      label: list.data.title,
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
      id: "public",
      label: "Public",
      count: items.value.filter((item) => !item.data.permissionId).length,
    },
  ];

  return {
    base: baseLists,
    public: publicLists,
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
  if (groupMatch) return groupMatch.label;
  const publicMatch = tasklistGroups.value.public.find(
    (list) => list.id === selectedListId.value
  );
  return publicMatch?.label ?? "Tasks";
});

const selectedPermission = computed(
  () =>
    tasklistGroups.value.groups.find(
      (list) => list.id === selectedListId.value
    ) ?? null
);

const selectedPublicList = computed(
  () =>
    tasklistGroups.value.public.find(
      (list) => list.id === selectedListId.value
    ) ?? null
);

const selectedListValue = computed(() => {
  if (selectedListId.value === "public") return "base:public";
  if (selectedListId.value === "all") return "base:public";
  if (selectedPublicList.value)
    return `public-list:${selectedPublicList.value.id}`;
  return `permission:${selectedListId.value}`;
});

const selectedListDisplayLabel = computed(() => {
  if (selectedListId.value === "public") return "Public";
  if (selectedListId.value === "all") return "Public";
  if (selectedPublicList.value) return selectedPublicList.value.label;
  return selectedListLabel.value;
});

const editingListValue = computed(() => {
  if (!editingItem.value) return "base:public";
  if (editingItem.value.data.permissionId)
    return `permission:${editingItem.value.data.permissionId}`;
  if (editingItem.value.data.tasklistId)
    return `public-list:${editingItem.value.data.tasklistId}`;
  return "base:public";
});

const listLabelById = computed(() => {
  const map = new Map<string, string>();
  for (const group of permissions.value) {
    map.set(group.data.id, group.data.title);
  }
  for (const list of publicTasklists.value) {
    map.set(list.data.id, list.data.title);
  }
  return map;
});

const permissionMembers = computed(() => {
  const selected = selectedPermission.value;
  if (!selected) return [];
  const grants = Object.values(
    bridge.collections.byKind.value?.["permission-grants"] || {}
  ) as { data: { permissionId: string; identity: string } }[];
  return grants.filter((grant) => grant.data.permissionId === selected.id);
});

const usersByIdentity = computed(() => {
  const entries = Object.values(
    bridge.collections.byKind.value?.users || {}
  ) as { data: { publicIdentityKey?: string; name?: string } }[];
  const map = new Map<string, { publicIdentityKey?: string; name?: string }>();
  for (const entry of entries) {
    if (!entry?.data?.publicIdentityKey) continue;
    map.set(stripIdentityKey(entry.data.publicIdentityKey), entry.data);
  }
  return map;
});

const filteredItems = computed(() => {
  const listFiltered =
    selectedListId.value === "all"
      ? items.value
      : selectedListId.value === "public"
      ? items.value.filter((item) => !item.data.permissionId)
      : selectedPublicList.value
      ? items.value.filter(
          (item) => item.data.tasklistId === selectedListId.value
        )
      : items.value.filter(
          (item) => item.data.permissionId === selectedListId.value
        );

  if (selectedStatus.value === "active") {
    return listFiltered.filter((item) => !item.data.completed);
  }
  if (selectedStatus.value === "completed") {
    return listFiltered.filter((item) => item.data.completed);
  }
  return listFiltered;
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

watch(isListDialogOpen, (nextValue) => {
  if (nextValue) return;
  newListTitle.value = "";
  newListMember.value = null;
  newListMembers.value = [];
  isPublicList.value = false;
});

watch(isEditDialogOpen, (nextValue) => {
  if (nextValue) return;
  editingItem.value = null;
});

async function addTodoItem(payload: {
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

async function completeItem(item: LedgerItem) {
  await addItem(
    {
      ...item,
      completed: !item.completed,
      ...(item.assignedTo?.id ? { assignedTo: item.assignedTo.id } : {}),
      updatedAt: Date.now(),
    },
    "todos",
    item.permissionId ?? item.permission ?? null
  );
}

function openAddDialog() {
  if (!canAddItem.value) return;
  isAddDialogOpen.value = true;
}

function closeAddDialog() {
  isAddDialogOpen.value = false;
}

function openListDialog() {
  if (!canAddItem.value) return;
  isListDialogOpen.value = true;
}

function closeListDialog() {
  isListDialogOpen.value = false;
}

function openMembersDialog() {
  if (!selectedPermission.value) return;
  isMembersDialogOpen.value = true;
}

function addNewListMember() {
  if (!newListMember.value) {
    isPublicList.value = true;
    newListMembers.value = [];
    return;
  }
  const next = newListMember.value;
  const exists = newListMembers.value.some(
    (member) => member?.publicIdentityKey === next?.publicIdentityKey
  );
  if (!exists) newListMembers.value = [...newListMembers.value, next];
  if (newListMembers.value.length) isPublicList.value = false;
  newListMember.value = null;
}

async function addTasklist() {
  const title = newListTitle.value.trim();
  if (!title) return;
  if (isPublicList.value) {
    await addItem(
      {
        id: generateId(),
        title,
        public: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      "tasklists"
    );
    closeListDialog();
    return;
  }
  const permission = await createPermission(title);
  if (permission?.id && newListMembers.value.length) {
    for (const member of newListMembers.value) {
      if (!member?.publicIdentityKey || !member?.publicEncryptionKey) continue;
      await addUserPermission(
        permission.id,
        member.publicIdentityKey,
        member.publicEncryptionKey
      );
    }
  }
  closeListDialog();
}

async function addUserToList(permissionId: string) {
  const selectedUser = selectedUsersByPermission[permissionId];
  if (!selectedUser) return;
  await addUserPermission(
    permissionId,
    selectedUser.publicIdentityKey,
    selectedUser.publicEncryptionKey
  );
  selectedUsersByPermission[permissionId] = null;
}

function openEditDialog(item: ItemEntry) {
  if (!canAddItem.value || item.data.keyMissing) return;
  editingItem.value = item;
  isEditDialogOpen.value = true;
}

function closeEditDialog() {
  isEditDialogOpen.value = false;
}

async function updateTodoItem(payload: {
  title: string;
  assigneeId?: string | null;
  permissionId?: string | null;
  tasklistId?: string | null;
  boardColumnId?: string | null;
}) {
  if (!editingItem.value) return;
  const current = editingItem.value.data;
  await addItem(
    {
      ...current,
      title: payload.title,
      assignedTo: payload.assigneeId ?? null,
      boardColumnId: payload.boardColumnId ?? null,
      tasklistId: payload.tasklistId ?? null,
      updatedAt: Date.now(),
    },
    "todos",
    payload.permissionId ?? current.permissionId ?? current.permission ?? null
  );
}
</script>
<template>
  <div class="w-full flex flex-1 min-h-0 font-mono">
    <aside
      class="hidden lg:flex flex-col w-64 border-r border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 gap-4"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-end">
          <Button
            type="button"
            size="xs"
            variant="plain-secondary"
            class="text-xs tracking-[0.16em]"
            @click="openListDialog"
          >
            Add list
          </Button>
        </div>
        <SListButton
          v-for="list in tasklistGroups.base"
          :key="list.id"
          :active="selectedListId === list.id"
          variant="primary"
          :count="list.count"
          @click="selectedListId = list.id"
          size="sm"
        >
          <span class="truncate">{{ list.label }}</span>
        </SListButton>
        <SListButton
          v-for="list in tasklistGroups.public"
          :key="list.id"
          :active="selectedListId === list.id"
          variant="primary"
          :count="list.count"
          @click="selectedListId = list.id"
          size="sm"
        >
          <span class="truncate">{{ list.label }}</span>
        </SListButton>
        <SListButton
          v-for="list in tasklistGroups.groups"
          :key="list.id"
          :active="selectedListId === list.id"
          variant="secondary"
          :count="list.count"
          @click="selectedListId = list.id"
          size="sm"
        >
          <template #icon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-3 opacity-70"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </template>
          <span class="truncate">{{ list.label }}</span>
        </SListButton>
      </div>
    </aside>

    <section class="flex-1 flex flex-col gap-4 min-h-0">
      <header
        class="sticky top-0 z-10 flex flex-wrap gap-3 items-center justify-between px-4 py-3 backdrop-blur border-b border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 90%, transparent)]"
      >
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-thin">{{ selectedListLabel }}</h2>
          <span class="text-xs text-[var(--ui-fg-muted)]">
            {{ filteredItems.length }} tasks
          </span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <SSegmentedControl
            v-model="selectedStatus"
            :items="statusOptions"
            size="xs"
            aria-label="Task status"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            :disabled="!canAddItem"
            @click="openAddDialog"
          >
            <span
              class="flex items-center justify-center size-6 rounded-full border border-[var(--ui-border)]"
            >
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
            </span>
            Add task
          </Button>
          <Button
            v-if="selectedPermission"
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            @click="openMembersDialog"
          >
            <span
              class="flex items-center justify-center size-6 rounded-full border border-[var(--ui-border)]"
            >
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
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-7.346A9 9 0 0 0 12 3a9 9 0 0 0-9.741 8.374A9.094 9.094 0 0 0 6 18.72M12 9.75a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
                />
              </svg>
            </span>
            Members ({{ permissionMembers.length }})
          </Button>
        </div>
      </header>

      <div class="lg:hidden flex gap-2 overflow-x-auto pb-2">
        <SListButton
          v-for="list in tasklistGroups.base"
          :key="list.id"
          size="sm"
          :full-width="false"
          :active="selectedListId === list.id"
          variant="primary"
          class="shrink-0"
          @click="selectedListId = list.id"
        >
          {{ list.label }}
        </SListButton>
        <SListButton
          v-for="list in tasklistGroups.public"
          :key="list.id"
          size="sm"
          :full-width="false"
          :active="selectedListId === list.id"
          variant="primary"
          class="shrink-0"
          @click="selectedListId = list.id"
        >
          {{ list.label }}
        </SListButton>
        <SListButton
          v-for="list in tasklistGroups.groups"
          :key="list.id"
          size="sm"
          :full-width="false"
          :active="selectedListId === list.id"
          variant="secondary"
          class="shrink-0"
          @click="selectedListId = list.id"
        >
          {{ list.label }}
        </SListButton>
      </div>

      <div class="overflow-hidden flex-1">
        <div class="flex-1 overflow-auto min-h-0 flex flex-col gap-3">
          <ul
            class="w-full flex flex-col border-b border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))]"
          >
            <li
              v-for="item in filteredItems"
              :key="item.entryId"
              class="border-b border-[var(--ui-border)] last:border-b-0"
            >
              <div
                class="flex items-center gap-3 px-3 py-2 text-sm transition"
                :class="
                  item.entryId === activeEntryId
                    ? 'bg-[var(--ui-surface-hover)]'
                    : 'hover:bg-[var(--ui-surface-hover)]/70'
                "
                @click="activeEntryId = item.entryId"
              >
                <Button
                  v-if="!item.data.keyMissing"
                  type="button"
                  size="xs"
                  variant="plain-secondary"
                  class="!h-7 !w-7 !px-0 !rounded-full border border-[var(--ui-border)] text-[var(--ui-fg-muted)]"
                  :class="
                    item.data.completed
                      ? 'text-[var(--ui-success)] border-[var(--ui-success)]/50'
                      : 'hover:border-[var(--ui-secondary)]/70'
                  "
                  @click.stop="completeItem(item.data)"
                  aria-label="Toggle completion"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="size-4"
                    :class="item.data.completed ? '' : 'opacity-30'"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.704 5.293a1 1 0 0 1 .003 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.793 2.793 6.543-6.543a1 1 0 0 1 1.411 0Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </Button>
                <span
                  v-else
                  class="flex items-center justify-center size-7 rounded-full border border-[var(--ui-border)] text-[var(--ui-critical)] opacity-70"
                  aria-label="Insufficient permission"
                >
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
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </span>

                <div class="flex-1 min-w-0">
                  <p
                    class="truncate"
                    :class="
                      item.data.completed
                        ? 'line-through text-[var(--ui-fg-muted)]'
                        : 'text-[var(--ui-fg)]'
                    "
                  >
                    {{
                      item.data.keyMissing
                        ? "Insufficient permission"
                        : item.data.title
                    }}
                  </p>
                </div>

                <div
                  class="ml-auto flex items-center gap-2 text-xs text-[var(--ui-fg-muted)]"
                >
                  <Button
                    v-if="!item.data.keyMissing"
                    type="button"
                    size="xs"
                    variant="plain-secondary"
                    class="!h-7 !w-7 !px-0 !rounded-full border border-[var(--ui-border)] text-[var(--ui-fg-muted)] transition hover:border-[var(--ui-secondary)]/70 hover:text-[var(--ui-fg)]"
                    aria-label="Edit task"
                    @click.stop="openEditDialog(item)"
                  >
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
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M19.5 7.125 16.862 4.487"
                      />
                    </svg>
                  </Button>
                  <IdentityAvatar
                    v-if="item.data?.assignedTo?.publicIdentityKey"
                    :identity="item.data.assignedTo.publicIdentityKey"
                    size="xs"
                  />
                  <SBadge
                    v-if="item.data.permissionId"
                    size="xs"
                    tone="secondary"
                    variant="outline"
                    class="flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="size-3"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                    Private
                  </SBadge>
                  <SBadge
                    v-if="item.data.boardColumnId"
                    size="xs"
                    tone="neutral"
                    variant="outline"
                  >
                    {{
                      boardColumnLabelById.get(item.data.boardColumnId ?? "") ||
                      "Board"
                    }}
                  </SBadge>
                  <SBadge
                    v-if="item.data?.createdAt"
                    size="xs"
                    tone="neutral"
                    variant="outline"
                  >
                    {{
                      formatDate(item.data.createdAt, { dateStyle: "medium" })
                    }}
                  </SBadge>
                </div>
              </div>
            </li>
            <li v-if="!filteredItems.length" class="py-8 px-3 text-sm">
              <div
                class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                No tasks yet. Use the add task button to get started.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <SDialog
      v-model:open="isAddDialogOpen"
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
        :on-create="addTodoItem"
        :list-options="listOptions"
        :initial-list-value="selectedListValue"
        :list-label="selectedListDisplayLabel"
        :board-columns="boardColumnOptions"
        force-expanded
        class="rounded-none border-0 shadow-none"
        @created="closeAddDialog"
      />
    </SDialog>

    <SDialog
      v-if="editingItem"
      v-model:open="isEditDialogOpen"
      size="lg"
      title="Edit task"
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
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 7.125 16.862 4.487"
          />
        </svg>
      </template>
      <TodoQuickAdd
        :on-create="updateTodoItem"
        :initial-title="editingItem.data.title"
        :initial-assignee="editingItem.data.assignedTo ?? null"
        :fixed-list-value="editingListValue"
        :list-label="
          listLabelById.get(
            editingItem.data.permissionId ?? editingItem.data.tasklistId ?? ''
          ) || 'Public'
        "
        :list-options="listOptions"
        :board-columns="boardColumnOptions"
        :initial-board-column-id="editingItem.data.boardColumnId ?? null"
        submit-label="Save changes"
        force-expanded
        class="rounded-none border-0 shadow-none"
        @created="closeEditDialog"
      />
    </SDialog>

    <SDialog v-model:open="isListDialogOpen" title="Create list">
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
          List name
        </label>
        <input
          v-model="newListTitle"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. Product launch"
        />
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Add members
        </div>
        <div class="flex flex-col gap-2">
          <UserPicker v-model="newListMember" />
          <Button
            type="button"
            size="xs"
            variant="secondary"
            @click="addNewListMember"
          >
            Add member
          </Button>
          <div
            v-if="isPublicList"
            class="flex items-center gap-2 border border-[var(--ui-border)] px-2 py-1 text-xs"
          >
            <span class="uppercase tracking-[0.12em] opacity-70">
              Public list
            </span>
            <Button
              type="button"
              size="xs"
              variant="plain-secondary"
              class="text-[11px] uppercase tracking-[0.12em]"
              @click="isPublicList = false"
            >
              Remove
            </Button>
          </div>
          <div
            v-if="newListMembers.length"
            class="flex flex-wrap items-center gap-2 text-xs"
          >
            <div
              v-for="member in newListMembers"
              :key="member?.publicIdentityKey"
              class="flex items-center gap-2 border border-[var(--ui-border)] px-2 py-1"
            >
              <IdentityAvatar
                v-if="member?.publicIdentityKey"
                :identity="member.publicIdentityKey"
                size="xs"
              />
              <span class="max-w-[10rem] truncate">
                {{ member?.name || member?.publicIdentityKey }}
              </span>
              <Button
                type="button"
                size="xs"
                variant="plain-secondary"
                class="text-[11px] uppercase tracking-[0.12em]"
                @click="
                  newListMembers = newListMembers.filter(
                    (entry) =>
                      entry?.publicIdentityKey !== member?.publicIdentityKey
                  )
                "
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
        <Button type="button" size="sm" variant="primary" @click="addTasklist">
          Create list
        </Button>
      </div>
    </SDialog>

    <SDialog
      v-if="selectedPermission"
      v-model:open="isMembersDialogOpen"
      :title="`${selectedPermission.label} members`"
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
            d="M18 18.72a9.094 9.094 0 0 0 3.741-7.346A9 9 0 0 0 12 3a9 9 0 0 0-9.741 8.374A9.094 9.094 0 0 0 6 18.72M12 9.75a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
          />
        </svg>
      </template>
      <div class="flex flex-col gap-3">
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Add member
        </div>
        <div class="flex flex-col gap-2">
          <UserPicker
            v-model="selectedUsersByPermission[selectedPermission.id]"
          />
          <Button
            type="button"
            size="xs"
            variant="secondary"
            @click="addUserToList(selectedPermission.id)"
          >
            Add to list
          </Button>
        </div>
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Members
        </div>
        <div
          v-if="permissionMembers.length"
          class="flex flex-wrap items-center gap-2 text-xs"
        >
          <div
            v-for="member in permissionMembers"
            :key="member.data.identity"
            class="flex items-center gap-2 border border-[var(--ui-border)] px-2 py-1"
          >
            <IdentityAvatar
              :identity="
                usersByIdentity.get(member.data.identity)?.publicIdentityKey ||
                member.data.identity
              "
              size="xs"
            />
            <span class="max-w-[12rem] truncate">
              {{
                usersByIdentity.get(member.data.identity)?.name ||
                member.data.identity
              }}
            </span>
          </div>
        </div>
        <div v-else class="text-xs opacity-60">No members yet.</div>
      </div>
    </SDialog>
  </div>
</template>

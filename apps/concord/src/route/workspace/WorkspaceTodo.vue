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

watch(
  items,
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
  <div class="w-full flex flex-col flex-1 gap-4">
    <header
      class="sticky top-0 z-10 flex justify-between items-center px-3 text-xs"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <p class="opacity-70">{{ items.length }} items</p>
        </div>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <input type="checkbox" id="hidePrivate" v-model="hidePrivateItems" />
        <label for="hidePrivate" class="opacity-70">Hide private</label>
      </div>
    </header>

    <section class="flex-1 flex flex-col gap-3 min-h-0">
      <div class="overflow-hidden flex-1">
        <div class="flex-1 overflow-auto min-h-0 flex flex-col">
          <ul class="w-full flex flex-col gap-3">
            <li v-if="canAddItem">
              <TodoQuickAdd
                :permissions="permissions"
                :on-create="addTodoItem"
              />
            </li>
            <li v-for="item in items" :key="item.entryId">
              <TodoItemCard
                :item="item"
                :active="item.entryId === activeEntryId"
                :format-date="formatDate"
                @toggle="completeItem"
                @activate="activeEntryId = item.entryId"
              />
            </li>
            <li v-if="!items.length" class="py-6 px-3 text-sm opacity-60">
              No items yet. Add your first task below.
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { generateId } from "ternent-utils";

import { useLedger } from "../../module/ledger/useLedger";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import TodoQuickAdd from "./TodoQuickAdd.vue";

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

const quickAddHeight = shallowRef(0);
</script>
<template>
  <div class="mx-auto w-full max-w-160 flex flex-col flex-1 gap-4">
    <header
      class="sticky top-0 bg-[var(--ui-bg)] py-2 z-10 flex justify-between items-center border-b border-[var(--ui-border)] px-3"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl">Todo list.</h1>
          <p class="text-sm opacity-70">{{ items.length }} items</p>
        </div>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <input type="checkbox" id="hidePrivate" v-model="hidePrivateItems" />
        <label for="hidePrivate" class="text-sm opacity-70">Hide private</label>
      </div>
    </header>

    <section class="flex-1 flex flex-col gap-3 min-h-0">
      <div class="overflow-hidden flex-1">
        <div
          class="flex-1 overflow-auto min-h-0 flex flex-col"
          :style="{ paddingBottom: `${quickAddHeight}px` }"
        >
          <ul class="w-full divide-y divide-[var(--ui-border)]">
            <li
              v-for="item in items"
              :key="item.entryId"
              class="py-3 px-3 flex items-center justify-between gap-3"
            >
              <span
                v-if="item.data.keyMissing"
                class="p-2 opacity-40 flex items-center justify-center rounded-full border border-[var(--ui-border)] text-[var(--ui-critical)] cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-4 text-[var(--ui-critical)]"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </span>

              <button
                v-else
                @click="completeItem(item.data)"
                class="flex items-center gap-3 text-left"
              >
                <span
                  class="p-1 flex items-center justify-center rounded-full border border-[var(--ui-border)] opacity-80 cursor-pointer hover:border-[var(--ui-secondary)] transition-colors"
                  :class="{
                    'text-[var(--ui-success)] opacity-100': item.data.completed,
                  }"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </span>
              </button>
              <div class="flex flex-col gap-1 flex-1">
                <span
                  v-if="item.data.keyMissing"
                  class="text-sm blur-sm cursor-not-allowed opacity-50"
                >
                  Insufficient permission
                </span>
                <span
                  v-else
                  class="text-lg font-thin"
                  :class="item.data.completed ? 'line-through opacity-60 ' : ''"
                >
                  {{ item.data.title }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <IdentityAvatar
                  v-if="item.data?.assignedTo?.publicIdentityKey"
                  :identity="item.data.assignedTo.publicIdentityKey"
                  size="sm"
                />
                <!-- {{ formatDate(item.data?.createdAt) }} -->
                <span
                  v-if="item.data.permission"
                  class="p-2 opacity-60 flex items-center justify-center rounded-full"
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
              </div>
            </li>
            <li v-if="!items.length" class="py-6 px-3 text-sm opacity-60">
              No items yet. Add your first task below.
            </li>
          </ul>
        </div>
      </div>
      <TodoQuickAdd
        v-if="canAddItem"
        ref="quickAddRef"
        :permissions="permissions"
        :on-create="addTodoItem"
      />
    </section>
  </div>
</template>

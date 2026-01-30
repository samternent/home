<script setup lang="ts">
import { computed, ref } from "vue";
import { generateId } from "ternent-utils";

import { useLedger } from "../../module/ledger/useLedger";
import { useEpochs } from "../../module/epoch/useEpochs";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import TodoQuickAdd from "./TodoQuickAdd.vue";

const { bridge, addItem } = useLedger();
const { activeEpochResult, legacyEpochPlacement } = useEpochs();

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

const items = computed(() =>
  Object.values(bridge.collections.byKind.value?.todos || {}).map((item) => {
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
const hasEpoch = computed(() => !!activeEpochResult.value.epoch);

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
    },
    "todos",
    item.permission
  );
}

const quickAddRef = ref<HTMLElement | null>(null);
const quickAddHeight = ref(0);

function updateQuickAddHeight() {
  quickAddHeight.value = quickAddRef.value?.offsetHeight || 0;
}

function shortKey(value?: string, size = 8) {
  return value ? value.slice(0, size) : "";
}
</script>
<template>
  <div class="mx-auto w-full max-w-160 flex flex-col flex-1 gap-4">
    <header class="sticky top-0 bg-[var(--ui-bg)] py-2 z-10">
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl">Todo list.</h1>
          <p class="text-sm opacity-70">{{ items.length }} items</p>
        </div>
      </div>
      <div v-if="!hasEpoch" class="text-xs text-yellow-700 mt-2">
        No epoch yet. Create one to enable encrypted items.
      </div>
      <div v-if="legacyEpochPlacement" class="text-xs text-yellow-700 mt-1">
        Legacy ledger: initial epoch not in genesis.
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
              <button
                @click="completeItem(item.data)"
                class="flex items-center gap-3 text-left"
                :disabled="item.data.keyMissing"
              >
                <span
                  class="size-8 flex items-center justify-center rounded-full border border-[var(--ui-border)]"
                  :class="item.data.completed ? 'opacity-100' : 'opacity-40'"
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
                  class="text-sm text-red-600"
                >
                  Missing key for epoch
                  {{ shortKey(item.data.encryptionKeyId) }}
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
        :epoch-ready="hasEpoch"
        :on-create="addTodoItem"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { generateId } from "ternent-utils";

import { useLedger } from "../../module/ledger/useLedger";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";

const { api, bridge } = useLedger();

type LedgerItem = {
  id: string;
  title: string;
  completed?: boolean;
  assignedTo?: boolean;
  [key: string]: unknown;
};

type ItemEntry = {
  entryId: string;
  data: LedgerItem;
};

const items = computed(() =>
  Object.values(bridge.collections.byKind.value?.items || {}).map((item) => {
    const assignee = bridge.collections.get("users", item.data.assignedTo);

    return {
      entryId: item.entryId,
      data: {
        ...item.data,
        assignedTo: assignee?.data,
      },
    };
  })
);

const users = computed<ItemEntry[]>(
  () =>
    Object.values(bridge.collections.byKind.value?.users || {}) as ItemEntry[]
);
const permissions = computed<ItemEntry[]>(
  () =>
    Object.values(
      bridge.collections.byKind.value?.permissions || {}
    ) as ItemEntry[]
);

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);
const itemTitle = shallowRef<string>("");
const assignedToId = shallowRef(null);
const permissionId = shallowRef(null);

async function addItem() {
  const id = generateId();
  await api.addAndStage({
    kind: "items",
    payload: { id, title: itemTitle.value, assignedTo: assignedToId.value },
  });
  itemTitle.value = "";
  assignedToId.value = null;
}

async function completeItem(item: LedgerItem) {
  await api.addAndStage({
    kind: "items",
    payload: {
      ...item,
      completed: !item.completed,
      assignedTo: item.assignedTo?.id,
    },
  });
}

const assignedTo = computed(() =>
  bridge.collections.get("users", assignedToId.value)
);
</script>
<template>
  <div
    class="p-4 mx-auto max-w-140 w-full flex flex-col flex-1 justify-between"
  >
    <h1 class="sticky top-0 bg-[var(--paper)]">TODO list</h1>
    <ul class="w-full my-4 py-3 flex-1">
      <li
        v-for="item in items"
        :key="item.entryId"
        class="py-1 flex items-center w-full justify-between"
      >
        <button
          @click="completeItem(item.data)"
          class="flex gap-2 items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
            :class="item.data.completed ? 'text-green-500' : 'text-gray-300'"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          {{ item.data.title }}
        </button>
        <div v-if="item.data.assignedTo">
          <IdentityAvatar
            v-if="item.data?.assignedTo?.publicIdentityKey"
            :identity="item.data.assignedTo.publicIdentityKey"
            size="xs"
          />
        </div>
      </li>
    </ul>
    <div
      v-if="canAddItem"
      class="flex flex-col items-center w-full sticky bottom-0 bg-[var(--paper)] py-4 gap-2"
    >
      <div class="flex flex-1 gap-2 w-full">
        <input
          v-model="itemTitle"
          type="text"
          placeholder="Item title"
          class="border py-2 px-4 border-[var(--rule)] flex-1 rounded-full"
        />
        <button @click="addItem">Add item</button>
      </div>
      <div
        v-if="users.length"
        class="flex gap-2 items-center w-full p-2 text-sm"
      >
        Assignee:
        <div class="flex gap-4 items-center p-2 h-10 rounded-full">
          <select
            v-model="assignedToId"
            class="text-xs w-40 border py-1 px-2 rounded-full border-[var(--rule)]"
          >
            <option :value="null" :selected="!assignedToId">anyone</option>
            <option v-for="user in users" :key="user" :value="user.data.id">
              {{ user.data.name }}
            </option>
          </select>
          <IdentityAvatar
            v-if="assignedTo?.data.publicIdentityKey"
            :identity="assignedTo.data.publicIdentityKey"
            size="xs"
          />
        </div>
      </div>
      <div
        v-if="permissions.length"
        class="flex gap-2 items-center w-full p-2 text-sm"
      >
        Permission:
        <div class="flex gap-4 items-center p-2 h-10 rounded-full">
          <select
            v-model="permissionId"
            class="text-xs w-40 border py-1 px-2 rounded-full border-[var(--rule)]"
          >
            <option :value="null" :selected="!permissionId">anyone</option>
            <option
              v-for="permission in permissions"
              :key="permission.data.id"
              :value="permission.data.id"
            >
              {{ permission.data.name }}
            </option>
          </select>
          <IdentityAvatar
            v-if="assignedTo?.data.publicIdentityKey"
            :identity="assignedTo.data.publicIdentityKey"
            size="xs"
          />
        </div>
      </div>
    </div>
  </div>
</template>

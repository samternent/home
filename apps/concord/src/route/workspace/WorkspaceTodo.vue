<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { generateId } from "ternent-utils";

import { useLedger } from "../../module/ledger/useLedger";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import UserPicker from "../../module/user/UserPicker.vue";

const { bridge, addItem } = useLedger();

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
const itemTitle = shallowRef<string>("");
const selectedUser = shallowRef();
const permissionId = shallowRef();

async function addTodoItem() {
  const id = generateId();
  await addItem(
    {
      id,
      title: itemTitle.value,
      ...(selectedUser.value ? { assignedTo: selectedUser.value.id } : {}),
    },
    "todos",
    permissionId.value
  );
  itemTitle.value = "";
  selectedUser.value = null;
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
        <button @click="addTodoItem">Add item</button>
      </div>
      Assignee: <UserPicker v-model="selectedUser" />
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
            <option :value="null" :selected="!permissionId">public</option>
            <option
              v-for="permission in permissions"
              :key="permission.data.id"
              :value="permission.data.id"
            >
              {{ permission.data.title }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

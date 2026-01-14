<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useLedger } from "../../module/ledger/useLedger";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import UserPicker from "../../module/user/UserPicker.vue";

const { bridge, createPermission, addUserPermission } = useLedger();

type PermissionGroup = {
  id: string;
  title: string;
  public: string;
  createdBy: string;
};

type PermissionGrant = {
  id: string;
  permissionId: string;
  identity: string;
  secret: string;
};

type PermissionGroupEntry = {
  entryId: string;
  data: PermissionGroup;
};

type PermissionGrantEntry = {
  entryId: string;
  data: PermissionGrant;
};

const permissionGroups = computed<PermissionGroupEntry[]>(
  () =>
    Object.values(
      bridge.collections.byKind.value?.["permission-groups"] || {}
    ) as PermissionGroupEntry[]
);

const permissionGrantsByPermissionId = computed<
  Record<string, PermissionGrantEntry[]>
>(() => {
  const grants = Object.values(
    bridge.collections.byKind.value?.["permission-grants"] || {}
  ) as PermissionGrantEntry[];
  const grouped: Record<string, PermissionGrantEntry[]> = {};

  for (const grant of grants) {
    const permissionId = grant.data.permissionId;
    if (!grouped[permissionId]) grouped[permissionId] = [];
    grouped[permissionId].push(grant);
  }

  return grouped;
});

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);

const selectedUser = shallowRef();
const permissionTitle = shallowRef("");

async function addPermission() {
  await createPermission(permissionTitle.value);
  permissionTitle.value = "";
}

async function addUserToPermission(permissionId: string) {
  await addUserPermission(
    permissionId,
    selectedUser.value.publicIdentityKey,
    selectedUser.value.publicEncryptionKey
  );
}
</script>
<template>
  <div class="p-4 mx-auto max-w-140 w-full">
    <h1>Permissions</h1>

    <div
      v-for="permissionEntry in permissionGroups"
      :key="permissionEntry.entryId"
    >
      <h2>{{ permissionEntry.data.title }}</h2>

      <div class="flex items-center gap-2">
        <span>Grants:</span>
        <div
          v-for="grant in permissionGrantsByPermissionId[
            permissionEntry.data.id
          ] || []"
          :key="grant.entryId"
        >
          <IdentityAvatar :identity="grant.data.identity" size="xs" />
        </div>
      </div>

      <div class="flex items-center gap-2">
        Add user: <UserPicker v-model="selectedUser" />
        <button @click="addUserToPermission(permissionEntry.data.id)">
          Add user
        </button>
      </div>
    </div>
    <div
      v-if="canAddItem"
      class="flex flex-col items-center w-full sticky bottom-0 bg-[var(--paper)] py-4 gap-2"
    >
      <div class="flex flex-1 gap-2 w-full">
        <input
          v-model="permissionTitle"
          type="text"
          placeholder="Item title"
          class="border py-2 px-4 border-[var(--rule)] flex-1 rounded-full"
        />
      </div>
      <div class="flex flex-1 gap-2 w-full">
        <button @click="addPermission">Add permission</button>
      </div>
    </div>
  </div>
</template>

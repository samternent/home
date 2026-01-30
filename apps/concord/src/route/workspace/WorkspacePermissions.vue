<script setup lang="ts">
import { computed, reactive, shallowRef } from "vue";
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

const selectedUsersByPermission = reactive<Record<string, any>>({});
const permissionTitle = shallowRef("");

async function addPermission() {
  await createPermission(permissionTitle.value);
  permissionTitle.value = "";
}

async function addUserToPermission(permissionId: string) {
  const selectedUser = selectedUsersByPermission[permissionId];
  if (!selectedUser) return;
  await addUserPermission(
    permissionId,
    selectedUser.publicIdentityKey,
    selectedUser.publicEncryptionKey
  );
  selectedUsersByPermission[permissionId] = null;
}
</script>
<template>
  <div class="mx-auto w-full max-w-160 flex flex-col flex-1 gap-4">
    <header class="sticky top-0 bg-[var(--ui-bg)] py-2 z-10">
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl">Permissions.</h1>
          <p class="text-sm opacity-70">{{ permissionGroups.length }} groups</p>
        </div>
      </div>
    </header>

    <section class="flex-1 flex flex-col gap-3 min-h-0">
      <div class="overflow-auto">
        <div class="divide-y divide-[var(--ui-border)]">
          <div
            v-for="permissionEntry in permissionGroups"
            :key="permissionEntry.entryId"
            class="p-4 flex flex-col gap-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex flex-col gap-1">
                <h2 class="text-lg font-thin">
                  {{ permissionEntry.data.title }}
                </h2>
                <p class="text-xs opacity-60">
                  {{
                    (
                      permissionGrantsByPermissionId[permissionEntry.data.id] ||
                      []
                    ).length
                  }}
                  grants
                </p>
              </div>
              <div class="flex items-center gap-2">
                <IdentityAvatar
                  v-for="grant in permissionGrantsByPermissionId[
                    permissionEntry.data.id
                  ] || []"
                  :key="grant.entryId"
                  :identity="grant.data.identity"
                  size="xs"
                />
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <div class="text-xs uppercase tracking-wide opacity-60">
                Add member
              </div>
              <div class="flex flex-1 min-w-[12rem] items-center gap-2">
                <UserPicker
                  v-model="selectedUsersByPermission[permissionEntry.data.id]"
                />
                <button
                  class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-xs"
                  @click="addUserToPermission(permissionEntry.data.id)"
                >
                  Add grant
                </button>
              </div>
            </div>
          </div>
          <div v-if="!permissionGroups.length" class="p-4 text-sm opacity-60">
            No permissions yet.
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="canAddItem"
      class="border border-[var(--ui-border)] rounded-2xl p-4 flex flex-col gap-3"
    >
      <h2 class="text-sm uppercase tracking-wide opacity-60">
        Create permission
      </h2>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="permissionTitle"
          type="text"
          placeholder="Permission title"
          class="border py-2 px-4 border-[var(--ui-border)] flex-1 rounded-full"
        />
        <button
          class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-xs"
          @click="addPermission"
        >
          Add permission
        </button>
      </div>
    </div>
  </div>
</template>

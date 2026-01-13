<script setup lang="ts">
import { computed, shallowRef } from "vue";
import {
  stripIdentityKey,
  stripEncryptionFile,
  generateId,
} from "ternent-utils";

import { encrypt, generate as generateEncryptionKeys } from "ternent-encrypt";

import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import { useEncryption } from "../../module/encryption/useEncryption";
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

const { publicKeyPEM } = useIdentity();
const { publicKey } = useEncryption();

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

const permissionTitle = shallowRef("");
const permissionUserId = shallowRef(null);
const permissionUser = computed(() =>
  users.value.find((user) => user.entryId === permissionUserId.value)
);

async function addPermission() {
  const id = generateId();

  const [encryptionSecret, encryptionPublic] = await generateEncryptionKeys();

  await api.addAndStage({
    kind: "permissions",
    payload: {
      id,
      grants: [
        {
          identity: stripIdentityKey(publicKeyPEM.value),
          public: encryptionPublic,
          secret: stripEncryptionFile(
            await encrypt(publicKey.value, encryptionSecret)
          ),
        },
      ],

      title: permissionTitle.value,
    },
  });
  permissionTitle.value = "";
}
</script>
<template>
  <div class="p-4 mx-auto max-w-140 w-full">
    <h1>Permissions</h1>

    <div v-for="{ data: permission } in permissions" :key="permission.entryId">
      <h2>{{ permission.title }}</h2>
      <table
        v-for="grant in permission.grants"
        :key="`${permission.entryId}${grant.identity}`"
        class="w-full"
      >
        <thead>
          <tr>
            <th class="text-left p-2">Identity</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-t border-[var(--rule)] py-2">
            <td class="p-2">{{ grant.identity }}</td>
          </tr>
        </tbody>
      </table>
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
      <!-- <div
        v-if="users.length"
        class="flex gap-2 items-center w-full p-2 text-sm"
      >
        Assignee:
        <div class="flex gap-4 items-center p-2 h-10 rounded-full">
          <select
            v-model="permissionUserId"
            class="text-xs w-40 border py-1 px-2 rounded-full border-[var(--rule)]"
          >
            <option :value="null" :selected="!permissionUserId">anyone</option>
            <option v-for="user in users" :key="user" :value="user.entryId">
              {{ user.data.name }}
            </option>
          </select>
          <IdentityAvatar
            v-if="permissionUser?.data.publicIdentityKey"
            :identity="permissionUser.data.publicIdentityKey"
            size="xs"
          />
        </div>
      </div> -->
      <div class="flex flex-1 gap-2 w-full">
        <button @click="addPermission">Add permission</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed, shallowRef } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useLocalStorage } from "@vueuse/core";
import {
  provideLedger,
  provideLedgerAppShell,
  LedgerUsers,
  LedgerDataTable,
  LedgerForm,
  LedgerCreateTable,
} from "@/modules/ledger";
import { useIdentity, IdentityAvatar } from "@/modules/identity";
import {
  Permissions,
  PermissionsTable,
  PermissionPicker,
} from "@/modules/permissions";
import { generateUsername } from "unique-username-generator";
import { stripIdentityKey, generateId } from "@concords/utils";
import { useEncryption } from "@/modules/encryption";

const router = useRouter();
const { publicKey: publicKeyEncryption } = useEncryption();

const { publicKeyPEM: publicKeyIdentityPEM } = useIdentity();

const route = useRoute();
const {
  api: { auth, load, create },
  ledger,
  getCollections,
} = provideLedger();
const { showPermissionsPanel } = provideLedgerAppShell();

const { privateKey: privateKeyIdentity, publicKey: publicKeyIdentity } =
  useIdentity();

const ledgerStorage = useLocalStorage<string>("concords/welcome/ledger", "");

onMounted(async () => {
  await auth(privateKeyIdentity.value, publicKeyIdentity.value);
  if (ledgerStorage.value) {
    await load(JSON.parse(ledgerStorage.value));
    if (route.fullPath === "/ledger/create") {
      router.push({ path: "/ledger/schema" });
    }
  }
});

const tables = shallowRef<Array<Object>>([]);
const table = useLocalStorage("concords/ledger/table", "");

watch(ledger, (_ledger: Object) => {
  ledgerStorage.value = JSON.stringify(_ledger);
  tables.value = [
    { title: "USERS", value: "users" },
    { title: "PERMISSIONS", value: "permissions" },
    ...Object.keys(getCollections())
      .filter((col) => col.includes(":types"))
      .map((col) => ({
        title: col.split(":types")[0].toUpperCase(),
        value: col.split(":types")[0],
      })),
  ];
  if (!table.value) {
    table.value = tables.value[0]?.value;
  }
});

const username = shallowRef<string>(generateUsername());

async function createLedger() {
  await create({
    identity: stripIdentityKey(publicKeyIdentityPEM.value),
    encryption: publicKeyEncryption.value,
    username: username.value,
    id: generateId(),
  });
}

const publicEncryptionKey = useLocalStorage("concords/encrypt/publicKey", "");
const privateEncryptionKey = useLocalStorage("concords/encrypt/privateKey", "");
const publicIdentityKey = useLocalStorage("concords/identity/publicKey", "");
const privateIdentityKey = useLocalStorage("concords/identity/privateKey", "");

const publicEncryptionKeyB = useLocalStorage(
  "concords/backup/encrypt/publicKey",
  ""
);
const privateEncryptionKeyB = useLocalStorage(
  "concords/backup/encrypt/privateKey",
  ""
);
const publicIdentityKeyB = useLocalStorage(
  "concords/backup/identity/publicKey",
  ""
);
const privateIdentityKeyB = useLocalStorage(
  "concords/backup/identity/privateKey",
  ""
);

const isImpersonatingUser = computed(
  () =>
    publicIdentityKeyB.value &&
    publicIdentityKey.value !== publicIdentityKeyB.value
);

const showCreateTable = shallowRef(false);
const showAddRow = shallowRef(false);
const showEditTable = shallowRef(false);
const showTableForm = shallowRef(false);

function unimpersonateUser(identity: string) {
  publicEncryptionKey.value = publicEncryptionKeyB.value;
  privateEncryptionKey.value = privateEncryptionKeyB.value;
  publicIdentityKey.value = publicIdentityKeyB.value;
  privateIdentityKey.value = privateIdentityKeyB.value;

  publicEncryptionKeyB.value = null;
  privateEncryptionKeyB.value = null;
  publicIdentityKeyB.value = null;
  privateIdentityKeyB.value = null;

  window.location.reload();
}

const canEditTable = computed(
  () => !["users", "permissions"].includes(table.value)
);
</script>
<template>
  <div class="w-full flex-1 flex flex-col">
    <VAlert v-if="isImpersonatingUser">
      <div class="flex items-center">
        Impersonating
        <IdentityAvatar
          :identity="publicKeyIdentityPEM"
          size="sm"
          class="mx-2"
        />
        <VBtn variant="plain" @click="unimpersonateUser">Unimpersonate</VBtn>
      </div>
    </VAlert>
    <div
      class="flex flex-col md:flex-row items-end md:items-start md:justify-between p-2"
    >
      <div class="w-full md:w-auto sm:mx-auto md:mx-0">
        <VSelect
          variant="outlined"
          v-model="table"
          :items="tables"
          density="compact"
        />
      </div>
      <div>
        <VBtnGroup border rounded="pill" density="comfortable">
          <VBtn class="mx-2" @click="showAddRow = true">Add data</VBtn>

          <VDivider vertical inset />

          <VMenu location="bottom right">
            <template #activator="{ props }">
              <VBtn v-bind="props"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </VBtn>
            </template>

            <VList>
              <VListItem
                v-if="canEditTable"
                title="Edit Table"
                @click="showEditTable = true"
              />
              <VListItem title="Create Table" @click="showCreateTable = true" />
            </VList>
          </VMenu>
        </VBtnGroup>
      </div>
    </div>
    <div v-if="!ledger">
      <div class="mt-4">
        <p class="my-3 text-2xl font-thin w-3/4 mx-auto mt-10">
          choose a username (just for this ledger)
        </p>
        <FormKit type="text" placeholder="Username" v-model="username" />
        <button @click="createLedger">Create ledger</button>
      </div>
    </div>
    <div v-if="!table">Loading</div>
    <LedgerUsers v-else-if="table === 'users'" />
    <PermissionsTable v-else-if="table === 'permissions'" />
    <LedgerDataTable v-else :table="table" />

    <VNavigationDrawer
      v-model="showPermissionsPanel"
      location="right"
      temporary
      width="502"
      :elevation="2"
    >
      <Permissions />
    </VNavigationDrawer>
    <VNavigationDrawer
      v-model="showCreateTable"
      location="right"
      temporary
      width="502"
      :elevation="2"
    >
      <LedgerCreateTable @submit="(e: string) => (table = e)" />
    </VNavigationDrawer>
    <VNavigationDrawer
      v-model="showAddRow"
      location="right"
      temporary
      width="502"
      :elevation="2"
    >
      <LedgerForm :table="table" :key="table" />
    </VNavigationDrawer>
    <VNavigationDrawer
      v-model="showEditTable"
      location="right"
      temporary
      width="502"
      :elevation="2"
    >
      <LedgerCreateTable :table="table" :key="table" />
    </VNavigationDrawer>
    <VNavigationDrawer
      v-model="showTableForm"
      location="right"
      temporary
      width="502"
      :elevation="2"
    >
      <LedgerForm />
    </VNavigationDrawer>
  </div>
</template>

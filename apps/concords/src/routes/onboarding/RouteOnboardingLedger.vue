<script setup lang="ts">
import { onMounted, watch, computed, shallowRef } from "vue";
import { useRouter, useRoute } from "vue-router";
import { NDrawerContent, NDrawer, NAlert, NButton, NSelect } from "naive-ui";
import { useLocalStorage } from "@vueuse/core";
import {
  provideLedger,
  provideLedgerAppShell,
  LedgerUsers,
  LedgerDataTable,
  LedgerForm,
  LedgerCreateTable,
} from "@/modules/ledger";
import { useIdentity } from "@/modules/identity";
import { Permissions, PermissionsTable } from "@/modules/permissions";
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
const table = shallowRef(null);

watch(ledger, (_ledger: Object) => {
  ledgerStorage.value = JSON.stringify(_ledger);
  tables.value = [
    { label: "Users", key: "users", value: "users" },
    { label: "Permissions", key: "permissions", value: "permissions" },
    ...Object.keys(getCollections())
      .filter((col) => col.includes(":types"))
      .map((col) => ({
        label: col.split(":types")[0].toUpperCase(),
        key: col.split(":types")[0],
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
</script>
<template>
  <div class="w-full flex-1 flex flex-col">
    <NAlert title="Info Text" type="info" v-if="isImpersonatingUser">
      Your impersonating a user
      <NButton @click="unimpersonateUser">Unimpersonate</NButton>
    </NAlert>
    <div class="flex justify-end p-2">
      <NSelect class="w-40" v-model:value="table" :options="tables" />
      <NButton class="mx-2" @click="showCreateTable = true">Add table</NButton>
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
    <LedgerUsers v-if="table === 'users'" />
    <PermissionsTable v-if="table === 'permissions'" />
    <LedgerDataTable v-else :table="table" />
    <NDrawer v-model:show="showPermissionsPanel" :width="502" placement="right">
      <NDrawerContent title="Permissions">
        <Permissions />
      </NDrawerContent>
    </NDrawer>
    <NDrawer v-model:show="showCreateTable" :width="502" placement="right">
      <NDrawerContent title="Permissions">
        <LedgerCreateTable />
      </NDrawerContent>
    </NDrawer>
    <NDrawer v-model:show="showTableForm" :width="502" placement="right">
      <NDrawerContent title="Permissions">
        <LedgerForm />
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

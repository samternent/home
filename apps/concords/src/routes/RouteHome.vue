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

import {
  AppShellControlPanelMini,
  AppShellControlPanel,
} from "@/modules/appShell";

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
    <Teleport to="#TopFixedPanel">
      <div class="flex justify-between items-center w-full">
        <div class="md:mx-2 flex">
          <VSelect
            variant="solo"
            v-model="table"
            :items="tables"
            density="compact"
            theme="dark"
            rounded
            :hide-details="true"
            menu-icon="<div>hi</div>"
          >
          </VSelect>
          <button
            @click="showCreateTable = true"
            variant="outlined"
            class="ml-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        <div class="flex items-center">
          <v-text-field
            theme="dark"
            class="w-64 mr-6"
            density="compact"
            variant="solo"
            label="Search ledger"
            append-inner-icon="mdi-magnify"
            single-line
            hide-details
          ></v-text-field>
        </div>
      </div>
    </Teleport>
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
    <Teleport to="#BottomPanelBanner">
      <AppShellControlPanelMini />
    </Teleport>
    <Teleport to="#BottomPanelContent">
      <AppShellControlPanel />
    </Teleport>
    <div v-if="!ledger">
      <div class="mt-4">
        <p class="my-3 text-2xl font-thin w-3/4 mx-auto mt-10">
          choose a username (just for this ledger)
        </p>
        <FormKit type="text" placeholder="Username" v-model="username" />
        <button @click="createLedger">Create ledger</button>
      </div>
    </div>
    <div class="flex flex-1 overflow-auto">
      <div v-if="!table">Loading</div>
      <LedgerUsers v-else-if="table === 'users'" />
      <PermissionsTable v-else-if="table === 'permissions'" />
      <LedgerDataTable v-else :table="table" @edit="showEditTable = true" />
    </div>

    <transition name="slide">
      <div
        class="z-50 fixed top-14 right-0 h-screen left-16 md:left-auto md:w-[550px] px-2 bg-zinc-800 border-l border-zinc-600"
        v-if="showCreateTable"
      >
        <div class="flex justify-end w-full p-2">
          <button @click="showCreateTable = false">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        <LedgerCreateTable @submit="(e: string) => (table = e)" />
      </div>
    </transition>
    <transition name="slide">
      <div
        class="z-50 fixed top-14 right-0 h-screen left-16 md:left-auto md:w-[550px] px-2 bg-zinc-800 border-l border-zinc-600"
        v-if="showEditTable"
      >
        <div class="flex justify-end w-full p-2">
          <button @click="showEditTable = false">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        <LedgerCreateTable :table="table" :key="table" />
      </div>
    </transition>

    <!-- <VNavigationDrawer
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
    </VNavigationDrawer> -->
  </div>
</template>

<style scoped>
.slide-enter-active {
  animation: slide-in 0.3s;
}
.slide-leave-active {
  animation: slide-in 0.3s reverse;
}
@keyframes slide-in {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(0);
  }
}
</style>

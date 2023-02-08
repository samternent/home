<script setup lang="ts">
import { onMounted, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { NDrawerContent, NDrawer, NAlert, NButton } from "naive-ui";
import { useLocalStorage } from "@vueuse/core";
import { provideLedger, provideLedgerAppShell } from "@/modules/ledger";
import { useIdentity } from "@/modules/identity";
import { Permissions } from "@/modules/permissions";

const router = useRouter();
const route = useRoute();
const {
  api: { auth, load },
  ledger,
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

watch(ledger, (_ledger: Object) => {
  ledgerStorage.value = JSON.stringify(_ledger);
});

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
  <div class="w-full flex-1 mx-auto max-w-6xl px-8 flex flex-col">
    <NAlert title="Info Text" type="info" v-if="isImpersonatingUser">
      Your impersonating a user
      <NButton @click="unimpersonateUser">Unimpersonate</NButton>
    </NAlert>
    <RouterView />
    <NDrawer v-model:show="showPermissionsPanel" :width="502" placement="right">
      <NDrawerContent title="Permissions">
        <Permissions />
      </NDrawerContent>
      <NDrawerContent title="Scema">
        <Permissions />
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

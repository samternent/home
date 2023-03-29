<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { provideLedger, provideLedgerAppShell } from "@/modules/ledger";
import { useIdentity } from "@/modules/identity";

provideLedgerAppShell();
const {
  api: { auth, load },
  ledger,
  getCollections,
} = provideLedger();

const { privateKey: privateKeyIdentity, publicKey: publicKeyIdentity } =
  useIdentity();

const ledgerStorage = useLocalStorage<string>("concords/welcome/ledger", "");

watch(ledger, (_ledger) => {
  ledgerStorage.value = JSON.stringify(_ledger);
});
onMounted(async () => {
  await auth(privateKeyIdentity.value, publicKeyIdentity.value);
  if (ledgerStorage.value) {
    await load(JSON.parse(ledgerStorage.value));
  }
});
</script>
<template>
  <slot />
</template>

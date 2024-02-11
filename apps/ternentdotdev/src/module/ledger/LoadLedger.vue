<script setup>
import { onMounted, watch } from "vue";
import { stripIdentityKey, generateId } from "concords-utils";
import { useLocalStorage } from "@vueuse/core";
import { useLedger } from "./useLedger";
import { useIdentity } from "../identity/useIdentity";
import { useEncryption } from "../encryption/useEncryption";

const {
  api: { auth, load, create },
  ledger,
} = useLedger();

const ledgerStorage = useLocalStorage("ledger", "");

const {
  privateKey: privateKeyIdentity,
  publicKey: publicKeyIdentity,
  publicKeyPEM: publicKeyIdentityPEM,
} = useIdentity();
const { publicKey: publicKeyEncryption } = useEncryption();

watch(ledger, (_ledger) => {
  ledgerStorage.value = JSON.stringify(_ledger);
});
onMounted(async () => {
  await auth(privateKeyIdentity.value, publicKeyIdentity.value);
  if (ledgerStorage.value) {
    await load(JSON.parse(ledgerStorage.value));
  } else {
    await create({
      identity: stripIdentityKey(publicKeyIdentityPEM.value),
      encryption: publicKeyEncryption.value,
      id: generateId(),
    });
  }
});
</script>
<template><slot /></template>

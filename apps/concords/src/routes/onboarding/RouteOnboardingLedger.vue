<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { stripIdentityKey, generateId } from "@concords/utils";
import { provideLedger } from "@/modules/ledger";
import { useIdentity } from "@/modules/identity";
import { useEncryption } from "@/modules/encryption";

const {
  api: { auth, load, create },
  ledger,
} = provideLedger();

const {
  privateKey: privateKeyIdentity,
  publicKey: publicKeyIdentity,
  publicKeyPEM: publicKeyIdentityPEM,
} = useIdentity();

const { publicKey: publicKeyEncryption } = useEncryption();

onMounted(async () => {
  await auth(privateKeyIdentity.value, publicKeyIdentity.value);
  const ledgerStorage = useLocalStorage<string>("concords/welcome/ledger", "");
  if (ledgerStorage.value) {
    await load(JSON.parse(ledgerStorage.value));
  }
});

const username = shallowRef<string>("");

async function createLedger() {
  await create({
    identity: stripIdentityKey(publicKeyIdentityPEM.value),
    encryption: publicKeyEncryption.value,
    username: username.value,
    id: generateId(),
  });
}
</script>
<template>
  <slot v-if="ledger" />
  <div v-else>
    choose a username (just for this ledger)
    <FormKit type="text" placeholder="Username" v-model="username" />
    <FormKit type="button" @click="createLedger" />
  </div>
</template>

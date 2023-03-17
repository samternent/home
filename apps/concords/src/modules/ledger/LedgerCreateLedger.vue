<script setup lang="ts">
import { shallowRef } from "vue";
import { generateUsername } from "unique-username-generator";
import { stripIdentityKey, generateId } from "@concords/utils";
import { useLedger } from "@/modules/ledger";
import { useEncryption } from "@/modules/encryption";
import { useIdentity } from "@/modules/identity";

const { publicKey: publicKeyEncryption } = useEncryption();
const { publicKeyPEM: publicKeyIdentityPEM } = useIdentity();

const { api } = useLedger();

const username = shallowRef<string>(generateUsername());

async function createLedger() {
  await api.create({
    identity: stripIdentityKey(publicKeyIdentityPEM.value),
    encryption: publicKeyEncryption.value,
    username: username.value,
    id: generateId(),
  });
}
</script>
<template>
  <div class="flex flex-col justify-center items-center flex-1">
    <p class="my-3 text-2xl font-light mx-auto">
      choose a username
      <span class="block text-sm text-center">(just for this ledger)</span>
    </p>
    <FormKit type="text" placeholder="Username" v-model="username" />
    <VBtn @click="createLedger" class="mt-8">Create ledger</VBtn>
  </div>
</template>

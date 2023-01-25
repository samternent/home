<script lang="ts" setup>
import { shallowRef } from "vue";
import { useRouter } from "vue-router";
import { generateUsername } from "unique-username-generator";
import { stripIdentityKey, generateId } from "@concords/utils";
import { useLedger } from "@/modules/ledger";
import { useIdentity } from "@/modules/identity";
import { useEncryption } from "@/modules/encryption";

const router = useRouter();
const {
  api: { create },
} = useLedger();
const { publicKey: publicKeyEncryption } = useEncryption();

const { publicKeyPEM: publicKeyIdentityPEM } = useIdentity();

const username = shallowRef<string>(generateUsername());

async function createLedger() {
  await create({
    identity: stripIdentityKey(publicKeyIdentityPEM.value),
    encryption: publicKeyEncryption.value,
    username: username.value,
    id: generateId(),
  });
  router.push({ path: "/welcome/ledger/schema" });
}
</script>
<template>
  <div>
    choose a username (just for this ledger)
    <FormKit type="text" placeholder="Username" v-model="username" />
    <button @click="createLedger">Create ledger</button>
  </div>
</template>

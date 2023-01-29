<script lang="ts" setup>
import { shallowRef } from "vue";
import { useRouter } from "vue-router";
import { generateUsername } from "unique-username-generator";
import { stripIdentityKey, generateId } from "@concords/utils";
import { useLedger } from "@/modules/ledger";
import { useIdentity } from "@/modules/identity";
import { useEncryption } from "@/modules/encryption";
import { LayoutHeaderTitle } from "@/modules/layout";

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
  router.push({ path: "/ledger/schema" });
}
</script>
<template>
  <div class="w-full flex-1 mx-auto max-w-6xl px-8 flex flex-col animate">
    <LayoutHeaderTitle title="Create a ledger" />
    <div class="mt-4">
      <p class="my-3 text-2xl font-thin w-3/4 mx-auto mt-10">
        choose a username (just for this ledger)
      </p>
      <FormKit type="text" placeholder="Username" v-model="username" />
      <button @click="createLedger">Create ledger</button>
    </div>
  </div>
</template>

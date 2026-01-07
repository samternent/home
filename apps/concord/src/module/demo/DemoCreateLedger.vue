<script setup lang="ts">
import { stripIdentityKey, generateId } from "ternent-utils";
import { useLedger } from "../ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import { useEncryption } from "../../module/encryption/useEncryption";
import Button from "../../../../../packages/ternent-ui/src/primitives/Button/Button.vue";

const {
  api: { auth, create },
  ledger,
} = useLedger();

const { privateKey: privateKeyIdentity, publicKey: publicKeyIdentity } =
  useIdentity();

async function createLedger() {
  await auth(privateKeyIdentity.value, publicKeyIdentity.value);

  const ledger = await create();
}
</script>
<template>
  <div class="p-4">
    <Button @click="createLedger">Create Ledger</Button>
    <pre>{{ ledger }}</pre>
  </div>
</template>

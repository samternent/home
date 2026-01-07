<script setup lang="ts">
import { stripIdentityKey, generateId } from "ternent-utils";
import { useLedger } from "../ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import { useEncryption } from "../../module/encryption/useEncryption";
import Button from "../../../../../packages/ternent-ui/src/primitives/Button/Button.vue";

const {
  api: { auth, load, create },
  ledger,
} = useLedger();

const {
  publicKeyPEM: publicKeyIdentityPEM,
  privateKey: privateKeyIdentity,
  publicKey: publicKeyIdentity,
} = useIdentity();
const { publicKey: publicKeyEncryption } = useEncryption();

async function createLedger() {
  await auth(privateKeyIdentity.value, publicKeyIdentity.value);

  create({
    identity: publicKeyIdentityPEM.value,
    encryption: publicKeyEncryption.value,
    id: generateId(),
  });
}
</script>
<template>
  <div class="p-4">
    <Button @click="createLedger">Create Ledger</Button>
    <pre>{{ ledger }}</pre>
  </div>
</template>

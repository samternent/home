<script lang="ts" setup>
import { onMounted, ShallowRef, shallowRef, watchEffect } from "vue";
import {
  createIdentity,
  exportPublicKeyAsPem,
  exportPrivateKeyAsPem,
} from "@concords/identity";

const keys: ShallowRef<CryptoKeyPair | null> = shallowRef(null);

onMounted(async () => {
  keys.value = await createIdentity();
});
const publicKey: ShallowRef<string | null> = shallowRef(null);
const privateKey: ShallowRef<string | null> = shallowRef(null);

watchEffect(async () => {
  if (keys.value) {
    publicKey.value = await exportPublicKeyAsPem(keys.value?.publicKey);
    privateKey.value = await exportPrivateKeyAsPem(keys.value?.privateKey);
  }
});
</script>
<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-8 flex justify-center flex-col"
  >
    <RouterView />
  </div>
</template>

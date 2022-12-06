<script setup lang="ts">
import { shallowRef, onMounted } from "vue";
import {
  generate,
  exportPrivateKeyAsPem,
  exportPublicKeyAsPem,
} from "@concords/identity";

const publicKey = shallowRef(null);
const privateKey = shallowRef(null);

onMounted(async () => {
  const keys = await generate();
  publicKey.value = await exportPublicKeyAsPem(keys.publicKey);
  privateKey.value = await exportPrivateKeyAsPem(keys.privateKey);
});
</script>
<template>
  <div class="flex-col">
    <header class="mt-4 mb-8 ml-6">
      <h1 class="text-3xl font-light">Generate Key</h1>
    </header>
    <div class="p-4">
      <ul>
        <li>
          <span class="font-bold text-lg">Public Key</span>
          <textarea class="w-full h-32" v-model="publicKey" readonly />
        </li>
        <li>
          <span class="font-bold text-lg">Private Key</span>
          <textarea class="w-full h-32" v-model="privateKey" readonly />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, onMounted } from "vue";
import { generate } from "@concords/encrypt";

const key = shallowRef(null);

onMounted(async () => {
  key.value = await generate();
});
</script>
<template>
  <div class="flex-col">
    <header class="mt-4 mb-8 ml-6">
      <h1 class="text-3xl font-light">Generate Key</h1>
    </header>
    <div v-if="key" class="p-4">
      <ul>
        <li>Private Key: {{ key[0] }}</li>
        <li>Public Key: {{ key[1] }}</li>
      </ul>
    </div>
  </div>
</template>

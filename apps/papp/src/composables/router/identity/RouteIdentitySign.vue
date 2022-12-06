<script setup lang="ts">
import { shallowRef, onMounted } from "vue";
import { decrypt } from "@concords/encrypt";
import Editor from "../../modules/editor/Editor.vue";

const password = shallowRef(null);
const secretData = shallowRef(null);
const encryptedData = shallowRef(null);

async function handleDecrypt() {
  if (password.value) {
    secretData.value = await decrypt(password.value, encryptedData.value);
  }
}
</script>
<template>
  <div class="flex-col">
    <header class="mt-4 mb-8 ml-6">
      <h1 class="text-3xl font-light">Decrypt</h1>
    </header>
    <div class="flex flex-col flex-1 mx-4"></div>
  </div>
</template>

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
    <div class="flex flex-col flex-1 mx-4">
      <textarea
        placeholder="Enter encrypted text..."
        class="h-64 p-4 border-2 rounded border-gray-600"
        v-model="encryptedData"
      ></textarea>

      <div class="my-4"></div>
      <div class="flex gap-2">
        <input
          type="password"
          placeholder="Decrypt with password or age key..."
          v-model="password"
          @keyup.enter="handleDecrypt"
          class="border border-2 border-gray-500 p-2 rounded my-2 flex-1"
        />

        <button
          class="bg-green-700 font-bold hover:bg-green-900 text-white my-2 px-4 rounded focus:outline-none focus:shadow-outline"
          @click="handleDecrypt"
        >
          Decrypt
        </button>
      </div>
      <div v-if="secretData" class="flex flex-col">
        <div class="text-green-600 text-left font-bold mt-4 mb-2 px-4">
          Decrypted 🎉
        </div>
        <div class="flex gap-2">
          <Editor v-model="secretData" />
        </div>
      </div>
    </div>
  </div>
</template>

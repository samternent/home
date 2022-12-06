<script setup lang="ts">
import { shallowRef, onMounted } from "vue";
import { encrypt } from "@concords/encrypt";
import Editor from "../../modules/editor/Editor.vue";

const password = shallowRef(null);
const secretData = shallowRef(`<p>An age-encrypted WYSIWYG editor 🔐</p>`);
const encryptedData = shallowRef(null);

async function handleEncrypt() {
  if (password.value) {
    encryptedData.value = await encrypt(password.value, secretData.value);
  }
}
</script>
<template>
  <div class="flex-col">
    <header class="mt-4 mb-8 ml-6">
      <h1 class="text-3xl font-light">Encrypt</h1>
    </header>
    <div class="flex flex-col flex-1 mx-4"></div>
  </div>
</template>

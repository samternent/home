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
    <div class="flex flex-col flex-1 mx-4">
      <div class="flex gap-2">
        <Editor v-model="secretData" />
      </div>

      <div class="my-4">
        <!-- <LoadFromFile @load="handleLoad">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
							/>
						</svg>
						Load file
					</LoadFromFile> -->
      </div>
      <div class="flex gap-2">
        <input
          type="password"
          placeholder="Encrypt with password or age key..."
          v-model="password"
          @keyup.enter="handleEncrypt"
          class="border border-2 border-gray-500 p-2 rounded my-2 flex-1"
        />

        <button
          class="bg-green-700 font-bold hover:bg-green-900 text-white my-2 px-4 rounded focus:outline-none focus:shadow-outline"
          @click="handleEncrypt"
        >
          Encrypt
        </button>
      </div>
      <div v-if="encryptedData" class="flex flex-col">
        <div class="text-green-600 text-left font-bold mt-4 mb-2 px-4">
          Encrypted 🎉
        </div>
        <textarea class="h-64 p-4 text-xs" v-model="encryptedData"></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEncryption } from "@/modules/encryption";
import { onMounted } from "vue";
const { publicKey, privateKey } = useEncryption();

onMounted(async () => {});
</script>
<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-8 flex justify-center flex-col animate"
  >
    <h1 class="text-6xl">Encryption</h1>
    <p class="my-4 p-2 bg-slate-800 rounded text-sm break-word">
      {{ publicKey }}
    </p>

    <div class="mt-12 mb-8 flex text-2xl items-center w-full">
      <RouterLink
        to="/welcome/ledger"
        class="px-4 py-2 text-lg bg-green-600 hover:bg-green-700 transition-all rounded-full flex items-center font-medium"
      >
        Create at a ledger
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 ml-2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </RouterLink>
    </div>
  </div>
</template>

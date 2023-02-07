<script setup lang="ts">
import { useEncryption } from "@/modules/encryption";
import { LayoutHeaderTitle } from "@/modules/layout";
import { onMounted } from "vue";
const { publicKey, privateKey } = useEncryption();

onMounted(async () => {});
</script>
<template>
  <div class="w-full flex-1 mx-auto max-w-6xl px-8 flex flex-col">
    <LayoutHeaderTitle title="Encryption" />

    <div class="mt-4">
      <p class="my-3 text-2xl font-thin max-w-5xl mx-auto mt-10">
        Concords uses Age encryption for permissions. If you have your own key,
        you're welcome to use it. But we suggest creating 1 key per identity to
        keep things secure.
      </p>
      <p class="my-3 text-2xl font-thin w-full max-w-5xl mx-auto mt-10">
        This part is your public key, you can share this freely.
      </p>
      <div
        class="text-lg font-thin mt-8 mb-8 rounded-xl bg-[#1a1a1a] px-6 w-full max-w-5xl mx-auto"
      >
        <div class="flex items-start animate overflow-x-auto py-4">
          {{ publicKey }}
        </div>
      </div>
    </div>

    <p class="my-3 text-2xl font-thin w-full max-w-5xl mx-auto mt-4">
      This part is the secret, keep it safe. This is the only copy and it cannot
      be recovered.
    </p>
    <div class="my-3 text-xl font-thin w-full max-w-5xl mx-auto mt-10">
      <pre class="py-4 overflow-x-auto">{{ privateKey }}</pre>
    </div>

    <div class="mt-12 mb-8 flex text-2xl justify-between items-center w-full">
      <RouterLink
        to="/identity"
        class="px-4 py-2 text-lg transition-all rounded-full flex items-center font-medium"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>

        Identity
      </RouterLink>
      <RouterLink
        to="/ledger"
        class="px-4 py-2 text-lg bg-pink-600 hover:bg-pink-700 transition-all rounded-full flex items-center font-medium"
      >
        Ledger
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

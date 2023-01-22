<script setup lang="ts">
import { IdentityAvatar, useIdentity } from "@/modules/identity";
import { derivePublicFromPrivatePEM } from "@concords/identity";
import { onMounted } from "vue";
const { publicKeyPEM, privateKeyPEM } = useIdentity();

onMounted(async () => {});
</script>
<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-8 flex justify-center flex-col animate"
  >
    <h1 class="text-6xl">Identity</h1>
    <p class="my-4 p-2 bg-slate-800 rounded text-sm">{{ publicKeyPEM }}</p>
    <p>
      Now, nobody expects you to remember or recognise that obscure line of
      text, so we've made you an avatar. These avatars are reproducable and
      preditable, derived from your identity key.
    </p>
    <p>
      This avatr is unqique to you, the colors, curves and patterns will remain
      identical per identity.
    </p>
    <div class="flex items-start">
      <IdentityAvatar :identity="publicKeyPEM" size="sm" class="mr-4" />
      <IdentityAvatar :identity="publicKeyPEM" size="md" class="mr-4" />
      <IdentityAvatar :identity="publicKeyPEM" size="lg" />
    </div>
    <p>
      We don't do logins here, this is your username and password. Keep this
      safe, you have the only copy
    </p>
    <div class="flex flex-col items-start">
      <pre>{{ privateKeyPEM }}</pre>
    </div>
    <div class="mt-12 mb-8 flex text-2xl items-center w-full">
      <RouterLink
        to="/onboarding/ledger"
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

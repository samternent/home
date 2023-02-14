<script setup lang="ts">
import { LayoutHeaderTitle } from "@/modules/layout";
import { IdentityAvatar, useIdentity } from "@/modules/identity";
import { useEncryption } from "@/modules/encryption";

const { publicKeyPEM, privateKeyPEM } = useIdentity();
const { publicKey, privateKey } = useEncryption();
</script>
<template>
  <div class="p-4">
    <div
      class="text-lg font-thin mt-8 mb-8 py-4 rounded-xl px-6 w-full max-w-5xl mx-auto"
    >
      <div class="flex items-start animate">
        <IdentityAvatar :identity="publicKeyPEM" size="sm" class="mr-4" />
        <IdentityAvatar :identity="publicKeyPEM" size="md" class="mr-4" />
        <IdentityAvatar :identity="publicKeyPEM" size="lg" />
      </div>
    </div>
    <p class="my-3 text-2xl font-thin w-full max-w-5xl mx-auto mt-4">
      The key below is your username and password.
      <strong>Keep this safe, you have the only copy.</strong>
    </p>
    <div class="text-xl font-thin w-full max-w-5xl mx-auto my-16">
      <pre class="w-full overflow-x-auto py-4">{{ privateKeyPEM }}</pre>
    </div>
    <p class="my-3 text-2xl font-thin w-full max-w-5xl mx-auto mt-4">
      This part is the secret, keep it safe. This is the only copy and it cannot
      be recovered.
    </p>
    <div class="my-3 text-xl font-thin w-full max-w-5xl mx-auto mt-10">
      <pre class="py-4 overflow-x-auto">
Public: {{ publicKey }}
Private: {{ privateKey }}
      </pre>
    </div>
  </div>
</template>

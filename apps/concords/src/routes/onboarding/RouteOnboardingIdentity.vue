<script setup lang="ts">
import { LayoutHeaderTitle } from "@/modules/layout";
import { IdentityAvatar, useIdentity } from "@/modules/identity";
import { useEncryption } from "@/modules/encryption";

const { publicKeyPEM, privateKeyPEM } = useIdentity();
const { publicKey, privateKey } = useEncryption();
</script>
<template>
  <div class="w-full flex-1 mx-auto max-w-6xl px-8 flex flex-col">
    <LayoutHeaderTitle title="Identity" />

    <div class="mt-4">
      <p class="my-3 text-2xl font-thin w-full max-w-5xl mx-auto mt-10">
        Identity plays a crucial role in Concords. Every interaction with the
        ledger is signed using your unique identity, which is an ECDSA key-pair.
        This allows for verification of both identity and validity of
        interactions. However, it can be difficult to identify a key-pair at a
        glance. To solve this issue, we compute a unique Glyph for each identity
        key, also known as an "avatar." These avatars are derived from the
        user's identity key and are both reproducible and predictable.
      </p>

      <div
        class="text-lg font-thin mt-8 mb-8 py-4 rounded-xl bg-[#1a1a1a] px-6 w-full max-w-5xl mx-auto"
      >
        <div class="flex items-start animate">
          <IdentityAvatar :identity="publicKeyPEM" size="sm" class="mr-4" />
          <IdentityAvatar :identity="publicKeyPEM" size="md" class="mr-4" />
          <IdentityAvatar :identity="publicKeyPEM" size="lg" />
        </div>
      </div>
    </div>

    <p class="my-3 text-2xl font-thin w-full max-w-5xl mx-auto mt-4">
      As we use identity keys, Concords doesn't need a server-side login. The
      key below is your username and password.
      <strong>Keep this safe, you have the only copy.</strong>
    </p>
    <div class="text-xl font-thin w-full max-w-5xl mx-auto my-16">
      <pre class="w-full overflow-x-auto py-4">{{ privateKeyPEM }}</pre>
    </div>

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
  </div>
</template>

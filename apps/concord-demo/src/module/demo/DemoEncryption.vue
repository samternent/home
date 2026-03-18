<script setup lang="ts">
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import { useEncryption } from "../../module/encryption/useEncryption";

const { publicKey: encryptionPublicKey, privateKey: encryptionPrivateKey } =
  useEncryption();
</script>
<template>
  <div class="flex flex-col items-center justify-center">
    <h2>Encryption</h2>
    <pre>{{ encryptionPublicKey }}</pre>
    <pre class="blur-sm hover:blur-none transition-all duration-300">{{
      encryptionPrivateKey
    }}</pre>
  </div>
</template>

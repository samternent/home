<script setup>
import { useIdentity } from "@/module/identity/useIdentity";
import { useEncryption } from "@/module/encryption/useEncryption";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";

const { publicKeyPEM, privateKeyPEM } = useIdentity();
const { publicKey, privateKey } = useEncryption();
</script>
<template>
  <div class="p-2">
    <IdentityAvatar :identity="publicKeyPEM" size="lg" />
    <h2>Public Identity Key</h2>
    <pre>{{ publicKeyPEM }}</pre>
    <h2>Private Identity Key</h2>
    <pre>{{ privateKeyPEM }}</pre>
    <h2>Public Ecryption Key</h2>
    <pre>{{ publicKey }}</pre>
    <h2>Private Ecryption Key</h2>
    <pre>{{ privateKey }}</pre>
  </div>
</template>

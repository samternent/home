<script setup lang="ts">
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import { useIdentity } from "../../module/identity/useIdentity";

const { publicKeyPEM, privateKeyPEM, createIdentity } = useIdentity();
</script>
<template>
  <div class="flex flex-col items-center">
    <h2>Identity</h2>

    <button @click="createIdentity">Generate new identity</button>

    <pre>{{ publicKeyPEM }}</pre>
    <pre class="blur-sm hover:blur-none transition-all duration-300">{{
      privateKeyPEM
    }}</pre>
    <div :key="publicKeyPEM" class="flex items-center gap-4">
      <IdentityAvatar :identity="publicKeyPEM" size="lg" />
      <div class="flex flex-col gap-4 items-center">
        <IdentityAvatar :identity="publicKeyPEM" size="xs" />
        <IdentityAvatar :identity="publicKeyPEM" size="sm" />
        <IdentityAvatar :identity="publicKeyPEM" size="md" />
      </div>
    </div>
  </div>
</template>

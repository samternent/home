<script lang="ts" setup>
import { computed } from "vue";
import { useEncryption } from "@/modules/encryption";
import { useIdentity } from "@/modules/identity";

const { publicKeyPEM: publicKeyIdentityPEM } = useIdentity();
const { publicKey: publicKeyEncryption } = useEncryption();

const userJSON = computed(() => ({
  identity: publicKeyIdentityPEM.value,
  encryption: publicKeyEncryption.value,
}));
</script>
<template>
  <div>
    <pre class="no-resize h-32 w-full">{{
      JSON.stringify(userJSON, null, 2)
    }}</pre>
  </div>
</template>

<script lang="ts" setup>
import { computed, shallowRef } from "vue";
import { useEncryption } from "@/modules/encryption";
import { useIdentity } from "@/modules/identity";

const {
  publicKeyPEM: publicKeyIdentityPEM,
  privateKeyPEM: privateKeyIdentityPEM,
} = useIdentity();
const { publicKey: publicKeyEncryption, privateKey: privateKeyEncryption } =
  useEncryption();

const username = shallowRef<string>("");

const userJSON = computed(() => ({
  public: {
    username: username.value,
    identity: publicKeyIdentityPEM.value,
    encryption: publicKeyEncryption.value,
  },
  private: {
    identity: privateKeyIdentityPEM.value,
    encryption: privateKeyEncryption.value,
  },
}));
</script>
<template>
  <div>
    <pre class="no-resize w-full">{{ JSON.stringify(userJSON, null, 2) }}</pre>
    <div>
      choose a username (just for this ledger)
      <FormKit type="text" placeholder="Username" v-model="username" />
    </div>
  </div>
</template>

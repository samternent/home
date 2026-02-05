<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useLedger } from "../ledger/useLedger";
import { useIdentity } from "../identity/useIdentity";
import { useProfile } from "../profile/useProfile";

const { api, ledger } = useLedger();
const { publicKey, privateKey, publicKeyPEM } = useIdentity();
const profile = useProfile();

const lastAuthKey = ref("");

onMounted(async () => {
  if (!ledger.value) {
    await api.loadFromStorage();
  }
});

watch(
  () => [profile.ready.value, publicKey.value, privateKey.value] as const,
  async ([ready, pub, priv]) => {
    if (!ready || !pub || !priv) return;
    await profile.ensureProfileId();

    const identityKey = publicKeyPEM.value || "";
    if (identityKey && identityKey === lastAuthKey.value) return;
    lastAuthKey.value = identityKey;

    await api.auth(priv, pub);
    await api.replay();
  },
  { immediate: true }
);
</script>

<template>
  <slot />
</template>

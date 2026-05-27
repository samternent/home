<script setup lang="ts">
import { computed } from "vue";
import { SCard } from "ternent-ui/components";
import { useIdentity } from "@/modules/identity";

const { identity, hasIdentity } = useIdentity();

const shortFingerprint = computed(() => {
  if (!identity.value?.fingerprint) return "-";
  return `${identity.value.fingerprint.slice(0, 12)}...`;
});
</script>

<template>
  <SCard class="p-4">
    <h3 class="m-0 text-lg">Identity status</h3>
    <p class="mt-2 text-sm text-fg-muted">
      {{ hasIdentity ? "An identity is active for this browser profile." : "No identity is active yet." }}
    </p>
    <div v-if="identity" class="mt-3 text-sm">
      <div><strong>ID:</strong> {{ identity.id }}</div>
      <div><strong>Fingerprint:</strong> {{ shortFingerprint }}</div>
      <div><strong>Created:</strong> {{ new Date(identity.createdAt).toLocaleString() }}</div>
    </div>
  </SCard>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { SButton, SCard } from "ternent-ui/components";
import { useIdentityImport } from "@/modules/identity";

const payload = ref("");
const success = ref<string | null>(null);
const { importIdentity, isImporting, error } = useIdentityImport();

const onImport = async () => {
  const identity = await importIdentity(payload.value);
  success.value = identity.id;
};
</script>

<template>
  <SCard class="space-y-4 p-5">
    <h3 class="m-0 text-lg">Import identity</h3>
    <p class="text-sm text-fg-muted">
      Paste either JSON export payload or PEM private key text.
    </p>

    <textarea
      v-model="payload"
      class="min-h-64 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs"
      placeholder='{"privateKeyPem":"-----BEGIN PRIVATE KEY-----..."}'
    />

    <SButton type="primary" :loading="isImporting" @click="onImport">
      {{ isImporting ? "Importing..." : "Import identity" }}
    </SButton>

    <p v-if="success" class="text-sm">
      Imported identity: <strong>{{ success }}</strong>
    </p>

    <p v-if="error" class="text-sm text-danger">
      {{ error }}
    </p>
  </SCard>
</template>

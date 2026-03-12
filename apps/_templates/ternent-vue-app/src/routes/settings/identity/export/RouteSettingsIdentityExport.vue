<script setup lang="ts">
import { SButton, SCard } from "ternent-ui/components";
import { useIdentityExport } from "@/modules/identity";

const { exportedPayload, downloadExport } = useIdentityExport();
</script>

<template>
  <SCard class="space-y-4 p-5">
    <h3 class="m-0 text-lg">Export identity</h3>
    <p class="text-sm text-fg-muted">
      Export current identity as JSON and store securely.
    </p>

    <SButton type="primary" :disabled="!exportedPayload" @click="downloadExport">
      Download export file
    </SButton>

    <textarea
      class="min-h-64 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs"
      readonly
      :value="exportedPayload"
      placeholder="Create or import an identity to export it."
    />
  </SCard>
</template>

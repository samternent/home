<script setup lang="ts">
import { ref } from "vue";
import { Button, Card } from "ternent-ui/primitives";
import {
  useIdentityExport,
  useIdentityImport,
} from "@/modules/identity";
import { usePixbookSession } from "@/modules/pixbook/usePixbookSession";

const pixbook = usePixbookSession();
const identityExport = useIdentityExport();
const identityImport = useIdentityImport();
const identityImportPayload = ref("");
const ledgerImportPayload = ref("");
const ledgerExportPayload = ref("");
const actionMessage = ref("");

async function refreshLedgerExport() {
  const container = await pixbook.exportLedger();
  ledgerExportPayload.value = JSON.stringify(container, null, 2);
}

async function importLedgerPayload() {
  const parsed = JSON.parse(ledgerImportPayload.value);
  await pixbook.importLedger(parsed);
  ledgerImportPayload.value = "";
  actionMessage.value = "Imported a Pixbook ledger into this device.";
  await refreshLedgerExport();
}

async function importIdentityPayload() {
  await identityImport.importIdentity(identityImportPayload.value);
  identityImportPayload.value = "";
  actionMessage.value = "Imported a child identity onto this device.";
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <Card variant="showcase" padding="sm" class="space-y-4">
      <div class="space-y-1">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Identity export</p>
        <h2 class="m-0 text-xl font-semibold">Move a child safely</h2>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" @click="identityExport.downloadExport">
          Download child export
        </Button>
      </div>

      <label class="grid gap-2">
        <span class="text-sm font-medium">Current child export</span>
        <textarea
          readonly
          :value="identityExport.exportedPayload.value"
          rows="12"
          class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-xs text-[var(--ui-fg)]"
        />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium">Import child export</span>
        <textarea
          v-model="identityImportPayload"
          rows="10"
          placeholder="Paste a child identity export"
          class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-xs text-[var(--ui-fg)]"
        />
      </label>

      <Button size="sm" variant="plain-secondary" @click="importIdentityPayload">
        Import child onto this device
      </Button>

      <p v-if="identityImport.error.value" class="m-0 text-sm text-[var(--ui-danger)]">
        {{ identityImport.error.value }}
      </p>
    </Card>

    <Card variant="subtle" padding="sm" class="space-y-4">
      <div class="space-y-1">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Pixbook export</p>
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          Use this only for manual rescue or careful transfer. Family backup is the easier option for normal households.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" @click="refreshLedgerExport">
          Refresh Pixbook export
        </Button>
        <Button size="sm" variant="plain-secondary" @click="pixbook.resetPixbook()">
          Reset local Pixbook
        </Button>
      </div>

      <label class="grid gap-2">
        <span class="text-sm font-medium">Current Pixbook export</span>
        <textarea
          readonly
          :value="ledgerExportPayload"
          rows="12"
          class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-xs text-[var(--ui-fg)]"
        />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium">Import Pixbook ledger</span>
        <textarea
          v-model="ledgerImportPayload"
          rows="10"
          placeholder="Paste a concord-ledger container"
          class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-xs text-[var(--ui-fg)]"
        />
      </label>

      <Button size="sm" variant="plain-secondary" @click="importLedgerPayload">
        Import Pixbook onto this device
      </Button>

      <p v-if="actionMessage" class="m-0 text-sm text-[var(--ui-fg-muted)]">{{ actionMessage }}</p>
      <p v-if="pixbook.error.value" class="m-0 text-sm text-[var(--ui-danger)]">{{ pixbook.error.value }}</p>
    </Card>
  </div>
</template>

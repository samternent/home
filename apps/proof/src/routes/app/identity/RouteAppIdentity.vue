<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { SButton, SCard, SDisclosure, SFileInput, STextarea } from "ternent-ui/components";
import {
  useIdentitySession,
  useIdentityCreate,
  useIdentityImport,
  useIdentityExport,
} from "@/modules/identity";

const { identity, hasIdentity, rememberInBrowser, setRememberInBrowser, clearIdentity } = useIdentitySession();
const { create, isCreating } = useIdentityCreate();
const { importIdentity, isImporting } = useIdentityImport();
const { downloadExport } = useIdentityExport();

const importPayload = ref("");
const importFileName = ref<string | null>(null);
const importFile = ref<File | null>(null);
const showImportPanel = ref(false);
const showFullFingerprint = ref(false);
const showPublicKey = ref(false);

const fingerprintCopied = ref(false);

const notice = ref<string | null>(null);
const error = ref<string | null>(null);

const rememberModel = computed({
  get: () => rememberInBrowser.value,
  set: (value: boolean) => {
    setRememberInBrowser(value);
    notice.value = value
      ? "Identity storage enabled for this browser."
      : "Identity storage disabled. Active identity remains memory-only.";
  },
});

const shortFingerprint = computed(() => {
  if (!identity.value?.fingerprint) return "";
  const value = identity.value.fingerprint;
  return `${value.slice(0, 8)}...${value.slice(-8)}`;
});

const onGenerate = async () => {
  error.value = null;
  notice.value = null;

  try {
    await create();
    showFullFingerprint.value = false;
    notice.value = "Identity created. Export it now and store it securely.";
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Failed to generate identity.";
  }
};

const onImport = async () => {
  error.value = null;
  notice.value = null;

  try {
    await importIdentity(importPayload.value);
    importPayload.value = "";
    importFileName.value = null;
    importFile.value = null;
    showImportPanel.value = false;
    showFullFingerprint.value = false;
    notice.value = "Identity imported successfully.";
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Failed to import identity.";
  }
};

const importFileModel = computed({
  get: () => importFile.value as File | undefined,
  set: (value: unknown) => {
    importFile.value = value instanceof File ? value : null;
  },
});

watch(importFile, async (file) => {
  if (!file) return;
  importFileName.value = file.name;
  importPayload.value = await file.text();
});

const copyFingerprint = async () => {
  if (!identity.value?.fingerprint || fingerprintCopied.value) return;

  try {
    await navigator.clipboard.writeText(identity.value.fingerprint);
    fingerprintCopied.value = true;
    window.setTimeout(() => {
      fingerprintCopied.value = false;
    }, 1200);
  } catch {
    fingerprintCopied.value = false;
  }
};

const onClear = () => {
  clearIdentity();
  showFullFingerprint.value = false;
  showPublicKey.value = false;
  notice.value = "Identity cleared from memory and remembered storage.";
  error.value = null;
};
</script>

<template>
  <section class="space-y-8 md:space-y-10">
    <header>
      <h2 class="m-0 text-3xl font-medium tracking-tight">Identity</h2>
      <p class="mt-3 max-w-2xl text-base leading-7 text-fg-muted">
        Generate or import the active identity used to sign proofs.
      </p>
    </header>

    <SCard class="space-y-4 border border-border bg-surface p-6 md:p-8">
      <label class="flex items-start gap-2 text-sm">
        <input v-model="rememberModel" type="checkbox" class="mt-1 h-4 w-4 rounded border-border bg-surface accent-primary" />
        <span>Store identity in this browser (trusted devices only)</span>
      </label>
      <p class="m-0 text-sm text-fg-muted">Private key material is stored locally in this browser.</p>
    </SCard>

    <SCard v-if="!hasIdentity" class="space-y-6 border border-border bg-surface p-6 md:p-8">
      <h3 class="m-0 text-xl">No identity loaded</h3>
      <p class="m-0 text-base text-fg-muted">Create a new identity or import an existing export payload.</p>

      <div class="flex flex-wrap gap-3">
        <SButton variant="primary" :loading="isCreating" @click="onGenerate">
          {{ isCreating ? "Generating..." : "Generate new identity" }}
        </SButton>
        <SButton variant="secondary" @click="showImportPanel = !showImportPanel">
          {{ showImportPanel ? "Hide import" : "Import identity" }}
        </SButton>
      </div>
    </SCard>

    <SCard v-else class="space-y-6 border border-border bg-surface p-6 md:p-8">
      <h3 class="m-0 text-xl">Active identity</h3>

      <div class="space-y-4 rounded-2xl border border-border bg-[var(--ui-surface-2)] p-4">
        <p class="m-0 text-xs font-medium uppercase tracking-wide text-fg-muted">Identity summary</p>
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <strong class="text-fg-muted">Fingerprint:</strong>
          <span class="font-mono text-xs text-fg">{{ showFullFingerprint ? identity?.fingerprint : shortFingerprint }}</span>
          <SButton variant="ghost" size="xs" @click="copyFingerprint">
            {{ fingerprintCopied ? "Copied" : "Copy" }}
          </SButton>
          <SButton variant="ghost" size="xs" @click="showFullFingerprint = !showFullFingerprint">
            {{ showFullFingerprint ? "Hide full" : "Show full" }}
          </SButton>
        </div>

        <div>
          <SDisclosure
            v-model:open="showPublicKey"
            label="▶ View public key"
            open-label="▼ Hide public key"
          >
            <pre class="pp-disclosure max-h-56 overflow-auto text-xs leading-relaxed text-fg-muted"><code>{{ identity?.publicKeyPem }}</code></pre>
          </SDisclosure>
        </div>
      </div>

      <p class="m-0 rounded-xl border border-[rgba(255,180,120,0.24)] bg-[rgba(255,180,120,0.08)] px-4 py-3 text-sm text-fg">
        Export includes private key material. Store it securely.
      </p>

      <div class="flex flex-wrap gap-3">
        <SButton variant="primary" @click="downloadExport">Export identity</SButton>
        <SButton variant="secondary" @click="showImportPanel = !showImportPanel">
          {{ showImportPanel ? "Hide import" : "Replace / import identity" }}
        </SButton>
        <SButton variant="error" @click="onClear">Clear identity</SButton>
      </div>
    </SCard>

    <SCard v-if="showImportPanel" class="space-y-5 border border-border bg-surface p-6 md:p-8">
      <h3 class="m-0 text-xl">Import identity</h3>
      <p class="m-0 text-base text-fg-muted">Paste JSON export payload or PEM private key text.</p>

      <SFileInput
        v-model="importFileModel"
        v-model:filename="importFileName"
        accept=".json,.pem,text/plain,application/json"
        placeholder="Choose identity file"
      />
      <p v-if="importFileName" class="m-0 text-sm text-fg-muted">Loaded file: {{ importFileName }}</p>

      <STextarea
        v-model="importPayload"
        min-height="14rem"
        monospace
        placeholder='{"privateKeyPem":"-----BEGIN PRIVATE KEY-----..."}'
      />

      <div class="flex flex-wrap gap-3">
        <SButton variant="primary" :loading="isImporting" @click="onImport">
          {{ isImporting ? "Importing..." : "Import" }}
        </SButton>
        <SButton variant="ghost" @click="showImportPanel = false">Cancel</SButton>
      </div>
    </SCard>

    <p v-if="notice" class="m-0 rounded-xl border border-border bg-surface px-4 py-3 text-sm" aria-live="polite">
      {{ notice }}
    </p>
    <p v-if="error" class="m-0 rounded-xl border border-danger bg-danger-muted px-4 py-3 text-sm" aria-live="assertive">
      {{ error }}
    </p>
  </section>
</template>

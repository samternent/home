<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Card,
  Checkbox,
  FileInput,
  Textarea,
} from "ternent-ui/primitives";
import { FormField, PreviewPanel, SectionIntro } from "ternent-ui/patterns";
import {
  useIdentityCreate,
  useIdentityExport,
  useIdentityImport,
  useIdentitySession,
} from "@/modules/identity";

const {
  identity,
  hasIdentity,
  rememberInBrowser,
  legacyIdentityRejected,
  setRememberInBrowser,
  clearIdentity,
} = useIdentitySession();
const { create, isCreating } = useIdentityCreate();
const { importIdentity, isImporting } = useIdentityImport();
const { exportedPayload, downloadExport } = useIdentityExport();

const importPayload = ref("");
const importFileName = ref("");
const importFile = ref<File | null>(null);
const showImportPanel = ref(false);
const showFullKeyId = ref(false);
const showPublicKey = ref(false);
const keyIdCopied = ref(false);
const notice = ref<string | null>(null);
const error = ref<string | null>(null);

const rememberModel = computed({
  get: () => rememberInBrowser.value,
  set: (value: boolean | "indeterminate") => {
    const next = value === true;
    setRememberInBrowser(next);
    notice.value = next
      ? "Identity storage enabled for this browser."
      : "Identity storage disabled. Active identity remains memory-only.";
  },
});

const shortKeyId = computed(() => {
  if (!identity.value?.keyId) return "No identity loaded";
  const value = identity.value.keyId;
  return `${value.slice(0, 10)}...${value.slice(-10)}`;
});

const identityRows = computed(() => {
  if (!identity.value) {
    return [
      { label: "Status", value: "No identity loaded", valueTone: "neutral" as const },
      { label: "Storage", value: rememberInBrowser.value ? "Browser storage enabled" : "Memory only" },
      ...(legacyIdentityRejected.value
        ? [{ label: "Legacy", value: "Legacy PEM identity was rejected" }]
        : []),
    ];
  }

  return [
    {
      label: "Key ID",
      value: showFullKeyId.value ? identity.value.keyId : shortKeyId.value,
      valueTone: "primary" as const,
    },
    { label: "Identity ID", value: identity.value.id },
    { label: "Created", value: new Date(identity.value.createdAt).toLocaleString() },
    { label: "Storage", value: rememberInBrowser.value ? "Browser storage enabled" : "Memory only" },
    ...(legacyIdentityRejected.value
      ? [{ label: "Legacy", value: "Legacy PEM identity was rejected" }]
      : []),
  ];
});

const importFileModel = computed({
  get: () => importFile.value,
  set: (value: File | File[] | null) => {
    importFile.value = value instanceof File ? value : null;
  },
});

watch(importFile, async (file) => {
  if (!file) return;
  importFileName.value = file.name;
  importPayload.value = await file.text();
});

const onGenerate = async () => {
  error.value = null;
  notice.value = null;

  try {
    await create();
    showFullKeyId.value = false;
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
    importFileName.value = "";
    importFile.value = null;
    showImportPanel.value = false;
    showFullKeyId.value = false;
    notice.value = "Identity imported successfully.";
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Failed to import identity.";
  }
};

const copyKeyId = async () => {
  if (!identity.value?.keyId || keyIdCopied.value) return;

  try {
    await navigator.clipboard.writeText(identity.value.keyId);
    keyIdCopied.value = true;
    window.setTimeout(() => {
      keyIdCopied.value = false;
    }, 1200);
  } catch {
    keyIdCopied.value = false;
  }
};

const onClear = () => {
  clearIdentity();
  showFullKeyId.value = false;
  showPublicKey.value = false;
  showImportPanel.value = false;
  notice.value = "Identity cleared from memory and remembered storage.";
  error.value = null;
};
</script>

<template>
  <section class="space-y-8 md:space-y-10">
    <SectionIntro
      eyebrow="Identity"
      title="Create, import, and protect your local signer"
      description="Seal keeps signing keys in your browser. Generate a new identity, import an existing one, or export the current payload for secure backup."
    />

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div class="space-y-6">
        <Card variant="elevated" padding="md" class="space-y-5 border-[color-mix(in_srgb,var(--ui-border)_84%,transparent)]">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-2">
              <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                Identity summary
              </p>
              <h3 class="m-0 text-xl font-medium tracking-[-0.02em] text-[var(--ui-fg)]">
                {{ hasIdentity ? "Local signer ready" : "No signer loaded" }}
              </h3>
            </div>
            <Badge :tone="hasIdentity ? 'success' : 'neutral'" variant="outline">
              {{ hasIdentity ? "Ready" : "Empty" }}
            </Badge>
          </div>

          <div class="rounded-[var(--ui-radius-lg)] border border-[color-mix(in_srgb,var(--ui-border)_86%,transparent)] bg-[var(--ui-tonal-secondary)] px-5 py-4">
            <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              Key ID
            </p>
            <p class="proof-shell-copy mt-3 break-all text-base leading-7 text-[var(--ui-fg)]">
              {{ hasIdentity ? (showFullKeyId ? identity?.keyId : shortKeyId) : "No identity loaded" }}
            </p>
          </div>

          <PreviewPanel
            title="Identity details"
            :rows="identityRows.filter((row) => row.label !== 'Key ID')"
            status-label="Local"
            status-tone="neutral"
            emphasis="subtle"
          />
        </Card>

        <Card variant="subtle" padding="md" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Local storage</p>
              <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
                Private key material is stored locally in this browser.
              </p>
            </div>
            <Badge :tone="rememberInBrowser ? 'neutral' : 'neutral'" variant="outline">
              {{ rememberInBrowser ? "Persisted" : "Memory only" }}
            </Badge>
          </div>

          <Checkbox v-model="rememberModel">
            Store identity in this browser (trusted devices only)
            <template #description>
              Disable this if you only want the active identity to live for the current session.
            </template>
          </Checkbox>
        </Card>

        <Card v-if="hasIdentity" variant="subtle" padding="md" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Active identity</p>
              <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
                Inspect the full key ID or derived public key before sharing proofs.
              </p>
            </div>
            <Badge tone="neutral" variant="outline">Loaded</Badge>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button size="xs" variant="secondary" @click="copyKeyId">
              {{ keyIdCopied ? "Copied" : "Copy key ID" }}
            </Button>
            <Button size="xs" variant="plain-secondary" @click="showFullKeyId = !showFullKeyId">
              {{ showFullKeyId ? "Hide full key ID" : "Show full key ID" }}
            </Button>
          </div>

          <Accordion
            :value="showPublicKey ? 'public-key' : undefined"
            @update:value="(value) => { showPublicKey = value === 'public-key'; }"
          >
            <AccordionItem value="public-key" title="View public key">
              <pre class="proof-code-block m-0 whitespace-pre-wrap break-all text-xs leading-relaxed"><code>{{ identity?.publicKey }}</code></pre>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>

      <div class="space-y-6">
        <Card variant="elevated" padding="md" class="space-y-5 border-[color-mix(in_srgb,var(--ui-border)_84%,transparent)]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Identity actions</p>
              <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
                Generate a new identity, replace the active one, or clear local key material.
              </p>
            </div>
            <Badge :tone="hasIdentity ? 'neutral' : 'warning'" variant="outline">
              {{ hasIdentity ? "Identity available" : "Action required" }}
            </Badge>
          </div>

          <div class="flex flex-wrap gap-3">
            <Button variant="primary" :loading="isCreating" @click="onGenerate">
              {{ isCreating ? "Generating..." : "Generate new identity" }}
            </Button>
            <Button variant="secondary" @click="showImportPanel = !showImportPanel">
              {{ showImportPanel ? "Hide import" : "Import identity" }}
            </Button>
            <Button v-if="hasIdentity" variant="critical-secondary" @click="onClear">
              Clear identity
            </Button>
          </div>
        </Card>

        <Card v-if="showImportPanel" variant="panel" padding="md" class="space-y-5">
          <div>
            <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Import identity</p>
            <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
                Paste a v2 ternent identity JSON payload.
            </p>
          </div>

          <FormField label="Identity file" description="Only ternent identity v2 JSON exports are accepted.">
            <template #default>
              <FileInput
                v-model="importFileModel"
                v-model:filename="importFileName"
                accept=".json,.pem,text/plain,application/json"
                variant="dropzone"
                placeholder="Choose identity file"
              />
            </template>
          </FormField>

          <FormField label="Identity payload" description="Paste a ternent identity v2 JSON export payload.">
            <template #default="{ id, describedBy }">
              <Textarea
                :id="id"
                v-model="importPayload"
                :aria-describedby="describedBy"
                rows="10"
                class="proof-shell-copy"
                placeholder='{"format":"ternent-identity","version":"2","algorithm":"Ed25519",...}'
              />
            </template>
          </FormField>

          <div class="flex flex-wrap gap-3">
            <Button variant="primary" :loading="isImporting" @click="onImport">
              {{ isImporting ? "Importing..." : "Import identity" }}
            </Button>
            <Button variant="plain-secondary" @click="showImportPanel = false">
              Cancel
            </Button>
          </div>
        </Card>

        <Card v-if="hasIdentity" variant="subtle" padding="md" class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Export identity</p>
              <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
                Export includes private key material. Store it securely.
              </p>
            </div>
            <Badge tone="warning" variant="outline">Sensitive</Badge>
          </div>

          <FormField label="Export payload" description="Back this up securely before moving devices or clearing storage.">
            <template #default="{ id, describedBy }">
              <Textarea
                :id="id"
                :model-value="exportedPayload"
                :aria-describedby="describedBy"
                rows="10"
                readonly
                class="proof-shell-copy"
                placeholder="Create or import an identity to export it."
              />
            </template>
          </FormField>

          <Button variant="primary" :disabled="!exportedPayload" @click="downloadExport">
            Download export file
          </Button>
        </Card>

        <p
          v-if="legacyIdentityRejected"
          class="m-0 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-4 py-3 text-sm text-[var(--ui-fg)]"
          aria-live="polite"
        >
          A legacy PEM-based Seal identity was found in browser storage and was cleared. Import a v2 ternent identity JSON export instead.
        </p>
        <p
          v-if="notice"
          class="m-0 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-4 py-3 text-sm text-[var(--ui-fg)]"
          aria-live="polite"
        >
          {{ notice }}
        </p>
        <p
          v-if="error"
          class="m-0 rounded-[var(--ui-radius-md)] border border-[var(--ui-critical)] bg-[var(--ui-critical-muted)] px-4 py-3 text-sm text-[var(--ui-fg)]"
          aria-live="assertive"
        >
          {{ error }}
        </p>
      </div>
    </div>
  </section>
</template>

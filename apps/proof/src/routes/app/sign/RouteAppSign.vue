<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Card,
  FileInput,
  Input,
  Tabs,
  Textarea,
} from "ternent-ui/primitives";
import { FormField, PreviewPanel, SectionIntro } from "ternent-ui/patterns";
import { hashBytes, hashData } from "ternent-utils";
import { useIdentitySession } from "@/modules/identity";
import {
  createPortableProof,
  SUPPORTED_HASH_ALGORITHM,
  SUPPORTED_SIGNATURE_ALGORITHM,
  type PortableProofV1,
} from "@/modules/proof";

type SignMode = "text" | "file";

const { identity, hasIdentity } = useIdentitySession();

const mode = ref<SignMode>("text");
const signModeTabs = [
  { value: "text", label: "Text" },
  { value: "file", label: "File" },
];

const textContent = ref("");
const textContentName = ref("");
const selectedFile = ref<File | null>(null);
const selectedFileName = ref("");
const isSigning = ref(false);
const error = ref<string | null>(null);
const notice = ref<string | null>(null);
const signedProof = ref<PortableProofV1 | null>(null);
const outputFileName = ref<string | null>(null);
const showProofJson = ref(false);

const canSign = computed(() => {
  if (!hasIdentity.value) return false;
  if (mode.value === "text") return textContent.value.trim().length > 0;
  return Boolean(selectedFile.value);
});

const disabledReason = computed(() => {
  if (!hasIdentity.value) return "Load an identity to sign content.";
  if (mode.value === "text" && !textContent.value.trim()) return "Enter text to enable signing.";
  if (mode.value === "file" && !selectedFile.value) return "Choose a file to enable signing.";
  return "";
});

const proofJson = computed(() => {
  if (!signedProof.value) return "";
  return JSON.stringify(signedProof.value, null, 2);
});

const signerShort = computed(() => {
  if (!signedProof.value?.fingerprint) return "";
  const value = signedProof.value.fingerprint;
  return `${value.slice(0, 10)}...${value.slice(-10)}`;
});

const selectedFileModel = computed({
  get: () => selectedFile.value,
  set: (value: File | File[] | null) => {
    selectedFile.value = value instanceof File ? value : null;
  },
});

const proofRows = computed(() => {
  if (!signedProof.value) return [];

  return [
    { label: "Content hash", value: signedProof.value.payload.contentHash, valueTone: "primary" as const },
    { label: "Signer fingerprint", value: signerShort.value },
    { label: "Name", value: outputFileName.value || "portable-proof" },
    { label: "Algorithm", value: signedProof.value.payload.signatureAlgorithm },
  ];
});

const downloadProof = () => {
  if (!proofJson.value) return;

  const name = outputFileName.value || "portable-proof";
  const blob = new Blob([proofJson.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name}.proof.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const onSign = async () => {
  error.value = null;
  notice.value = null;
  signedProof.value = null;

  if (!identity.value) {
    error.value = "No identity loaded. Load an identity before signing.";
    return;
  }

  isSigning.value = true;

  try {
    let contentHash = "";
    let canonicalization: "ternent-utils/canonicalStringify-v1" | "raw-bytes" = "raw-bytes";
    let fileName = textContentName.value.trim() || "text-proof";

    if (mode.value === "text") {
      if (!textContent.value.trim()) {
        throw new Error("Text content is empty.");
      }

      contentHash = await hashData(textContent.value);
      canonicalization = "ternent-utils/canonicalStringify-v1";
    } else {
      if (!selectedFile.value) {
        throw new Error("Select a file before signing.");
      }

      const bytes = await selectedFile.value.arrayBuffer();
      contentHash = await hashBytes(bytes);
      canonicalization = "raw-bytes";
      fileName = selectedFile.value.name;
    }

    const proof = await createPortableProof({
      identity: identity.value,
      payload: {
        contentHash,
        hashAlgorithm: SUPPORTED_HASH_ALGORITHM,
        signatureAlgorithm: SUPPORTED_SIGNATURE_ALGORITHM,
        canonicalization,
      },
    });

    signedProof.value = proof;
    outputFileName.value = fileName;
    notice.value = "Proof generated successfully";
    showProofJson.value = false;
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Failed to sign content.";
  } finally {
    isSigning.value = false;
  }
};
</script>

<template>
  <section class="space-y-8 md:space-y-10">
    <SectionIntro
      eyebrow="Sign"
      title="Turn text or files into portable proofs"
      description="Use your active local identity to hash content, sign it deterministically, and export a self-contained proof artifact."
    />

    <Card v-if="!hasIdentity" variant="panel" padding="md" class="space-y-4">
      <Badge tone="warning" variant="soft">No identity loaded</Badge>
      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
        Load an identity before signing content.
      </p>
      <Button as="RouterLink" to="/app/identity" variant="secondary">
        Go to Identity
      </Button>
    </Card>

    <template v-else>
      <Card variant="elevated" padding="md" class="space-y-6 border-[color-mix(in_srgb,var(--ui-border)_84%,transparent)]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
              Signing workbench
            </p>
            <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
              Choose the source material, confirm the current payload, then sign and export the proof artifact.
            </p>
          </div>
          <Badge tone="neutral" variant="outline">{{ mode === "text" ? "Text payload" : "File payload" }}</Badge>
        </div>

        <Tabs v-model="mode" :items="signModeTabs" variant="pill">
          <template #panel-text>
            <div class="space-y-5">
              <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                Hash and sign pasted text content using canonical stringification.
              </p>

              <FormField label="Content name" description="Optional label used when downloading the proof JSON.">
                <template #default="{ id, describedBy }">
                  <Input
                    :id="id"
                    v-model="textContentName"
                    :aria-describedby="describedBy"
                    placeholder="Optional content name"
                  />
                </template>
              </FormField>

              <FormField label="Text content" description="Paste the exact text you want to hash and sign.">
                <template #default="{ id, describedBy }">
                  <Textarea
                    :id="id"
                    v-model="textContent"
                    :aria-describedby="describedBy"
                    rows="10"
                    placeholder="Enter text to sign"
                  />
                </template>
              </FormField>
            </div>
          </template>

          <template #panel-file>
            <div class="space-y-5">
              <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                Hash and sign one local file as raw bytes.
              </p>

              <FormField label="File input" description="Select one local file to hash and sign.">
                <template #default>
                  <FileInput
                    v-model="selectedFileModel"
                    v-model:filename="selectedFileName"
                    variant="dropzone"
                    placeholder="Drop one file to sign, or click to choose"
                  />
                </template>
              </FormField>

              <div
                v-if="selectedFile"
                class="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] px-4 py-3 text-sm text-[var(--ui-fg-muted)]"
              >
                Selected file:
                <span class="ml-1 font-medium text-[var(--ui-fg)]">{{ selectedFile.name }}</span>
                <span class="ml-1">({{ selectedFile.size }} bytes)</span>
              </div>
            </div>
          </template>
        </Tabs>

        <div class="space-y-3 border-t border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] pt-5">
          <div class="flex flex-wrap items-center gap-3">
            <Button variant="primary" :disabled="!canSign" :loading="isSigning" @click="onSign">
              {{ isSigning ? "Signing..." : "Sign payload" }}
            </Button>
            <Badge tone="neutral" variant="outline">
              {{ mode === "text" ? "Canonical stringification" : "Raw bytes" }}
            </Badge>
          </div>
          <p class="m-0 min-h-5 text-xs text-[var(--ui-fg-muted)]" aria-live="polite">
            {{ disabledReason }}
          </p>
        </div>
      </Card>

      <div v-if="signedProof" class="space-y-5">
        <PreviewPanel
          title="Proof artifact ready"
          :rows="proofRows"
          status-label="Signed"
          status-tone="neutral"
          emphasis="strong"
        />

        <Card variant="subtle" padding="md" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
                Export
              </p>
              <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
                Download the proof JSON or inspect the raw payload before sending it elsewhere.
              </p>
            </div>
            <Button variant="primary" @click="downloadProof">Download proof</Button>
          </div>

          <Accordion
            :value="showProofJson ? 'raw-proof' : undefined"
            @update:value="(value) => { showProofJson = value === 'raw-proof'; }"
          >
            <AccordionItem value="raw-proof" title="Inspect raw proof JSON">
              <Textarea
                :model-value="proofJson"
                readonly
                rows="12"
                class="proof-shell-copy"
              />
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </template>

    <p
      v-if="notice"
      class="m-0 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-4 py-3 text-sm"
      aria-live="polite"
    >
      {{ notice }}
    </p>
    <p
      v-if="error"
      class="m-0 rounded-[var(--ui-radius-md)] border border-[var(--ui-critical)] bg-[var(--ui-critical-muted)] px-4 py-3 text-sm"
      aria-live="assertive"
    >
      {{ error }}
    </p>
  </section>
</template>

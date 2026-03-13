<script setup lang="ts">
import { computed, ref } from "vue";
import { SButton, SCard, SDisclosure, SFileInput, SInput, SRadioGroup, STextarea } from "ternent-ui/components";
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
const signModeOptions: Array<{ value: SignMode; label: string }> = [
  { value: "text", label: "Sign Text" },
  { value: "file", label: "Sign File" },
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
  return `${value.slice(0, 8)}...${value.slice(-8)}`;
});

const selectedFileModel = computed({
  get: () => selectedFile.value as File | undefined,
  set: (value: unknown) => {
    selectedFile.value = value instanceof File ? value : null;
  },
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
    <header>
      <h2 class="m-0 text-3xl font-medium tracking-tight">Sign</h2>
      <p class="mt-3 max-w-2xl text-base leading-7 text-fg-muted">Sign text or a file and export a portable proof.</p>
    </header>

    <SCard v-if="!hasIdentity" class="space-y-5 border border-border bg-surface p-6 md:p-8">
      <h3 class="m-0 text-lg">No identity loaded</h3>
      <p class="m-0 text-base text-fg-muted">Load an identity before signing content.</p>
      <SButton variant="secondary" to="/app/identity">Go to Identity</SButton>
    </SCard>

    <template v-else>
      <SCard class="space-y-6 border border-border bg-surface p-6 md:p-8">
        <SRadioGroup v-model="mode" :options="signModeOptions" aria-label="Signing mode" />

        <div v-if="mode === 'text'" class="space-y-4">
          <SInput v-model="textContentName" variant="ghost" size="md" placeholder="Optional content name" />
          <STextarea
            v-model="textContent"
            min-height="14rem"
            placeholder="Enter text to sign"
          />
        </div>

        <div v-else class="space-y-4">
          <SFileInput
            v-model="selectedFileModel"
            v-model:filename="selectedFileName"
            variant="dropzone"
            placeholder="Drop one file to sign, or click to choose"
          />

          <p v-if="selectedFile" class="m-0 text-sm text-fg-muted">
            Selected: {{ selectedFile.name }} ({{ selectedFile.size }} bytes)
          </p>
        </div>

        <div class="space-y-3 pt-1">
          <SButton variant="primary" :disabled="!canSign" :loading="isSigning" @click="onSign">
            {{ isSigning ? "Signing..." : "Sign" }}
          </SButton>
          <p class="min-h-5 text-xs text-fg-muted" aria-live="polite">{{ disabledReason }}</p>
        </div>
      </SCard>

      <SCard
        v-if="signedProof"
        class="space-y-5 border border-[rgba(80,200,120,0.24)] bg-[rgba(80,200,120,0.1)] p-6 md:p-8"
      >
        <div class="flex items-center gap-2">
          <span class="text-lg text-success">✓</span>
          <h3 class="m-0 text-xl">Proof generated successfully</h3>
        </div>

        <div class="grid gap-3 rounded-2xl border border-border bg-[var(--ui-surface-2)] p-4 text-sm">
          <div>
            <strong>Content hash:</strong>
            <span class="ml-1 font-mono text-xs text-fg">{{ signedProof.payload.contentHash }}</span>
          </div>
          <div>
            <strong>Signer fingerprint:</strong>
            <span class="ml-1 font-mono text-xs text-fg">{{ signerShort }}</span>
          </div>
          <div v-if="outputFileName"><strong>Name:</strong> {{ outputFileName }}</div>
        </div>

        <div class="flex flex-wrap gap-3">
          <SButton variant="primary" @click="downloadProof">Download proof</SButton>
        </div>

        <SDisclosure v-model:open="showProofJson" label="▶ View raw proof JSON" open-label="▼ Hide raw proof JSON">
          <STextarea
            min-height="16rem"
            monospace
            readonly
            :model-value="proofJson"
          />
        </SDisclosure>
      </SCard>
    </template>

    <p v-if="notice" class="m-0 rounded-xl border border-border bg-surface px-4 py-3 text-sm" aria-live="polite">
      {{ notice }}
    </p>
    <p v-if="error" class="m-0 rounded-xl border border-danger bg-danger-muted px-4 py-3 text-sm" aria-live="assertive">
      {{ error }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { SButton, SCard, SDisclosure, SFileInput, SRadioGroup, STextarea } from "ternent-ui/components";
import { hashBytes, hashData } from "ternent-utils";
import {
  parsePortableProofJson,
  verifyPortableProofSignature,
  type PortableProofV1,
} from "@/modules/proof";

type VerificationMode = "proof-only" | "proof-and-content";
type ContentMode = "text" | "file";

type StageOneResult = {
  status: "idle" | "valid" | "invalid";
  errors: string[];
  fingerprint?: string;
  contentHash?: string;
};

type StageTwoResult = {
  status: "idle" | "match" | "mismatch" | "error" | "skipped";
  message?: string;
  providedHash?: string;
};

const showRawProofJson = ref(false);
const proofJsonInput = ref("");
const proofFile = ref<File | null>(null);
const proofFileName = ref("");

const verificationMode = ref<VerificationMode>("proof-only");
const verificationModeOptions: Array<{ value: VerificationMode; label: string }> = [
  { value: "proof-only", label: "Verify proof only" },
  { value: "proof-and-content", label: "Verify proof + original content" },
];

const contentMode = ref<ContentMode>("text");
const contentModeOptions: Array<{ value: ContentMode; label: string }> = [
  { value: "text", label: "Text" },
  { value: "file", label: "File" },
];

const contentText = ref("");
const contentFile = ref<File | null>(null);
const contentFileName = ref("");

const isVerifying = ref(false);
const stageOne = ref<StageOneResult>({ status: "idle", errors: [] });
const stageTwo = ref<StageTwoResult>({ status: "idle" });

const parsedProof = ref<PortableProofV1 | null>(null);

const stageOneTone = computed(() => {
  if (stageOne.value.status === "valid") return "border border-[rgba(80,200,120,0.24)] bg-[rgba(80,200,120,0.1)]";
  if (stageOne.value.status === "invalid") return "border border-[rgba(255,90,90,0.22)] bg-[rgba(255,90,90,0.1)]";
  return "border border-border bg-surface";
});

const stageOneIcon = computed(() => {
  if (stageOne.value.status === "valid") return "✓";
  if (stageOne.value.status === "invalid") return "✕";
  return "•";
});

const stageOneTitle = computed(() => {
  if (stageOne.value.status === "valid") return "Proof verified";
  if (stageOne.value.status === "invalid") return "Proof verification failed";
  return "Stage 1 — Proof validation";
});

const stageTwoTone = computed(() => {
  if (stageTwo.value.status === "match") return "border border-[rgba(80,200,120,0.24)] bg-[rgba(80,200,120,0.1)]";
  if (stageTwo.value.status === "mismatch" || stageTwo.value.status === "error") {
    return "border border-[rgba(255,90,90,0.22)] bg-[rgba(255,90,90,0.1)]";
  }
  return "border border-border bg-surface";
});

const proofFileModel = computed({
  get: () => proofFile.value as File | undefined,
  set: (value: unknown) => {
    proofFile.value = value instanceof File ? value : null;
  },
});

const contentFileModel = computed({
  get: () => contentFile.value as File | undefined,
  set: (value: unknown) => {
    contentFile.value = value instanceof File ? value : null;
  },
});

const loadProofJson = async (): Promise<string> => {
  if (proofJsonInput.value.trim()) return proofJsonInput.value;
  if (proofFile.value) return proofFile.value.text();
  throw new Error("Upload a proof JSON file or provide raw proof JSON.");
};

const verifyContentMatch = async (proof: PortableProofV1): Promise<StageTwoResult> => {
  if (verificationMode.value === "proof-only") {
    return { status: "skipped", message: "Content match skipped (proof-only mode)." };
  }

  try {
    let providedHash = "";

    if (contentMode.value === "text") {
      if (!contentText.value.trim()) {
        return { status: "error", message: "Provide text content to compare." };
      }
      providedHash = await hashData(contentText.value);
    } else {
      if (!contentFile.value) {
        return { status: "error", message: "Upload a file to compare." };
      }
      const bytes = await contentFile.value.arrayBuffer();
      providedHash = await hashBytes(bytes);
    }

    if (providedHash === proof.payload.contentHash) {
      return {
        status: "match",
        message: "Content hash matches proof payload.",
        providedHash,
      };
    }

    return {
      status: "mismatch",
      message: "Content hash does not match proof payload.",
      providedHash,
    };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    return { status: "error", message };
  }
};

const onVerify = async () => {
  isVerifying.value = true;
  parsedProof.value = null;
  stageOne.value = { status: "idle", errors: [] };
  stageTwo.value = { status: "idle" };

  try {
    const rawProof = await loadProofJson();
    const parsed = parsePortableProofJson(rawProof);

    if (!parsed.ok || !parsed.proof) {
      stageOne.value = {
        status: "invalid",
        errors: parsed.errors,
      };
      stageTwo.value = { status: "skipped", message: "Content validation skipped because proof is invalid." };
      return;
    }

    const signatureCheck = await verifyPortableProofSignature(parsed.proof);

    if (!signatureCheck.ok) {
      stageOne.value = {
        status: "invalid",
        errors: signatureCheck.errors,
      };
      stageTwo.value = { status: "skipped", message: "Content validation skipped because signature is invalid." };
      return;
    }

    parsedProof.value = parsed.proof;

    stageOne.value = {
      status: "valid",
      errors: [],
      fingerprint: parsed.proof.fingerprint,
      contentHash: parsed.proof.payload.contentHash,
    };

    stageTwo.value = await verifyContentMatch(parsed.proof);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    stageOne.value = {
      status: "invalid",
      errors: [message],
    };
    stageTwo.value = { status: "skipped", message: "Content validation skipped because proof could not be processed." };
  } finally {
    isVerifying.value = false;
  }
};
</script>

<template>
  <section class="space-y-8 md:space-y-10">
    <header>
      <h2 class="m-0 text-3xl font-medium tracking-tight">Verify</h2>
      <p class="mt-3 max-w-2xl text-base leading-7 text-fg-muted">Verify a proof and optionally confirm content integrity.</p>
    </header>

    <SCard class="space-y-6 border border-border bg-surface p-6 md:p-8">
      <h3 class="m-0 text-lg">Proof input</h3>
      <SFileInput
        v-model="proofFileModel"
        v-model:filename="proofFileName"
        accept=".json,application/json,text/plain"
        placeholder="Choose proof JSON"
      />

      <SDisclosure v-model:open="showRawProofJson" label="▶ View raw proof JSON" open-label="▼ Hide raw proof JSON">
        <STextarea
          v-model="proofJsonInput"
          min-height="11rem"
          monospace
          placeholder="Paste proof JSON"
        />
      </SDisclosure>

      <div class="space-y-3 border-t border-border pt-4 text-sm">
        <p class="m-0 text-xs font-medium uppercase tracking-wide text-fg-muted">Verification mode</p>
        <SRadioGroup
          v-model="verificationMode"
          :options="verificationModeOptions"
          aria-label="Verification mode"
        />
      </div>

      <div v-if="verificationMode === 'proof-and-content'" class="space-y-4 rounded-2xl border border-border bg-[var(--ui-surface-2)] p-4">
        <p class="m-0 text-xs font-medium uppercase tracking-wide text-fg-muted">Optional content check</p>

        <SRadioGroup v-model="contentMode" :options="contentModeOptions" aria-label="Content mode" />

        <STextarea
          v-if="contentMode === 'text'"
          v-model="contentText"
          min-height="11rem"
          placeholder="Paste original text"
        />

        <SFileInput
          v-else
          v-model="contentFileModel"
          v-model:filename="contentFileName"
          placeholder="Choose original file"
        />
      </div>

      <SButton variant="primary" :loading="isVerifying" @click="onVerify">
        {{ isVerifying ? "Verifying..." : "Verify" }}
      </SButton>
    </SCard>

    <SCard class="space-y-4 p-6 md:p-8" :class="stageOneTone">
      <div class="flex items-center gap-2">
        <span class="text-lg">{{ stageOneIcon }}</span>
        <h3 class="m-0 text-xl font-medium">{{ stageOneTitle }}</h3>
      </div>

      <p v-if="stageOne.status === 'idle'" class="m-0 text-sm text-fg-muted">No verification run yet.</p>
      <p v-if="stageOne.status === 'valid'" class="m-0 text-sm">Signature valid.</p>

      <ul v-if="stageOne.status === 'invalid'" class="m-0 list-disc pl-5 text-sm">
        <li v-for="message in stageOne.errors" :key="message">{{ message }}</li>
      </ul>

      <div v-if="stageOne.status === 'valid'" class="grid gap-3 rounded-2xl border border-border bg-[var(--ui-surface-2)] p-4 text-sm">
        <div><strong>Signer fingerprint:</strong> <span class="font-mono text-xs text-fg">{{ stageOne.fingerprint }}</span></div>
        <div><strong>Content hash:</strong> <span class="font-mono text-xs text-fg">{{ stageOne.contentHash }}</span></div>
      </div>
    </SCard>

    <div class="border-t border-border pt-1"></div>

    <SCard class="space-y-4 p-6 md:p-8" :class="stageTwoTone">
      <h3 class="m-0 text-lg font-medium">Stage 2 — Content validation (optional)</h3>
      <p v-if="stageTwo.status === 'idle'" class="m-0 text-sm text-fg-muted">No content validation run yet.</p>
      <p v-else class="m-0 text-sm">{{ stageTwo.message }}</p>

      <div v-if="stageTwo.providedHash" class="text-sm">
        <strong>Provided content hash:</strong>
        <span class="font-mono text-xs">{{ stageTwo.providedHash }}</span>
      </div>
    </SCard>
  </section>
</template>

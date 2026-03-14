<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Card,
  FileInput,
  RadioGroup,
  Textarea,
} from "ternent-ui/primitives";
import {
  FormField,
  SectionIntro,
  VerificationDetailsPanel,
  VerificationSummary,
} from "ternent-ui/patterns";
import {
  createSealHash,
  parseSealProofJson,
  verifyPublishedArtifacts,
  verifySealProofSignature,
  type SealProofV1,
} from "@/modules/proof";

type VerificationMode = "proof-only" | "proof-and-content";
type ContentMode = "text" | "file";

type StageOneResult = {
  status: "idle" | "valid" | "invalid";
  errors: string[];
};

type StageTwoResult = {
  status: "idle" | "match" | "mismatch" | "error" | "skipped";
  message?: string;
  providedHash?: string;
};

type PublishedResult = {
  status: "idle" | "loading" | "valid" | "invalid";
  errors: string[];
  proof?: SealProofV1 | null;
  proofRaw?: string;
};

const showRawProofJson = ref(false);
const proofJsonInput = ref("");
const proofFile = ref<File | null>(null);
const proofFileName = ref("");
const verificationMode = ref<VerificationMode>("proof-only");
const contentMode = ref<ContentMode>("text");
const contentText = ref("");
const contentFile = ref<File | null>(null);
const contentFileName = ref("");
const isVerifying = ref(false);
const isVerifyingPublished = ref(false);
const stageOne = ref<StageOneResult>({ status: "idle", errors: [] });
const stageTwo = ref<StageTwoResult>({ status: "idle" });
const published = ref<PublishedResult>({ status: "idle", errors: [] });
const parsedProof = ref<SealProofV1 | null>(null);
const parsedProofRaw = ref("");

const verificationModeOptions = [
  {
    value: "proof-only",
    label: "Verify proof only",
    description: "Validate JSON shape and signature without checking source content.",
  },
  {
    value: "proof-and-content",
    label: "Verify proof + original content",
    description: "Validate the proof and compare it with the original text or file.",
  },
];

const contentModeOptions = [
  { value: "text", label: "Text", description: "Paste the original text to compare." },
  { value: "file", label: "File", description: "Upload the original file to compare." },
];

const stageOneStatusTone = computed(() => {
  if (stageOne.value.status === "valid") return "neutral";
  if (stageOne.value.status === "invalid") return "critical";
  return "neutral";
});

const stageTwoStatusTone = computed(() => {
  if (stageTwo.value.status === "match") return "neutral";
  if (stageTwo.value.status === "mismatch" || stageTwo.value.status === "error") return "critical";
  if (stageTwo.value.status === "skipped") return "warning";
  return "neutral";
});

const publishedStatusTone = computed(() => {
  if (published.value.status === "valid") return "success";
  if (published.value.status === "invalid") return "critical";
  return "neutral";
});

const proofFileModel = computed({
  get: () => proofFile.value,
  set: (value: File | File[] | null) => {
    proofFile.value = value instanceof File ? value : null;
  },
});

const contentFileModel = computed({
  get: () => contentFile.value,
  set: (value: File | File[] | null) => {
    contentFile.value = value instanceof File ? value : null;
  },
});

const stageTwoRows = computed(() => {
  if (!stageTwo.value.providedHash) return [];
  return [
    {
      label: "Provided subject hash",
      value: stageTwo.value.providedHash,
      valueTone: stageTwo.value.status === "match" ? ("success" as const) : ("critical" as const),
    },
  ];
});

const stageOneVerificationStatus = computed(() =>
  stageOne.value.status === "valid"
    ? "verified"
    : stageOne.value.status === "invalid"
      ? "failed"
      : "unknown"
);

const publishedVerificationStatus = computed(() =>
  published.value.status === "valid"
    ? "verified"
    : published.value.status === "invalid"
      ? "failed"
      : "unknown"
);

const parsedProofSize = computed(() => {
  if (!parsedProofRaw.value) return undefined;
  return `${new TextEncoder().encode(parsedProofRaw.value).byteLength} B`;
});

const publishedProofSize = computed(() => {
  if (!published.value.proofRaw) return undefined;
  return `${new TextEncoder().encode(published.value.proofRaw).byteLength} B`;
});

const loadProofJson = async (): Promise<string> => {
  if (proofJsonInput.value.trim()) return proofJsonInput.value;
  if (proofFile.value) return proofFile.value.text();
  throw new Error("Upload a proof JSON file or provide raw proof JSON.");
};

const verifyContentMatch = async (proof: SealProofV1): Promise<StageTwoResult> => {
  if (verificationMode.value === "proof-only") {
    return { status: "skipped", message: "Content match skipped (proof-only mode)." };
  }

  try {
    let providedHash = "";

    if (contentMode.value === "text") {
      if (!contentText.value.trim()) {
        return { status: "error", message: "Provide text content to compare." };
      }
      providedHash = await createSealHash(new TextEncoder().encode(contentText.value));
    } else {
      if (!contentFile.value) {
        return { status: "error", message: "Upload a file to compare." };
      }
      providedHash = await createSealHash(await contentFile.value.arrayBuffer());
    }

    if (providedHash === proof.subject.hash) {
      return {
        status: "match",
        message: "Content hash matches proof subject.",
        providedHash,
      };
    }

    return {
      status: "mismatch",
      message: "Content hash does not match proof subject.",
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
  parsedProofRaw.value = "";
  stageOne.value = { status: "idle", errors: [] };
  stageTwo.value = { status: "idle" };

  try {
    const rawProof = await loadProofJson();
    const parsed = parseSealProofJson(rawProof);

    if (!parsed.ok || !parsed.proof) {
      stageOne.value = {
        status: "invalid",
        errors: parsed.errors,
      };
      stageTwo.value = { status: "skipped", message: "Content validation skipped because proof is invalid." };
      return;
    }

    const signatureCheck = await verifySealProofSignature(parsed.proof);

    if (!signatureCheck.ok) {
      stageOne.value = {
        status: "invalid",
        errors: signatureCheck.errors,
      };
      stageTwo.value = { status: "skipped", message: "Content validation skipped because signature is invalid." };
      return;
    }

    parsedProof.value = parsed.proof;
    parsedProofRaw.value = rawProof;

    stageOne.value = {
      status: "valid",
      errors: [],
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

const onVerifyPublished = async () => {
  isVerifyingPublished.value = true;
  published.value = { status: "loading", errors: [] };

  try {
    const result = await verifyPublishedArtifacts();
    published.value = {
      status: result.valid ? "valid" : "invalid",
      errors: result.errors,
      proof: result.proof,
      proofRaw: result.proofRaw,
    };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    published.value = {
      status: "invalid",
      errors: [message],
      proof: null,
      proofRaw: "",
    };
  } finally {
    isVerifyingPublished.value = false;
  }
};
</script>

<template>
  <section class="space-y-8 md:space-y-10">
    <SectionIntro
      eyebrow="Verify"
      title="Validate proof structure, signature, and content integrity"
      description="Paste or upload a proof JSON payload, compare it with original bytes when needed, or verify the published site artifacts directly."
    />

    <Card variant="elevated" padding="md" class="space-y-6 border-[color-mix(in_srgb,var(--ui-border)_84%,transparent)]">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Verification input
          </p>
          <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">
            Provide a proof payload, choose the verification depth, and inspect the staged result surfaces below.
          </p>
        </div>
        <Badge tone="neutral" variant="outline">Verifier</Badge>
      </div>

      <FormField label="Proof file" description="JSON, plain text, or downloaded proof payloads are accepted.">
        <template #default>
          <FileInput
            v-model="proofFileModel"
            v-model:filename="proofFileName"
            accept=".json,application/json,text/plain"
            variant="dropzone"
            placeholder="Choose proof JSON"
          />
        </template>
      </FormField>

      <Accordion
        :value="showRawProofJson ? 'raw-proof' : undefined"
        @update:value="(value) => { showRawProofJson = value === 'raw-proof'; }"
      >
        <AccordionItem value="raw-proof" title="Inspect raw proof JSON">
          <Textarea
            v-model="proofJsonInput"
            rows="10"
            class="proof-shell-copy"
            placeholder="Paste proof JSON"
          />
        </AccordionItem>
      </Accordion>

      <div class="space-y-5">
        <FormField label="Verification mode" description="Choose whether to verify the proof alone or compare it with original content.">
          <template #default>
            <RadioGroup
              v-model="verificationMode"
              :options="verificationModeOptions"
              aria-label="Verification mode"
            />
          </template>
        </FormField>

        <Card v-if="verificationMode === 'proof-and-content'" variant="subtle" padding="md" class="space-y-5">
          <FormField label="Content mode" description="Choose how to provide the original content for comparison.">
            <template #default>
              <RadioGroup v-model="contentMode" :options="contentModeOptions" aria-label="Content mode" />
            </template>
          </FormField>

          <FormField
            v-if="contentMode === 'text'"
            label="Original text"
            description="Paste the original text that should match the proof subject bytes."
          >
            <template #default="{ id, describedBy }">
              <Textarea
                :id="id"
                v-model="contentText"
                :aria-describedby="describedBy"
                rows="8"
                placeholder="Paste original text"
              />
            </template>
          </FormField>

          <FormField
            v-else
            label="Original file"
            description="Upload the file that should match the proof subject bytes."
          >
            <template #default>
              <FileInput
                v-model="contentFileModel"
                v-model:filename="contentFileName"
                variant="dropzone"
                placeholder="Choose original file"
              />
            </template>
          </FormField>
        </Card>
      </div>

      <div class="space-y-3 border-t border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] pt-5">
        <div class="flex flex-wrap items-center gap-3">
          <Button variant="primary" :loading="isVerifying" @click="onVerify">
            {{ isVerifying ? "Verifying..." : "Verify proof" }}
          </Button>
          <Badge tone="neutral" variant="outline">
            {{ verificationMode === "proof-only" ? "Structure + signature" : "Structure + signature + content" }}
          </Badge>
        </div>
      </div>
    </Card>

    <Card variant="elevated" padding="md" class="space-y-5 border-[color-mix(in_srgb,var(--ui-border)_84%,transparent)]">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-2">
          <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Overall verification
          </p>
          <h3 class="m-0 text-2xl font-medium tracking-[-0.03em]">
            {{ stageOne.status === "valid" ? "Proof verified" : stageOne.status === "invalid" ? "Proof verification failed" : "Stage 1 — Proof validation" }}
          </h3>
        </div>
        <Badge :tone="stageOneStatusTone" variant="solid">
          {{ stageOne.status === "idle" ? "Not run" : stageOne.status === "valid" ? "Proof valid" : "Proof invalid" }}
        </Badge>
      </div>

      <p v-if="stageOne.status === 'idle'" class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
        No verification run yet.
      </p>
      <p v-if="stageOne.status === 'valid'" class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
        Proof JSON parsed successfully and the signature is valid.
      </p>

      <ul v-if="stageOne.status === 'invalid'" class="m-0 list-disc pl-5 text-sm">
        <li v-for="message in stageOne.errors" :key="message">{{ message }}</li>
      </ul>

      <VerificationSummary
        v-if="stageOne.status === 'valid'"
        :status="stageOneVerificationStatus"
        :subject="parsedProof?.subject.path || 'Proof subject'"
        :hash="parsedProof?.subject.hash || 'Unavailable'"
        :signer="parsedProof?.signer.keyId || 'Unknown signer'"
        :algorithm="parsedProof?.algorithm || 'Unknown'"
        :timestamp="parsedProof?.createdAt || 'Unavailable'"
        :version="parsedProof ? `seal/v${parsedProof.version}` : 'seal/v1'"
        :context="{ surface: 'browser', location: 'app' }"
        variant="compact"
      />
    </Card>

    <Card variant="subtle" padding="md" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1">
          <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Content match
          </p>
          <h3 class="m-0 text-lg font-medium">Optional content validation</h3>
        </div>
        <Badge :tone="stageTwoStatusTone" variant="outline">
          {{ stageTwo.status === "idle" ? "Not run" : stageTwo.status }}
        </Badge>
      </div>

      <p v-if="stageTwo.status === 'idle'" class="m-0 text-sm text-[var(--ui-fg-muted)]">
        No content validation run yet.
      </p>
      <p v-else class="m-0 text-sm">
        {{ stageTwo.message }}
      </p>

      <PreviewPanel
        v-if="stageTwoRows.length"
        title="Compared content"
        :rows="stageTwoRows"
        :status-label="stageTwo.status === 'match' ? 'Match' : 'Mismatch'"
        :status-tone="stageTwo.status === 'match' ? 'neutral' : 'critical'"
        emphasis="subtle"
      />
    </Card>

    <Card variant="elevated" padding="md" class="space-y-5 border-[color-mix(in_srgb,var(--ui-border)_84%,transparent)]">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-2">
          <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Published artifacts
          </p>
          <h3 class="m-0 text-xl font-medium tracking-[-0.02em]">Verify deployed site proof</h3>
        </div>
        <Badge :tone="publishedStatusTone" variant="solid">
          {{ published.status === "idle" ? "Not run" : published.status === "loading" ? "Loading" : published.status === "valid" ? "Verified" : "Invalid" }}
        </Badge>
      </div>

      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
        Fetch `/dist-manifest.json`, `/proof.json`, and optional `/public-key.json` from the current site origin and validate them locally.
      </p>

      <div class="flex flex-wrap items-center gap-3">
        <Button variant="primary" :loading="isVerifyingPublished" @click="onVerifyPublished">
          {{ isVerifyingPublished ? "Checking..." : "Verify published artifacts" }}
        </Button>
      </div>

      <p v-if="published.status === 'idle'" class="m-0 text-sm text-[var(--ui-fg-muted)]">
        No published-artifact check run yet.
      </p>

      <ul v-if="published.status === 'invalid'" class="m-0 list-disc pl-5 text-sm">
        <li v-for="message in published.errors" :key="message">{{ message }}</li>
      </ul>

      <VerificationDetailsPanel
        v-if="published.proof"
        :status="publishedVerificationStatus"
        :subject="published.proof.subject.path"
        :hash="published.proof.subject.hash"
        :signer="published.proof.signer.keyId"
        :algorithm="published.proof.algorithm"
        :timestamp="published.proof.createdAt"
        :version="`seal/v${published.proof.version}`"
        :signature="published.proof.signature"
        :proof-size="publishedProofSize"
        :context="{ surface: 'browser', location: 'app' }"
        variant="compact"
        :raw-proof="published.proofRaw"
        headline="Published proof"
      />
    </Card>
  </section>
</template>

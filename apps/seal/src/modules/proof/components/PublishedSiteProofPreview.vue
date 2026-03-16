<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Popover } from "ternent-ui/primitives";
import {
  VerificationBadge,
  VerificationDetailsPanel,
  VerificationSummary,
  type VerificationStatus,
  type VerificationVariant,
} from "ternent-ui/patterns";
import {
  verifyPublishedArtifacts,
  type PublishedArtifactsVerification,
} from "../deployed";

type PublishedSiteProofPreviewMode = "details" | "summary" | "badge";

const props = withDefaults(
  defineProps<{
    mode?: PublishedSiteProofPreviewMode;
    headline?: string;
    baseUrl?: string;
    variant?: VerificationVariant;
    showRawProof?: boolean;
    withPopover?: boolean;
  }>(),
  {
    mode: "details",
    headline: undefined,
    baseUrl: "",
    variant: "full",
    showRawProof: false,
    withPopover: false,
  },
);

const result = ref<PublishedArtifactsVerification | null>(null);
const isLoading = ref(true);

function formatProofJson(raw: string): string {
  try {
    return `${JSON.stringify(JSON.parse(raw), null, 2)}`;
  } catch {
    return raw;
  }
}

function formatBytes(raw: string): string {
  return `${new TextEncoder().encode(raw).byteLength} B`;
}

async function loadPublishedProof() {
  isLoading.value = true;
  try {
    result.value = await verifyPublishedArtifacts(fetch, props.baseUrl);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    result.value = {
      valid: false,
      proof: null,
      proofRaw: "",
      publicKeyArtifact: null,
      keyId: "",
      algorithm: "",
      subjectHash: "",
      errors: [message],
    };
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadPublishedProof();
});

const verificationStatus = computed<VerificationStatus>(() => {
  if (isLoading.value) return "unknown";
  return result.value?.valid ? "verified" : "failed";
});

const subject = computed(() => {
  if (result.value?.proof?.subject.path) return result.value.proof.subject.path;
  return isLoading.value
    ? "Loading published proof"
    : "Published proof unavailable";
});

const hash = computed(() => {
  if (result.value?.proof?.subject.hash) return result.value.proof.subject.hash;
  return result.value?.subjectHash || "Unavailable";
});

const signer = computed(() => {
  if (result.value?.proof?.signer.keyId) return result.value.proof.signer.keyId;
  return "Unknown signer";
});

const algorithm = computed(() => {
  if (result.value?.proof?.algorithm) return result.value.proof.algorithm;
  return "Unknown";
});

const timestamp = computed(() => {
  if (result.value?.proof?.createdAt) return result.value.proof.createdAt;
  return isLoading.value ? "Checking" : "Unavailable";
});

const version = computed(() => {
  if (result.value?.proof?.version)
    return `seal/v${result.value.proof.version}`;
  return "seal/v1";
});

const proofSize = computed(() => {
  if (!result.value?.proofRaw) return undefined;
  return formatBytes(result.value.proofRaw);
});

const proofCode = computed(() => {
  if (!result.value?.proofRaw || !props.showRawProof) return undefined;
  return formatProofJson(result.value.proofRaw);
});

const surfaceContext = computed(() => ({
  surface: "browser" as const,
  location:
    props.mode === "badge"
      ? ("footer" as const)
      : props.variant === "compact"
      ? ("app" as const)
      : ("hero" as const),
}));
</script>

<template>
  <Popover
    v-if="props.mode === 'badge' && props.withPopover"
    placement="top-end"
    title="Published proof"
    description="Verification summary for the current site artifacts."
  >
    <template #trigger>
      <VerificationBadge
        :status="verificationStatus"
        :context="surfaceContext"
        size="sm"
        :subject="subject"
      />
    </template>

    <VerificationSummary
      :status="verificationStatus"
      :subject="subject"
      :hash="hash"
      :signer="signer"
      :algorithm="algorithm"
      :timestamp="timestamp"
      :version="version"
      :context="surfaceContext"
      variant="compact"
    />

    <ul
      v-if="!isLoading && result?.errors?.length"
      class="m-0 list-disc pl-5 text-sm text-[var(--ui-fg-muted)]"
    >
      <li v-for="message in result.errors" :key="message">{{ message }}</li>
    </ul>
  </Popover>

  <VerificationBadge
    v-else-if="props.mode === 'badge'"
    :status="verificationStatus"
    :context="surfaceContext"
    size="sm"
    :subject="subject"
  />

  <VerificationSummary
    v-else-if="props.mode === 'summary'"
    :status="verificationStatus"
    :subject="subject"
    :hash="hash"
    :signer="signer"
    :algorithm="algorithm"
    :timestamp="timestamp"
    :version="version"
    :context="surfaceContext"
    :variant="props.variant === 'full' ? 'full' : 'compact'"
  />

  <VerificationDetailsPanel
    v-else
    :status="verificationStatus"
    :subject="subject"
    :hash="hash"
    :signer="signer"
    :algorithm="algorithm"
    :timestamp="timestamp"
    :version="version"
    :signature="result?.proof?.signature"
    :proof-size="proofSize"
    :context="surfaceContext"
    :variant="props.variant === 'compact' ? 'compact' : 'full'"
    :raw-proof="proofCode"
    :headline="props.headline"
  />

  <ul
    v-if="props.mode !== 'badge' && !isLoading && result?.errors?.length"
    class="m-0 list-disc pl-5 text-sm text-[var(--ui-fg-muted)]"
  >
    <li v-for="message in result.errors" :key="message">{{ message }}</li>
  </ul>
</template>

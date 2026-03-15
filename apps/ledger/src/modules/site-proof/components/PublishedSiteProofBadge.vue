<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Popover } from "ternent-ui/primitives";
import {
  VerificationBadge,
  VerificationSummary,
  type VerificationStatus,
} from "ternent-ui/patterns";
import {
  verifyPublishedArtifacts,
  type PublishedArtifactsVerification,
} from "../publishedSiteProof";

const props = withDefaults(
  defineProps<{
    baseUrl?: string;
    withPopover?: boolean;
  }>(),
  {
    baseUrl: "",
    withPopover: true,
  },
);

const result = ref<PublishedArtifactsVerification | null>(null);
const isLoading = ref(true);

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
  return isLoading.value ? "Checking site proof" : "Published proof unavailable";
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
  if (result.value?.proof?.version) return `seal/v${result.value.proof.version}`;
  return "seal/v1";
});

const surfaceContext = computed(() => ({
  surface: "browser" as const,
  location: "footer" as const,
}));
</script>

<template>
  <Popover
    v-if="props.withPopover"
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
    v-else
    :status="verificationStatus"
    :context="surfaceContext"
    size="sm"
    :subject="subject"
  />
</template>

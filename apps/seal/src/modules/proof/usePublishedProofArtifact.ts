import { computed, onMounted, ref, toValue, type MaybeRefOrGetter } from "vue";
import {
  verifyPublishedArtifacts,
  type PublishedArtifactsVerification,
} from "./deployed";

export type PublishedProofArtifactStatus =
  | "loading"
  | "verified"
  | "failed"
  | "unavailable";

function formatProofJson(raw: string): string {
  try {
    return `${JSON.stringify(JSON.parse(raw), null, 2)}`;
  } catch {
    return raw;
  }
}

export function usePublishedProofArtifact(
  baseUrl: MaybeRefOrGetter<string> = "",
) {
  const result = ref<PublishedArtifactsVerification | null>(null);
  const isLoading = ref(true);
  const errorMessage = ref<string | null>(null);

  async function loadProofArtifact() {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      result.value = await verifyPublishedArtifacts(fetch, toValue(baseUrl));
    } catch (caught) {
      errorMessage.value =
        caught instanceof Error ? caught.message : String(caught);
      result.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    void loadProofArtifact();
  });

  const artifactJson = computed(() => {
    if (result.value?.proofRaw) return formatProofJson(result.value.proofRaw);

    if (isLoading.value) {
      return `{
  "type": "seal-proof",
  "version": "2",
  "status": "loading"
}`;
    }

    return `{
  "type": "seal-proof",
  "version": "2",
  "status": "unavailable"
}`;
  });

  const status = computed<PublishedProofArtifactStatus>(() => {
    if (isLoading.value) return "loading";
    if (errorMessage.value) return "unavailable";
    return result.value?.valid ? "verified" : "failed";
  });

  const statusLabel = computed(() => {
    if (status.value === "loading") return "Checking proof";
    if (status.value === "unavailable") return "Proof unavailable";
    if (status.value === "verified") return "Proof verified";
    return "Proof failed";
  });

  const statusDetail = computed(() => {
    if (status.value === "loading") {
      return "Fetching /proof.json and verifying it against the published artifact.";
    }
    if (errorMessage.value) return errorMessage.value;
    if (result.value?.valid) {
      return "Fetched from the current site and verified against the published artifact bytes.";
    }
    return (
      result.value?.errors?.[0] ??
      "The published proof could not be verified against the current site artifacts."
    );
  });

  return {
    artifactJson,
    errorMessage,
    isLoading,
    loadProofArtifact,
    result,
    status,
    statusDetail,
    statusLabel,
  };
}

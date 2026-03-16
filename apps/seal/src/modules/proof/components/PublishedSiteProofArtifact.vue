<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  verifyPublishedArtifacts,
  type PublishedArtifactsVerification,
} from "../deployed";

const props = withDefaults(
  defineProps<{
    baseUrl?: string;
  }>(),
  {
    baseUrl: "",
  },
);

const result = ref<PublishedArtifactsVerification | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

function formatProofJson(raw: string): string {
  try {
    return `${JSON.stringify(JSON.parse(raw), null, 2)}`;
  } catch {
    return raw;
  }
}

async function loadProofArtifact() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    result.value = await verifyPublishedArtifacts(fetch, props.baseUrl);
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

const metaLabel = computed(() => {
  if (isLoading.value) return "loading";
  if (errorMessage.value) return "unavailable";
  return "published";
});
</script>

<template>
  <div
    class="overflow-hidden rounded-[var(--ui-radius-lg)] border border-[color-mix(in_srgb,var(--ui-border)_84%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_94%,transparent)]"
  >
    <div
      class="flex items-center justify-between border-b border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
    >
      <span>proof.json</span>
      <span>{{ metaLabel }}</span>
    </div>
    <pre
      class="m-0 overflow-x-auto p-6 text-[0.84rem] leading-7 text-[var(--ui-fg)]"
    ><code>{{ artifactJson }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePublishedProofArtifact } from "../usePublishedProofArtifact";

const props = withDefaults(
  defineProps<{
    baseUrl?: string;
  }>(),
  {
    baseUrl: "",
  },
);

const { artifactJson, result, status, statusDetail, statusLabel } =
  usePublishedProofArtifact(() => props.baseUrl);

const statusTone = computed(() => {
  if (status.value === "loading" || status.value === "unavailable") {
    return "text-[var(--ui-fg-muted)]";
  }
  return status.value === "verified"
    ? "text-[var(--ui-fg)]"
    : "text-[color:var(--ui-danger,#f87171)]";
});
</script>

<template>
  <div
    class="mt-12 overflow-hidden rounded-[var(--ui-radius-lg)] border border-[color-mix(in_srgb,var(--ui-border)_86%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_94%,transparent)]"
    data-testid="live-published-proof-json"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] px-5 py-3"
    >
      <span
        class="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
      >
        proof.json
      </span>
      <div class="flex items-center gap-3 text-right">
        <span
          class="text-[0.72rem] font-semibold uppercase tracking-[0.14em]"
          :class="statusTone"
        >
          {{ statusLabel }}
        </span>
      </div>
    </div>
    <pre
      class="m-0 overflow-x-auto p-6 text-[0.84rem] leading-7 text-[var(--ui-fg)]"
    ><code>{{ artifactJson }}</code></pre>
  </div>
  <div class="mt-4 space-y-2">
    <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
      The proof is self-describing and versioned.
    </p>
    <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
      {{ statusDetail }}
    </p>
  </div>
</template>

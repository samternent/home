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

function truncateMiddle(value: string, head = 14, tail = 10) {
  if (!value) return "Unavailable";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

const { result, status, statusDetail, statusLabel } = usePublishedProofArtifact(
  () => props.baseUrl,
);

const proofHref = computed(() => `${props.baseUrl || ""}/proof.json`);

const statusClass = computed(() => {
  if (status.value === "verified") {
    return "border-[color-mix(in_srgb,var(--ui-primary)_34%,transparent)] bg-[color-mix(in_srgb,var(--ui-primary)_12%,transparent)] text-[var(--ui-fg)]";
  }
  if (status.value === "failed") {
    return "border-[color:var(--ui-danger,#f87171)]/35 bg-[color:var(--ui-danger,#f87171)]/10 text-[color:var(--ui-danger,#fca5a5)]";
  }
  return "border-[color-mix(in_srgb,var(--ui-border)_84%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] text-[var(--ui-fg-muted)]";
});

const rows = computed(() => [
  { label: "Type", value: result.value?.proof?.type ?? "seal-proof" },
  { label: "Version", value: result.value?.proof?.version ?? "2" },
  {
    label: "Subject",
    value: result.value?.proof?.subject?.path ?? "dist-manifest.json",
  },
  {
    label: "Algorithm",
    value: result.value?.proof?.algorithm ?? "Ed25519",
  },
  {
    label: "Hash",
    value: truncateMiddle(result.value?.subjectHash ?? ""),
  },
  {
    label: "Signer",
    value: truncateMiddle(result.value?.keyId ?? "", 12, 8),
  },
]);
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[calc(var(--ui-radius-lg)+8px)] border border-[color-mix(in_srgb,var(--ui-border)_84%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-surface)_97%,transparent),color-mix(in_srgb,var(--ui-bg)_96%,transparent))] shadow-[0_30px_100px_color-mix(in_srgb,var(--ui-bg)_72%,transparent)]"
    data-testid="hero-proof-artifact-card"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--ui-primary)_18%,transparent),transparent_42%),radial-gradient(circle_at_88%_18%,color-mix(in_srgb,var(--ui-accent,white)_10%,transparent),transparent_32%)]"
    />
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--ui-fg)_28%,transparent),transparent)]"
    />

    <div class="relative p-6 lg:p-7">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-1.5">
          <p
            class="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
          >
            Live published proof
          </p>
          <h3
            class="m-0 text-[1.8rem] font-medium tracking-[-0.04em] text-[var(--ui-fg)]"
          >
            proof.json
          </h3>
        </div>
        <span
          class="inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.14em]"
          :class="statusClass"
        >
          {{ statusLabel }}
        </span>
      </div>

      <div
        class="mt-6 grid gap-0 overflow-hidden rounded-[calc(var(--ui-radius-md)+2px)] border border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_70%,transparent)] backdrop-blur-sm"
      >
        <div
          v-for="row in rows"
          :key="row.label"
          class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 border-t border-[color-mix(in_srgb,var(--ui-border)_76%,transparent)] px-4 py-3 first:border-t-0"
        >
          <span
            class="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-fg-muted)]"
          >
            {{ row.label }}
          </span>
          <span
            class="min-w-0 truncate font-mono text-[0.88rem] text-[var(--ui-fg)]"
          >
            {{ row.value }}
          </span>
        </div>
      </div>

      <p class="mt-5 mb-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
        {{ statusDetail }}
      </p>
      <a
        :href="proofHref"
        target="_blank"
        rel="noreferrer"
        class="mt-3 inline-flex text-sm font-medium text-[var(--ui-fg)] underline decoration-[color-mix(in_srgb,var(--ui-fg)_28%,transparent)] underline-offset-4 transition hover:decoration-[color-mix(in_srgb,var(--ui-fg)_56%,transparent)]"
      >
        View proof.json
      </a>
    </div>
  </div>
</template>

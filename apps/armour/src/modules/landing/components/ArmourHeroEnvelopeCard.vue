<script setup lang="ts">
const rows = [
  { label: "Kind", value: "armour-envelope" },
  { label: "Mode", value: "recipients" },
  { label: "Bridge", value: "@ternent/identity -> @ternent/rage" },
  { label: "Ciphertext", value: "Age-compatible armor" },
  { label: "Metadata", value: "Optional JSON transport only" },
  { label: "Boundary", value: "Encryption is not signing" },
];
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[calc(var(--ui-radius-lg)+8px)] border border-[color-mix(in_srgb,var(--ui-border)_84%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-surface)_97%,transparent),color-mix(in_srgb,var(--ui-bg)_96%,transparent))] shadow-[0_30px_100px_color-mix(in_srgb,var(--ui-bg)_72%,transparent)]"
    data-testid="hero-armour-envelope-card"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--ui-primary)_18%,transparent),transparent_42%),radial-gradient(circle_at_88%_18%,color-mix(in_srgb,var(--ui-accent,white)_10%,transparent),transparent_32%)]"
    />
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--ui-fg)_28%,transparent),transparent)]"
    />

    <div class="relative p-6 lg:p-7">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h3
          class="m-0 text-[1.8rem] font-medium tracking-[-0.04em] text-[var(--ui-fg)]"
        >
          armour-envelope.json
        </h3>
        <span
          class="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--ui-primary)_34%,transparent)] bg-[color-mix(in_srgb,var(--ui-primary)_12%,transparent)] px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[var(--ui-fg)]"
        >
          versioned
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
        Optional JSON around armored ciphertext. The underlying encryption remains
        delegated to rage.
      </p>
      <a
        href="https://github.com/samternent/home/tree/main/packages/armour"
        target="_blank"
        rel="noreferrer"
        class="mt-3 inline-flex text-sm font-medium text-[var(--ui-fg)] underline decoration-[color-mix(in_srgb,var(--ui-fg)_28%,transparent)] underline-offset-4 transition hover:decoration-[color-mix(in_srgb,var(--ui-fg)_56%,transparent)]"
      >
        View @ternent/armour
      </a>
    </div>
  </div>
</template>

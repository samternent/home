<script setup lang="ts">
const envelopeJson = `${JSON.stringify(
  {
    version: 1,
    kind: "armour-envelope",
    mode: "recipients",
    encoding: "armor",
    ciphertext:
      "-----BEGIN AGE ENCRYPTED FILE-----\n...\n-----END AGE ENCRYPTED FILE-----\n",
    recipients: ["age1x7k5m0example9a2n4d4ptf9g5x2v3s7m6p8u4wq"],
    metadata: {
      purpose: "document-share",
    },
  },
  null,
  2,
)}`;
</script>

<template>
  <div
    class="mt-12 overflow-hidden rounded-[var(--ui-radius-lg)] border border-[color-mix(in_srgb,var(--ui-border)_86%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_94%,transparent)]"
    data-testid="live-armour-envelope-json"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] px-5 py-3"
    >
      <span
        class="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
      >
        armour-envelope.json
      </span>
      <div class="flex items-center gap-3 text-right">
        <span
          class="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-fg)]"
        >
          optional container
        </span>
      </div>
    </div>
    <pre
      class="m-0 overflow-x-auto p-6 text-[0.84rem] leading-7 text-[var(--ui-fg)]"
    ><code>{{ envelopeJson }}</code></pre>
  </div>
  <div class="mt-4 space-y-2">
    <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
      The envelope stays explicit and versioned.
    </p>
    <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
      It carries armored ciphertext without changing age semantics or implying
      authenticity.
    </p>
  </div>
</template>

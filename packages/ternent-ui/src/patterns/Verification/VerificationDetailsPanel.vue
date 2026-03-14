<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "../../primitives/Button/Button.vue";
import Card from "../../primitives/Card/Card.vue";
import Separator from "../../primitives/Separator/Separator.vue";
import PreviewPanel from "../PreviewPanel/PreviewPanel.vue";
import VerificationBadge from "./VerificationBadge.vue";
import type {
  VerificationContext,
  VerificationStatus,
} from "./verification.types";
import {
  copyToClipboard,
  getVerificationContextSubtext,
  getVerificationHeadline,
  truncateMiddle,
} from "./verification.utils";

const props = withDefaults(
  defineProps<{
    status: VerificationStatus;
    subject: string;
    hash: string;
    signer: string;
    algorithm: string;
    timestamp: string;
    version: string;
    signature?: string;
    proofSize?: string;
    context?: VerificationContext;
    variant?: "full" | "compact";
    rawProof?: string;
    copyable?: boolean;
    headline?: string;
    subtext?: string;
  }>(),
  {
    signature: undefined,
    proofSize: undefined,
    context: undefined,
    variant: "full",
    rawProof: undefined,
    copyable: true,
    headline: undefined,
    subtext: undefined,
  },
);

const copiedKey = ref<string | null>(null);
const isRawProofOpen = ref(false);

async function handleCopy(field: string, value: string) {
  if (!props.copyable) return;
  const copied = await copyToClipboard(value);
  if (!copied) return;
  copiedKey.value = field;
  window.setTimeout(() => {
    if (copiedKey.value === field) {
      copiedKey.value = null;
    }
  }, 1200);
}

function copyLabel(field: string) {
  return copiedKey.value === field ? "Copied" : "Copy";
}

const cardPadding = computed(() => (props.variant === "full" ? "md" : "sm"));
const headlineText = computed(
  () => props.headline ?? getVerificationHeadline(props.status),
);
const subtextText = computed(
  () =>
    props.subtext ?? getVerificationContextSubtext(props.status, props.context),
);
const subjectClass = computed(() =>
  props.variant === "full"
    ? "text-2xl leading-tight md:text-[2.15rem]"
    : "text-xl leading-tight",
);
const hashPreview = computed(() =>
  props.variant === "full"
    ? truncateMiddle(props.hash, 20, 18)
    : truncateMiddle(props.hash, 14, 12),
);
const signerPreview = computed(() => truncateMiddle(props.signer, 16, 14));
const metadataItems = computed(() => {
  const items = [props.version, props.timestamp];
  if (props.proofSize) items.push(props.proofSize);
  if (props.signature) items.push(`${props.signature.length} chars`);
  return items;
});
</script>

<template>
  <Card
    variant="panel"
    :padding="cardPadding"
    class="min-w-0 max-w-full space-y-5"
    :data-variant="props.variant"
  >
    <div class="space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <h3
            class="m-0 text-xl font-medium tracking-[-0.03em] text-[var(--ui-fg)]"
          >
            {{ headlineText }}
          </h3>
          <p
            v-if="subtextText"
            class="m-0 text-sm leading-6 text-[var(--ui-fg-muted)]"
          >
            {{ subtextText }}
          </p>
        </div>

        <VerificationBadge
          :status="props.status"
          :context="props.context"
          :size="props.variant === 'full' ? 'md' : 'sm'"
        />
      </div>
    </div>

    <Separator />

    <section class="space-y-3">
      <p
        class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
      >
        Subject
      </p>
      <p
        :class="[
          'm-0 font-medium tracking-[-0.03em] text-[var(--ui-fg)]',
          subjectClass,
        ]"
      >
        {{ props.subject }}
      </p>

      <div class="space-y-2">
        <p
          class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
        >
          Hash
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <code
            class="min-w-0 flex-1 truncate rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] px-3 py-2 font-mono text-sm text-[var(--ui-fg)]"
            :title="props.hash"
          >
            {{ hashPreview }}
          </code>
          <Button
            v-if="props.copyable"
            size="xs"
            variant="plain-secondary"
            :aria-label="`Copy hash ${props.hash}`"
            @click="handleCopy('hash', props.hash)"
          >
            {{ copyLabel("hash") }}
          </Button>
        </div>
      </div>
    </section>

    <Separator />

    <section class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <p
          class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
        >
          Signed by
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <code
            class="min-w-0 flex-1 truncate rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] px-2.5 py-2 font-mono text-sm text-[var(--ui-fg)]"
            :title="props.signer"
          >
            {{ signerPreview }}
          </code>
          <Button
            v-if="props.copyable"
            size="xs"
            variant="plain-secondary"
            :aria-label="`Copy signer ${props.signer}`"
            @click="handleCopy('signer', props.signer)"
          >
            {{ copyLabel("signer") }}
          </Button>
        </div>
      </div>

      <div class="space-y-2">
        <p
          class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
        >
          Algorithm
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <code
            class="min-w-0 flex-1 truncate rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] px-2.5 py-2 font-mono text-sm text-[var(--ui-fg)]"
            :title="props.algorithm"
          >
            {{ props.algorithm }}
          </code>
          <Button
            v-if="props.copyable"
            size="xs"
            variant="plain-secondary"
            :aria-label="`Copy algorithm ${props.algorithm}`"
            @click="handleCopy('algorithm', props.algorithm)"
          >
            {{ copyLabel("algorithm") }}
          </Button>
        </div>
      </div>
    </section>

    <Separator />

    <section
      class="flex flex-wrap items-center gap-2 text-xs text-[var(--ui-fg-muted)]"
    >
      <span
        v-for="item in metadataItems"
        :key="item"
        class="rounded-full border border-[var(--ui-border)] px-2 py-1"
      >
        {{ item }}
      </span>
    </section>

    <section
      v-if="props.rawProof"
      class="min-w-0 max-w-full overflow-hidden rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)]"
    >
      <button
        type="button"
        class="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-[var(--ui-fg)] transition-[color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] hover:text-[var(--ui-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
        :aria-expanded="isRawProofOpen"
        @click="isRawProofOpen = !isRawProofOpen"
      >
        <span class="min-w-0 truncate">View raw proof</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          :class="[
            'size-4 shrink-0 text-[var(--ui-fg-muted)] transition-transform duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)]',
            isRawProofOpen ? 'rotate-180' : '',
          ]"
        >
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div
        v-if="isRawProofOpen"
        class="min-w-0 max-w-full overflow-hidden border-t border-[var(--ui-border)] p-4 pt-4"
      >
        <div class="min-w-0 max-w-full overflow-hidden">
          <pre
            class="ui-preview-panel__code"
          ><code>{{ props.rawProof }}</code></pre>
        </div>
      </div>
    </section>
  </Card>
</template>
<style>
.ui-preview-panel__code {
  margin: 0;
  min-width: 0;
  max-width: 100%;
  padding: 1rem 1.125rem;
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, var(--ui-border) 72%, transparent);
  border-radius: var(--ui-radius-md);
  background: color-mix(in srgb, var(--ui-bg) 55%, var(--ui-surface));
  color: var(--ui-fg);
  font-size: 0.92rem;
  line-height: 1.8;
}
</style>

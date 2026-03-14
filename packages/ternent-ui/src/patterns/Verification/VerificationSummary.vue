<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "../../primitives/Button/Button.vue";
import Card from "../../primitives/Card/Card.vue";
import Separator from "../../primitives/Separator/Separator.vue";
import VerificationBadge from "./VerificationBadge.vue";
import type {
  VerificationContext,
  VerificationStatus,
} from "./verification.types";
import {
  copyToClipboard,
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
    context?: VerificationContext;
    variant?: "compact" | "full";
    copyable?: boolean;
  }>(),
  {
    context: undefined,
    variant: "compact",
    copyable: true,
  }
);

const copiedKey = ref<string | null>(null);

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
const subjectClass = computed(() =>
  props.variant === "full"
    ? "text-2xl leading-tight md:text-[2rem]"
    : "text-xl leading-tight"
);
const headerTitle = computed(() => getVerificationHeadline(props.status));
const hashPreview = computed(() => truncateMiddle(props.hash, 16, 12));
const signerPreview = computed(() => truncateMiddle(props.signer, 14, 12));
</script>

<template>
  <Card
    variant="panel"
    :padding="cardPadding"
    class="space-y-4"
    :data-variant="props.variant"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <p
          class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]"
        >
          Proof summary
        </p>
        <h3 class="m-0 text-lg font-medium tracking-[-0.02em] text-[var(--ui-fg)]">
          {{ headerTitle }}
        </h3>
      </div>
      <VerificationBadge
        :status="props.status"
        :context="props.context"
        :size="props.variant === 'full' ? 'md' : 'sm'"
      />
    </div>

    <div class="space-y-3">
      <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
        Subject
      </p>
      <p :class="['m-0 font-medium tracking-[-0.03em] text-[var(--ui-fg)]', subjectClass]">
        {{ props.subject }}
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Hash
        </span>
        <code
          class="min-w-0 flex-1 truncate rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] px-2.5 py-1 font-mono text-xs text-[var(--ui-fg)]"
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

    <Separator />

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Signed by
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <code
            class="min-w-0 flex-1 truncate font-mono text-sm text-[var(--ui-fg)]"
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
        <p class="m-0 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Algorithm
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <code
            class="min-w-0 flex-1 truncate font-mono text-sm text-[var(--ui-fg)]"
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
    </div>

    <Separator />

    <div
      class="flex flex-wrap items-center gap-2 text-xs text-[var(--ui-fg-muted)]"
    >
      <span class="rounded-full border border-[var(--ui-border)] px-2 py-1">
        {{ props.version }}
      </span>
      <span class="rounded-full border border-[var(--ui-border)] px-2 py-1">
        {{ props.timestamp }}
      </span>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Badge from "../../primitives/Badge/Badge.vue";
import type { VerificationContext, VerificationStatus } from "./verification.types";
import {
  getVerificationBadgeTone,
  getVerificationStatusLabel,
  getVerificationSurfaceLabel,
  truncateMiddle,
} from "./verification.utils";

const props = withDefaults(
  defineProps<{
    status: VerificationStatus;
    context?: VerificationContext;
    size?: "sm" | "md";
    subject?: string;
    label?: string;
  }>(),
  {
    context: undefined,
    size: "sm",
    subject: undefined,
    label: undefined,
  }
);

const tone = computed(() => getVerificationBadgeTone(props.status));
const displayLabel = computed(
  () => props.label ?? getVerificationStatusLabel(props.status)
);
const contextLabel = computed(() =>
  getVerificationSurfaceLabel(props.context?.surface)
);
const truncatedSubject = computed(() => {
  if (!props.subject) return undefined;
  return truncateMiddle(props.subject, props.size === "md" ? 16 : 12, props.size === "md" ? 14 : 10);
});
const iconClass = computed(() =>
  props.size === "md" ? "size-4" : "size-3.5"
);
</script>

<template>
  <Badge
    :tone="tone"
    variant="outline"
    :size="props.size === 'md' ? 'md' : 'sm'"
    class="max-w-full"
    :data-status="props.status"
  >
    <span class="flex min-w-0 items-center gap-1.5">
      <span :class="iconClass" aria-hidden="true">
        <svg
          v-if="props.status === 'verified'"
          viewBox="0 0 24 24"
          fill="none"
          class="size-full"
        >
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            stroke-width="1.75"
          />
          <path
            d="m8.5 12 2.2 2.2 4.8-5"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else-if="props.status === 'failed'"
          viewBox="0 0 24 24"
          fill="none"
          class="size-full"
        >
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            stroke-width="1.75"
          />
          <path
            d="M9.5 9.5 14.5 14.5M14.5 9.5 9.5 14.5"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" class="size-full">
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            stroke-width="1.75"
          />
          <circle cx="12" cy="12" r="1.75" fill="currentColor" />
        </svg>
      </span>

      <span class="truncate">{{ displayLabel }}</span>

      <span
        v-if="contextLabel"
        class="shrink-0 text-[10px] uppercase tracking-[0.2em] opacity-70"
      >
        {{ contextLabel }}
      </span>

      <span
        v-if="truncatedSubject"
        class="min-w-0 truncate font-mono text-[11px] opacity-80"
        :title="props.subject"
      >
        {{ truncatedSubject }}
      </span>
    </span>
  </Badge>
</template>

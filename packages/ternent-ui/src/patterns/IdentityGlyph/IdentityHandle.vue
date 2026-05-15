<script setup lang="ts">
import { computed } from "vue";
import IdentityGlyph from "./IdentityGlyph.vue";
import type { IdentityGlyphAlgorithm, IdentityGlyphInput } from "./identityGlyph.types";
import { resolveIdentityGlyphInput } from "./identityGlyph.utils";

const props = withDefaults(
  defineProps<{
    algorithm?: IdentityGlyphAlgorithm;
    identity: IdentityGlyphInput;
    identityText?: string;
    label?: string;
    size?: "sm" | "md";
  }>(),
  {
    algorithm: "glyph:v1",
    identityText: undefined,
    label: undefined,
    size: "sm",
  },
);

const resolvedIdentity = computed(() => resolveIdentityGlyphInput(props.identity));
const glyphSize = computed(() => (props.size === "md" ? 40 : 32));
const displayLabel = computed(() => props.label ?? "Identity");
const displayIdentity = computed(
  () => props.identityText ?? resolvedIdentity.value.shortIdentity,
);
const labelClass = computed(() =>
  props.size === "md"
    ? "text-sm font-medium text-[var(--ui-fg)]"
    : "text-sm font-medium text-[var(--ui-fg)]",
);
const metaClass = computed(() =>
  props.size === "md"
    ? "text-xs text-[var(--ui-fg-muted)]"
    : "text-xs text-[var(--ui-fg-muted)]",
);
</script>

<template>
  <div class="flex min-w-0 items-center gap-2" data-test="identity-handle">
    <IdentityGlyph
      :identity="props.identity"
      :algorithm="props.algorithm"
      :size="glyphSize"
      :title="`Identity glyph ${displayIdentity}`"
      class="shrink-0"
    />
    <div class="min-w-0">
      <p class="m-0 truncate" :class="labelClass">
        {{ displayLabel }}
      </p>
      <div class="mt-0.5 flex min-w-0 items-center gap-2">
        <p class="m-0 truncate font-mono" :class="metaClass">
          {{ displayIdentity }}
        </p>
        <slot name="status" />
      </div>
    </div>
  </div>
</template>

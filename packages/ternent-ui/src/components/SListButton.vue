<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    active?: boolean;
    count?: number | string | null;
    variant?: "primary" | "secondary" | "neutral";
    size?: "sm" | "md";
    fullWidth?: boolean;
    disabled?: boolean;
  }>(),
  {
    active: false,
    count: null,
    variant: "primary",
    size: "md",
    fullWidth: true,
    disabled: false,
  }
);

const sizeClasses = computed(() => {
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
  };
  return sizes[props.size];
});

const showCount = computed(() => props.count !== null && props.count !== undefined);
</script>

<template>
  <button
    type="button"
    class="s-list-button"
    :class="sizeClasses"
    :data-active="active"
    :data-variant="variant"
    :data-full-width="fullWidth"
    :disabled="disabled"
  >
    <span class="s-list-button__label">
      <slot name="icon" />
      <slot />
    </span>
    <span v-if="showCount" class="s-list-button__count">
      {{ count }}
    </span>
  </button>
</template>

<style scoped>
.s-list-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: var(--ui-radius-sm);
  border: 1px solid transparent;
  color: var(--ui-fg);
  transition: background-color var(--ui-duration-fast) var(--ui-ease-out),
    color var(--ui-duration-fast) var(--ui-ease-out),
    box-shadow var(--ui-duration-fast) var(--ui-ease-out);
}

.s-list-button[data-full-width="true"] {
  width: 100%;
}

.s-list-button__label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.s-list-button:not([data-active="true"]):hover {
  background: var(--ui-surface-hover);
}

.s-list-button[data-active="true"][data-variant="primary"] {
  background: var(--ui-primary);
  color: var(--ui-on-primary);
  box-shadow: var(--ui-shadow-sm);
}

.s-list-button[data-active="true"][data-variant="secondary"] {
  background: var(--ui-secondary);
  color: var(--ui-on-secondary);
  box-shadow: var(--ui-shadow-sm);
}

.s-list-button[data-active="true"][data-variant="neutral"] {
  background: var(--ui-surface-hover);
  color: var(--ui-fg);
  box-shadow: var(--ui-shadow-sm);
}

.s-list-button__count {
  min-width: 1.5rem;
  text-align: center;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--ui-radius-sm);
  background: var(--ui-surface);
  color: var(--ui-fg-muted);
}

.s-list-button[data-active="true"][data-variant="primary"]
  .s-list-button__count {
  background: color-mix(in srgb, var(--ui-on-primary) 15%, transparent);
  color: var(--ui-on-primary);
}

.s-list-button[data-active="true"][data-variant="secondary"]
  .s-list-button__count {
  background: color-mix(in srgb, var(--ui-on-secondary) 15%, transparent);
  color: var(--ui-on-secondary);
}

.s-list-button[data-active="true"][data-variant="neutral"]
  .s-list-button__count {
  background: color-mix(in srgb, var(--ui-fg) 12%, transparent);
  color: var(--ui-fg);
}

.s-list-button:focus-visible {
  outline: 2px solid var(--ui-ring);
  outline-offset: 2px;
}

.s-list-button:disabled {
  opacity: 0.4;
  pointer-events: none;
}
</style>

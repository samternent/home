<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    placeholder?: string;
    readonly?: boolean;
    disabled?: boolean;
    rows?: number;
    minHeight?: string;
    monospace?: boolean;
  }>(),
  {
    placeholder: "",
    readonly: false,
    disabled: false,
    rows: 6,
    minHeight: "12rem",
    monospace: false,
  }
);

const model = defineModel<string>({
  default: "",
});
</script>

<template>
  <textarea
    v-model="model"
    :placeholder="placeholder"
    :readonly="readonly"
    :disabled="disabled"
    :rows="rows"
    class="s-textarea"
    :class="{ 's-textarea--mono': monospace }"
    :style="{ minHeight }"
  />
</template>

<style scoped>
.s-textarea {
  width: 100%;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
  background: var(--ui-surface);
  color: var(--ui-fg);
  padding: 0.75rem 1rem;
  font-size: 0.93rem;
  line-height: 1.45;
  resize: vertical;
  transition: border-color var(--ui-duration-fast, 120ms) var(--ui-ease-out, ease-out),
    box-shadow var(--ui-duration-fast, 120ms) var(--ui-ease-out, ease-out),
    background-color var(--ui-duration-fast, 120ms) var(--ui-ease-out, ease-out);
}

.s-textarea::placeholder {
  color: color-mix(in srgb, var(--ui-fg-muted) 72%, transparent);
}

.s-textarea:hover {
  border-color: color-mix(in srgb, var(--ui-border) 80%, var(--ui-primary));
}

.s-textarea:focus-visible {
  outline: none;
  border-color: var(--ui-ring);
  box-shadow: 0 0 0 2px var(--ui-primary-muted);
}

.s-textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.s-textarea--mono {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.78rem;
  line-height: 1.55;
}
</style>

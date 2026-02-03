<script setup lang="ts">
import { computed } from "vue";

type SegmentItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

const props = withDefaults(
  defineProps<{
    modelValue: string;
    items: SegmentItem[];
    size?: "xs" | "sm" | "md";
    ariaLabel?: string;
  }>(),
  {
    size: "sm",
    ariaLabel: undefined,
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "change", value: string): void;
}>();

const sizeClasses = computed(() => {
  const sizes = {
    xs: "text-[11px] px-2 py-1",
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
  };
  return sizes[props.size];
});

function onSelect(value: string) {
  if (value === props.modelValue) return;
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<template>
  <div class="s-segmented" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="s-segmented__item"
      :class="sizeClasses"
      :data-active="item.value === modelValue"
      :disabled="item.disabled"
      role="radio"
      :aria-checked="item.value === modelValue"
      @click="onSelect(item.value)"
    >
      <span class="relative z-10">{{ item.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.s-segmented {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: color-mix(in srgb, var(--ui-surface) 88%, var(--ui-bg));
}

.s-segmented__item {
  border-radius: 999px;
  color: var(--ui-fg);
  opacity: 0.7;
  transition: color var(--ui-duration-fast) var(--ui-ease-out),
    background-color var(--ui-duration-fast) var(--ui-ease-out),
    box-shadow var(--ui-duration-fast) var(--ui-ease-out);
}

.s-segmented__item:hover {
  opacity: 1;
  background: var(--ui-surface-hover);
}

.s-segmented__item[data-active="true"] {
  background: var(--ui-primary);
  color: var(--ui-on-primary);
  opacity: 1;
  box-shadow: var(--ui-shadow-sm);
}

.s-segmented__item:focus-visible {
  outline: 2px solid var(--ui-ring);
  outline-offset: 2px;
}

.s-segmented__item:disabled {
  opacity: 0.4;
  pointer-events: none;
}
</style>

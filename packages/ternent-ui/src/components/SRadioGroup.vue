<script setup lang="ts">
import { RadioGroup } from "@ark-ui/vue/radio-group";

type Option = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

const props = withDefaults(
  defineProps<{
    options: Option[];
    ariaLabel?: string;
    orientation?: "horizontal" | "vertical";
    size?: "sm" | "md";
  }>(),
  {
    ariaLabel: undefined,
    orientation: "horizontal",
    size: "sm",
  }
);

const model = defineModel<string>({
  default: "",
});
</script>

<template>
  <RadioGroup.Root v-model="model" :orientation="orientation" class="s-radio-group" :aria-label="ariaLabel">
    <div class="s-radio-group__items" :data-orientation="orientation">
      <RadioGroup.Item
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        class="s-radio-group__item"
        :class="size === 'md' ? 's-radio-group__item--md' : 's-radio-group__item--sm'"
      >
        <RadioGroup.ItemHiddenInput />
        <RadioGroup.ItemText class="s-radio-group__text">
          {{ option.label }}
        </RadioGroup.ItemText>
        <span v-if="option.description" class="s-radio-group__description">
          {{ option.description }}
        </span>
      </RadioGroup.Item>
    </div>
  </RadioGroup.Root>
</template>

<style scoped>
.s-radio-group {
  width: 100%;
}

.s-radio-group__items {
  display: inline-flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.s-radio-group__items[data-orientation="vertical"] {
  display: flex;
  flex-direction: column;
}

.s-radio-group__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--ui-fg-muted);
  background: transparent;
  transition: color var(--ui-duration-fast, 120ms) var(--ui-ease-out, ease-out),
    background-color var(--ui-duration-fast, 120ms) var(--ui-ease-out, ease-out),
    border-color var(--ui-duration-fast, 120ms) var(--ui-ease-out, ease-out);
  cursor: pointer;
}

.s-radio-group__item--sm {
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
}

.s-radio-group__item--md {
  padding: 0.55rem 1rem;
  font-size: 0.93rem;
}

.s-radio-group__item:hover {
  color: var(--ui-fg);
  background: var(--ui-surface-hover);
}

.s-radio-group__item[data-state="checked"] {
  color: var(--ui-fg);
  border-color: var(--ui-border);
  background: var(--ui-primary-muted);
}

.s-radio-group__item:focus-visible {
  outline: 2px solid var(--ui-ring);
  outline-offset: 2px;
}

.s-radio-group__item[data-disabled] {
  opacity: 0.45;
  cursor: not-allowed;
}

.s-radio-group__text {
  line-height: 1.2;
}

.s-radio-group__description {
  color: var(--ui-fg-muted);
  font-size: 0.78em;
}
</style>

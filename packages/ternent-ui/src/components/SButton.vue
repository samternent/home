<script setup>
import { computed } from 'vue'

const props = defineProps({
  to: {
    type: String,
    default: undefined,
  },
  type: {
    type: String,
    default: "ghost",
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["xs", "sm", "md", "lg"].includes(value),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  href: {
    type: String,
    default: undefined,
  },
});

defineEmits(["click"]);

const classMap = {
  neutral: "btn-neutral",
  ghost: "btn-ghost",
  success: "btn-success",
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  error: "btn-error",
};

const sizeMap = {
  xs: "btn-xs",
  sm: "btn-sm", 
  md: "",
  lg: "btn-lg",
};

const buttonClasses = computed(() => [
  "btn",
  "mx-1", 
  "focus-ring",
  classMap[props.type],
  sizeMap[props.size],
  {
    "loading": props.loading,
    "btn-disabled": props.disabled,
  }
]);

const component = computed(() => {
  if (props.to) return 'RouterLink'
  if (props.href) return 'a'
  return 'button'
});
</script>
<template>
  <component
    :is="component"
    :to="to"
    :href="href"
    :disabled="disabled || loading"
    role="button"
    v-bind="$attrs"
    :class="buttonClasses"
    :activeClass="to ? 'btn-active' : undefined"
    @click="$emit('click')"
  >
    <span v-if="loading" class="loading loading-spinner loading-xs mr-2"></span>
    <slot name="icon-left" />
    <slot />
    <slot name="icon-right" />
  </component>
</template>

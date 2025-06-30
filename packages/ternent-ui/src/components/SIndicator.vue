<script setup>
import { useSlots } from 'vue'

defineProps({
  type: {
    type: String,
    default: "primary",
    validator: (value) => ["primary", "secondary", "accent", "info", "success", "warning", "error", "neutral", "ghost"].includes(value),
  },
  size: {
    type: String,
    default: "sm", 
    validator: (value) => ["xs", "sm", "md", "lg"].includes(value),
  },
  variant: {
    type: String,
    default: "solid",
    validator: (value) => ["solid", "outline", "soft"].includes(value),
  },
  pulse: {
    type: Boolean,
    default: false,
  },
});

const sizeClasses = {
  xs: "text-xs px-1.5 py-0.5 min-w-[1rem] h-4",
  sm: "text-xs px-2 py-0.5 min-w-[1.25rem] h-5", 
  md: "text-sm px-2.5 py-1 min-w-[1.5rem] h-6",
  lg: "text-sm px-3 py-1 min-w-[1.75rem] h-7",
};

const slots = useSlots();

const typeClasses = {
  solid: {
    primary: "bg-primary text-primary-content",
    secondary: "bg-secondary text-secondary-content", 
    accent: "bg-accent text-accent-content",
    info: "bg-info text-info-content",
    success: "bg-success text-success-content",
    warning: "bg-warning text-warning-content",
    error: "bg-error text-error-content",
    neutral: "bg-neutral text-neutral-content",
  },
  outline: {
    primary: "border border-primary text-primary bg-primary/10",
    secondary: "border border-secondary text-secondary bg-secondary/10",
    accent: "border border-accent text-accent bg-accent/10", 
    info: "border border-info text-info bg-info/10",
    success: "border border-success text-success bg-success/10",
    warning: "border border-warning text-warning bg-warning/10",
    error: "border border-error text-error bg-error/10",
    neutral: "border border-neutral text-neutral bg-neutral/10",
  },
  soft: {
    primary: "bg-primary/15 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    accent: "bg-accent/15 text-accent",
    info: "bg-info/15 text-info", 
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    error: "bg-error/15 text-error",
    neutral: "bg-neutral/15 text-neutral",
  },
};
</script>
<template>
  <span 
    :class="[
      'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200',
      sizeClasses[size],
      typeClasses[variant][type],
      {
        'animate-pulse': pulse,
        'shadow-sm': variant === 'solid',
        'hover:scale-105': slots.default,
      }
    ]"
  >
    <slot>
      <span class="w-1.5 h-1.5 rounded-full bg-current" />
    </slot>
  </span>
</template>

<script setup>
import { useSlots, computed } from 'vue'
import { designTokens, shadows } from "../design-system/tokens.js";

defineProps({
  type: {
    type: String,
    default: "primary",
    validator: (value) => ["primary", "secondary", "accent", "info", "success", "warning", "error", "neutral", "ghost", "premium"].includes(value),
  },
  size: {
    type: String,
    default: "sm", 
    validator: (value) => ["xs", "sm", "md", "lg", "xl"].includes(value),
  },
  variant: {
    type: String,
    default: "solid",
    validator: (value) => ["solid", "outline", "soft", "glow", "glass"].includes(value),
  },
  pulse: {
    type: Boolean,
    default: false,
  },
  animated: {
    type: Boolean,
    default: false,
  },
});

const sizeClasses = computed(() => ({
  xs: "text-xs px-1.5 py-0.5 min-w-[1rem] h-4",
  sm: "text-xs px-2 py-0.5 min-w-[1.25rem] h-5", 
  md: "text-sm px-2.5 py-1 min-w-[1.5rem] h-6",
  lg: "text-sm px-3 py-1 min-w-[1.75rem] h-7",
  xl: "text-base px-4 py-1.5 min-w-[2rem] h-8",
}));

const slots = useSlots();

const typeClasses = computed(() => ({
  solid: {
    primary: "bg-primary text-primary-content shadow-sm",
    secondary: "bg-secondary text-secondary-content shadow-sm", 
    accent: "bg-accent text-accent-content shadow-sm",
    info: "bg-info text-info-content shadow-sm",
    success: "bg-success text-success-content shadow-sm",
    warning: "bg-warning text-warning-content shadow-sm",
    error: "bg-error text-error-content shadow-sm",
    neutral: "bg-neutral text-neutral-content shadow-sm",
    premium: "bg-gradient-to-r from-primary to-primary/80 text-primary-content shadow-lg",
  },
  outline: {
    primary: "border border-primary text-primary bg-primary/10 hover:bg-primary/20",
    secondary: "border border-secondary text-secondary bg-secondary/10 hover:bg-secondary/20",
    accent: "border border-accent text-accent bg-accent/10 hover:bg-accent/20", 
    info: "border border-info text-info bg-info/10 hover:bg-info/20",
    success: "border border-success text-success bg-success/10 hover:bg-success/20",
    warning: "border border-warning text-warning bg-warning/10 hover:bg-warning/20",
    error: "border border-error text-error bg-error/10 hover:bg-error/20",
    neutral: "border border-neutral text-neutral bg-neutral/10 hover:bg-neutral/20",
    premium: "border border-primary text-primary bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30",
  },
  soft: {
    primary: "bg-primary/15 text-primary hover:bg-primary/25",
    secondary: "bg-secondary/15 text-secondary hover:bg-secondary/25",
    accent: "bg-accent/15 text-accent hover:bg-accent/25",
    info: "bg-info/15 text-info hover:bg-info/25", 
    success: "bg-success/15 text-success hover:bg-success/25",
    warning: "bg-warning/15 text-warning hover:bg-warning/25",
    error: "bg-error/15 text-error hover:bg-error/25",
    neutral: "bg-neutral/15 text-neutral hover:bg-neutral/25",
    premium: "bg-gradient-to-r from-primary/15 to-primary/25 text-primary hover:from-primary/25 hover:to-primary/35",
  },
  glow: {
    primary: "bg-primary text-primary-content shadow-lg shadow-primary/25 hover:shadow-primary/40",
    secondary: "bg-secondary text-secondary-content shadow-lg shadow-secondary/25 hover:shadow-secondary/40",
    accent: "bg-accent text-accent-content shadow-lg shadow-accent/25 hover:shadow-accent/40",
    info: "bg-info text-info-content shadow-lg shadow-info/25 hover:shadow-info/40",
    success: "bg-success text-success-content shadow-lg shadow-success/25 hover:shadow-success/40",
    warning: "bg-warning text-warning-content shadow-lg shadow-warning/25 hover:shadow-warning/40",
    error: "bg-error text-error-content shadow-lg shadow-error/25 hover:shadow-error/40",
    neutral: "bg-neutral text-neutral-content shadow-lg shadow-neutral/25 hover:shadow-neutral/40",
    premium: "bg-gradient-to-r from-primary to-primary/80 text-primary-content shadow-xl shadow-primary/30 hover:shadow-primary/50",
  },
  glass: {
    primary: "bg-primary/20 border border-primary/30 text-primary backdrop-blur-sm",
    secondary: "bg-secondary/20 border border-secondary/30 text-secondary backdrop-blur-sm",
    accent: "bg-accent/20 border border-accent/30 text-accent backdrop-blur-sm",
    info: "bg-info/20 border border-info/30 text-info backdrop-blur-sm",
    success: "bg-success/20 border border-success/30 text-success backdrop-blur-sm",
    warning: "bg-warning/20 border border-warning/30 text-warning backdrop-blur-sm",
    error: "bg-error/20 border border-error/30 text-error backdrop-blur-sm",
    neutral: "bg-neutral/20 border border-neutral/30 text-neutral backdrop-blur-sm",
    premium: "bg-gradient-to-r from-primary/20 to-primary/30 border border-primary/40 text-primary backdrop-blur-sm",
  },
}));
</script>
<template>
  <span 
    class="inline-flex items-center justify-center rounded-full font-medium transition-all duration-300"
    :class="[
      sizeClasses[size],
      typeClasses[variant][type],
      {
        'animate-pulse': pulse,
        'animate-bounce': animated,
        'hover:scale-110 active:scale-95': slots.default,
        'cursor-pointer': slots.default,
        'shadow-md hover:shadow-lg': variant === 'solid' || variant === 'glow',
        'ring-2 ring-current/20': variant === 'glow',
      }
    ]"
  >
    <slot>
      <span 
        class="w-1.5 h-1.5 rounded-full bg-current transition-all duration-200"
        :class="{
          'animate-ping': pulse && !slots.default,
          'shadow-sm': variant === 'glow',
        }"
      />
    </slot>
  </span>
</template>

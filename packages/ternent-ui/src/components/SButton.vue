<script setup>
import { computed } from 'vue';

const props = defineProps({
  // Navigation
  to: {
    type: String,
    default: undefined,
  },
  href: {
    type: String,
    default: undefined,
  },
  external: {
    type: Boolean,
    default: false,
  },

  // Appearance
  variant: {
    type: String,
    default: "primary",
    validator: (value) => [
      "primary", "secondary", "accent", "outline", "ghost", "ghost-icon", "link",
      "success", "warning", "error"
    ].includes(value),
  },
  size: {
    type: String,
    default: "base",
    validator: (value) => ["micro", "xs", "sm", "base", "lg", "xl"].includes(value),
  },

  // States
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },

  // Layout
  fullWidth: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["click"]);

// Premium button classes using DaisyUI + custom enhancements
const buttonClasses = computed(() => {
  const baseClasses = [
    'btn',
    'transition-all duration-200 ease-out',
    'hover:scale-[1.02] active:scale-[0.98]',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'shadow-sm hover:shadow-lg active:shadow-sm',
    'font-medium',
    'border-0', // Remove default borders for cleaner look
  ];

  // Size classes with better proportions
  const sizeClasses = {
    micro: 'btn-xs h-6 min-h-6 px-2 text-xs rounded-md',
    xs: 'btn-xs h-7 min-h-7 px-3 text-xs rounded-lg',
    sm: 'btn-sm h-8 min-h-8 px-4 text-sm rounded-lg',
    base: 'btn-md h-10 min-h-10 px-6 text-sm rounded-xl',
    lg: 'btn-lg h-12 min-h-12 px-8 text-base rounded-xl',
    xl: 'h-14 min-h-14 px-10 text-lg rounded-2xl',
  };

  // Variant classes with enhanced styling
  const variantClasses = {
    primary: 'btn-primary bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 focus:ring-primary/30 text-white border-0',
    secondary: 'btn-secondary bg-base-100 hover:bg-base-200 text-base-content border border-base-300 focus:ring-primary/30',
    accent: 'btn-accent bg-gradient-to-r from-accent to-accent hover:from-accent/90 hover:to-accent/90 focus:ring-accent/30 text-white border-0',
    outline: 'bg-base-100 hover:bg-base-200 text-base-content border border-base-300 hover:border-base-content focus:ring-primary/30',
    ghost: 'bg-transparent hover:bg-base-200 text-base-content hover:text-base-content focus:ring-primary/30 border-0',
    'ghost-icon': 'bg-transparent hover:bg-base-200 text-base-content hover:text-base-content focus:ring-primary/30 border-0 aspect-square',
    link: 'bg-transparent hover:bg-transparent text-primary hover:text-primary/80 focus:ring-primary/30 border-0 underline-offset-4 hover:underline',
    success: 'btn-success bg-gradient-to-r from-success to-success hover:from-success/90 hover:to-success/90 focus:ring-success/30 text-white border-0',
    warning: 'btn-warning bg-gradient-to-r from-warning to-warning hover:from-warning/90 hover:to-warning/90 focus:ring-warning/30 text-white border-0',
    error: 'btn-error bg-gradient-to-r from-error to-error hover:from-error/90 hover:to-error/90 focus:ring-error/30 text-white border-0',
  };

  const classes = [
    ...baseClasses,
    sizeClasses[props.size] || sizeClasses.base,
    variantClasses[props.variant] || variantClasses.primary,
  ];

  if (props.fullWidth) classes.push('w-full');
  if (props.loading) classes.push('loading');

  return classes.join(' ');
});

// Component selection logic
const component = computed(() => {
  if (props.to) return 'RouterLink';
  if (props.href) return 'a';
  return 'button';
});

// Props for the dynamic component
const componentProps = computed(() => {
  const baseProps = {
    class: buttonClasses.value,
    disabled: props.disabled || props.loading,
  };

  if (props.to) {
    return { ...baseProps, to: props.to };
  }
  
  if (props.href) {
    return {
      ...baseProps,
      href: props.href,
      target: props.external ? '_blank' : undefined,
      rel: props.external ? 'noopener noreferrer' : undefined,
    };
  }

  return {
    ...baseProps,
    type: 'button',
  };
});

// Handle click events
const handleClick = (event) => {
  if (props.disabled || props.loading) {
    event.preventDefault();
    return;
  }
  emit('click', event);
};
</script>

<template>
  <component
    :is="component"
    v-bind="componentProps"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

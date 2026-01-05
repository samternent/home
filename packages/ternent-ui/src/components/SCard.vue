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
    default: "default",
    validator: (value) => [
      "default", "bordered", "elevated", "glass", "outline", "flat"
    ].includes(value),
  },
  size: {
    type: String,
    default: "base",
    validator: (value) => ["xs", "sm", "base", "lg", "xl"].includes(value),
  },

  // States
  interactive: {
    type: Boolean,
    default: false,
  },
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
});

const emit = defineEmits(["click"]);

// Premium card classes using our design system
const cardClasses = computed(() => {
  const baseClasses = [
    'relative overflow-hidden transition-all duration-200 ease-out ui-surface text-base-content/90',
    'focus-within:outline-none',
  ];

  // Size classes
  const sizeClasses = {
    xs: 'p-3 rounded-xl',
    sm: 'p-4 rounded-xl',
    base: 'p-6 rounded-2xl',
    lg: 'p-8 rounded-2xl',
    xl: 'p-10 rounded-3xl',
  };

  // Variant classes
  const variantClasses = {
    default: [
      'border-base-300/50',
      'shadow-sm',
    ],
    bordered: [
      'border-2 border-base-300/80',
      'shadow-sm',
    ],
    elevated: [
      'border-base-300/40',
      'shadow-md',
      'hover:-translate-y-0.5 hover:shadow-lg/70',
    ],
    glass: [
      'bg-base-100/70',
      'backdrop-blur-xl border border-base-200/30',
      'shadow-md',
      'hover:bg-base-100/85',
    ],
    outline: [
      'bg-transparent',
      'border-2 border-dashed border-base-300/70',
      'hover:border-base-content/30',
      'hover:bg-base-200/60',
    ],
    flat: [
      'bg-base-200/80',
      'border border-base-300/40 shadow-none',
      'hover:bg-base-200',
    ],
  };

  const classes = [
    ...baseClasses,
    sizeClasses[props.size] || sizeClasses.base,
    ...(variantClasses[props.variant] || variantClasses.default),
  ];

  if (props.interactive) {
    classes.push(
      'cursor-pointer',
      'hover:-translate-y-0.5 active:translate-y-0',
      'focus-within:ring-2 focus-within:ring-primary/15 focus-within:ring-offset-2'
    );
  }

  if (props.fullWidth) classes.push('w-full');
  if (props.loading) classes.push('animate-pulse pointer-events-none');
  if (props.disabled) classes.push('opacity-50 pointer-events-none grayscale');

  return classes.join(' ');
});

// Component selection logic
const component = computed(() => {
  if (props.to) return 'RouterLink';
  if (props.href) return 'a';
  return 'div';
});

// Props for the dynamic component
const componentProps = computed(() => {
  const baseProps = {
    class: cardClasses.value,
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

  return baseProps;
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
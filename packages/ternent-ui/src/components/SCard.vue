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
    'relative overflow-hidden transition-all duration-200 ease-out',
    'focus-within:outline-none',
  ];

  // Size classes
  const sizeClasses = {
    xs: 'p-3 rounded-lg',
    sm: 'p-4 rounded-lg',
    base: 'p-6 rounded-xl',
    lg: 'p-8 rounded-xl',
    xl: 'p-10 rounded-2xl',
  };

  // Variant classes
  const variantClasses = {
    default: [
      'bg-base-100',
      'border border-base-300',
      'shadow-sm hover:shadow-md',
    ],
    bordered: [
      'bg-base-100', 
      'border-2 border-base-300',
      'hover:border-base-content/20',
    ],
    elevated: [
      'bg-base-100',
      'border border-base-200',
      'shadow-lg hover:shadow-xl',
      'hover:-translate-y-0.5',
    ],
    glass: [
      'bg-base-100/70',
      'backdrop-blur-xl border border-base-200/20',
      'shadow-lg hover:shadow-xl',
      'hover:bg-base-100/80',
    ],
    outline: [
      'bg-transparent',
      'border-2 border-dashed border-base-300',
      'hover:border-base-content/30',
      'hover:bg-base-200',
    ],
    flat: [
      'bg-base-200',
      'border-0',
      'hover:bg-base-300',
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
      'hover:scale-[1.01] active:scale-[0.99]',
      'focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:ring-offset-2'
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
<script setup>
import { computed } from 'vue'

const props = defineProps({
  to: {
    type: String,
    default: undefined,
  },
  variant: {
    type: String,
    default: "primary",
    validator: (value) => ["primary", "secondary", "outline", "ghost", "danger", "success", "ghost-icon"].includes(value),
  },
  size: {
    type: String,
    default: "micro", 
    validator: (value) => ["nano", "micro", "tiny", "small", "medium"].includes(value),
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
  fullWidth: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["click"]);

const baseClasses = "btn-micro";

const variantClasses = computed(() => ({
  primary: "btn-primary-micro",
  secondary: "btn-secondary-micro", 
  outline: "btn-outline-micro",
  ghost: "btn-ghost-micro",
  danger: "btn-danger-micro",
  success: "btn-success-micro",
  "ghost-icon": "btn-ghost-icon-micro",
}));

const sizeClasses = computed(() => ({
  nano: "btn-nano",
  micro: "btn-micro-size",
  tiny: "btn-tiny", 
  small: "btn-small",
  medium: "btn-medium",
}));

const buttonClasses = computed(() => [
  baseClasses,
  variantClasses.value[props.variant],
  sizeClasses.value[props.size],
  {
    "w-full": props.fullWidth,
    "btn-icon": props.icon,
    "btn-loading": props.loading,
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
    v-bind="$attrs"
    :class="buttonClasses"
    @click="$emit('click')"
  >
    <!-- Loading spinner -->
    <svg
      v-if="loading"
      class="btn-spinner"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    
    <!-- Left slot -->
    <slot name="left" />
    
    <!-- Default content -->
    <slot />
    
    <!-- Right slot -->
    <slot name="right" />
  </component>
</template>

<style scoped>
.btn-micro {
  /* Base button styling using CSS custom properties */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.75rem;
  line-height: 1;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  border: none;
  outline: none;
  cursor: pointer;
  transition: all 0.12s ease;
  box-shadow: var(--shadow-micro);
  letter-spacing: -0.005em;
  text-decoration: none;
  gap: 0.375rem;
  position: relative;
  overflow: hidden;
}

.btn-micro:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: var(--shadow-soft);
}

.btn-micro:active {
  transform: translateY(0) scale(0.99);
}

.btn-micro:focus {
  box-shadow: var(--shadow-soft), 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Variant styles */
.btn-primary-micro {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
}

.btn-primary-micro:hover {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
}

.btn-secondary-micro {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-secondary-micro:hover {
  background: var(--bg-secondary);
  border-color: var(--text-tertiary);
}

.btn-outline-micro {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-outline-micro:hover {
  background: var(--bg-secondary);
  border-color: var(--text-tertiary);
}

.btn-ghost-micro {
  background: transparent;
  color: var(--text-tertiary);
  box-shadow: none;
}

.btn-ghost-micro:hover {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  box-shadow: none;
}

.btn-danger-micro {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-danger-micro:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.btn-success-micro {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-success-micro:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

/* Ghost icon - completely invisible background */
.btn-ghost-icon-micro {
  background: transparent;
  color: var(--text-tertiary);
  box-shadow: none;
  border: none;
}

.btn-ghost-icon-micro:hover {
  background: transparent;
  color: var(--text-secondary);
  box-shadow: none;
  transform: scale(1.1);
}

.btn-ghost-icon-micro:active {
  transform: scale(0.95);
}

/* Size variants */
.btn-nano {
  font-size: 0.6875rem;
  padding: 0.25rem 0.5rem;
  gap: 0.25rem;
}

.btn-micro-size {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  gap: 0.375rem;
}

.btn-tiny {
  font-size: 0.8125rem;
  padding: 0.5rem 1rem;
  gap: 0.5rem;
}

.btn-small {
  font-size: 0.875rem;
  padding: 0.625rem 1.25rem;
  gap: 0.5rem;
}

.btn-medium {
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  gap: 0.625rem;
}

/* Icon button */
.btn-icon {
  padding: 0.375rem;
  aspect-ratio: 1;
}

.btn-icon.btn-nano {
  padding: 0.25rem;
}

.btn-icon.btn-tiny {
  padding: 0.5rem;
}

.btn-icon.btn-small {
  padding: 0.625rem;
}

.btn-icon.btn-medium {
  padding: 0.75rem;
}

/* States */
.btn-loading {
  pointer-events: none;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-disabled:hover {
  transform: none;
  box-shadow: var(--shadow-micro);
}

/* Spinner */
.btn-spinner {
  width: 0.75rem;
  height: 0.75rem;
  animation: spin 1s linear infinite;
}

.btn-nano .btn-spinner {
  width: 0.625rem;
  height: 0.625rem;
}

.btn-tiny .btn-spinner {
  width: 0.875rem;
  height: 0.875rem;
}

.btn-small .btn-spinner {
  width: 1rem;
  height: 1rem;
}

.btn-medium .btn-spinner {
  width: 1.125rem;
  height: 1.125rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Full width */
.w-full {
  width: 100%;
}
</style>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "bordered", "elevated", "glass"].includes(value),
  },
  size: {
    type: String,
    default: "micro",
    validator: (value) => ["nano", "micro", "small", "medium", "large"].includes(value),
  },
  interactive: {
    type: Boolean,
    default: false,
  },
  href: {
    type: String,
    default: undefined,
  },
  to: {
    type: String,
    default: undefined,
  },
});

defineEmits(["click"]);

const slots = useSlots();

const baseClasses = "card-micro";

const variantClasses = computed(() => ({
  default: "",
  bordered: "card-bordered",
  elevated: "card-elevated",
  glass: "card-glass",
}));

const sizeClasses = computed(() => ({
  nano: "card-nano",
  micro: "card-micro-size",
  small: "card-small",
  medium: "card-medium",
  large: "card-large",
}));

const cardClasses = computed(() => [
  baseClasses,
  variantClasses.value[props.variant],
  sizeClasses.value[props.size],
  {
    "card-interactive": props.interactive,
  }
]);

const component = computed(() => {
  if (props.to) return 'RouterLink'
  if (props.href) return 'a'
  return 'div'
});
</script>

<template>
  <component
    :is="component"
    :to="to"
    :href="href"
    v-bind="$attrs"
    :class="cardClasses"
    @click="$emit('click')"
  >
    <!-- Header slot -->
    <header v-if="slots.header" class="card-header">
      <slot name="header" />
    </header>
    
    <!-- Default content -->
    <div v-if="slots.default" class="card-content">
      <slot />
    </div>
    
    <!-- Footer slot -->
    <footer v-if="slots.footer" class="card-footer">
      <slot name="footer" />
    </footer>
  </component>
</template>

<style scoped>
.card-micro {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-micro);
  transition: all 0.15s ease;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
}

.dark .card-micro {
  border-color: rgb(51 65 85 / 0.6);
  background: rgb(15 23 42);
}

.card-micro:hover {
  box-shadow: var(--shadow-soft);
  border-color: var(--text-tertiary);
}

.dark .card-micro:hover {
  border-color: rgb(100 116 139 / 0.6);
}

/* Variants */
.card-bordered {
  border-width: 2px;
}

.card-elevated {
  box-shadow: var(--shadow-medium);
}

.card-elevated:hover {
  box-shadow: var(--shadow-medium), 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .card-glass {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Sizes */
.card-nano .card-content {
  padding: 0.5rem;
}

.card-nano .card-header,
.card-nano .card-footer {
  padding: 0.5rem;
}

.card-micro-size .card-content {
  padding: 0.75rem;
}

.card-micro-size .card-header,
.card-micro-size .card-footer {
  padding: 0.75rem;
}

.card-small .card-content {
  padding: 1rem;
}

.card-small .card-header,
.card-small .card-footer {
  padding: 1rem;
}

.card-medium .card-content {
  padding: 1.25rem;
}

.card-medium .card-header,
.card-medium .card-footer {
  padding: 1.25rem;
}

.card-large .card-content {
  padding: 1.5rem;
}

.card-large .card-header,
.card-large .card-footer {
  padding: 1.5rem;
}

/* Interactive */
.card-interactive {
  cursor: pointer;
}

.card-interactive:hover {
  transform: translateY(-1px);
}

.card-interactive:active {
  transform: translateY(0) scale(0.99);
}

/* Card sections */
.card-header {
  border-bottom: 1px solid var(--border-light);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.card-content {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.card-footer {
  border-top: 1px solid var(--border-light);
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

.dark .card-footer {
  border-top-color: rgb(51 65 85 / 0.6);
}

/* Special spacing for adjacent sections */
.card-header + .card-content {
  padding-top: 0.75rem;
}

.card-content + .card-footer {
  padding-top: 0.75rem;
}

.card-nano .card-header + .card-content,
.card-nano .card-content + .card-footer {
  padding-top: 0.5rem;
}

.card-small .card-header + .card-content,
.card-small .card-content + .card-footer {
  padding-top: 1rem;
}

.card-medium .card-header + .card-content,
.card-medium .card-content + .card-footer {
  padding-top: 1.25rem;
}

.card-large .card-header + .card-content,
.card-large .card-content + .card-footer {
  padding-top: 1.5rem;
}
</style>
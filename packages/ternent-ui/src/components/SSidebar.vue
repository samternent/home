<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "glass", "minimal", "bordered"].includes(value),
  },
  width: {
    type: String,
    default: "lg",
    validator: (value) => ["sm", "base", "lg", "xl"].includes(value),
  },
  position: {
    type: String,
    default: "left",
    validator: (value) => ["left", "right"].includes(value),
  },
  overlay: {
    type: Boolean,
    default: true,
  },
  closeOnOverlayClick: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "close"]);

// Overlay classes
const overlayClasses = computed(() => [
  'fixed inset-0 z-40 transition-opacity duration-300 ease-out',
  props.modelValue ? 'opacity-100' : 'opacity-0 pointer-events-none',
  'bg-black/50 backdrop-blur-sm',
].join(' '));

// Sidebar classes
const sidebarClasses = computed(() => {
  const baseClasses = [
    'fixed top-0 z-50 h-full transition-transform duration-300 ease-out',
    'flex flex-col',
  ];

  // Width classes
  const widthClasses = {
    sm: 'w-64',
    base: 'w-72',
    lg: 'w-80',
    xl: 'w-96',
  };

  // Position and transform classes
  const positionClasses = {
    left: [
      'left-0',
      props.modelValue ? 'translate-x-0' : '-translate-x-full',
    ],
    right: [
      'right-0',
      props.modelValue ? 'translate-x-0' : 'translate-x-full',
    ],
  };

  // Variant classes
  const variantClasses = {
    default: [
      'bg-base-100',
      'border-r border-base-300',
      'shadow-lg',
    ],
    glass: [
      'bg-base-100/90',
      'backdrop-blur-xl border-r border-base-100/20',
      'shadow-xl',
    ],
    minimal: [
      'bg-base-100/95',
      'backdrop-blur-sm',
    ],
    bordered: [
      'bg-base-100',
      'border-r-2 border-base-300',
      'shadow-lg',
    ],
  };

  const classes = [
    ...baseClasses,
    widthClasses[props.width] || widthClasses.lg,
    ...(positionClasses[props.position] || positionClasses.left),
    ...(variantClasses[props.variant] || variantClasses.default),
  ];

  return classes.join(' ');
});

// Handle overlay click
const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    emit('update:modelValue', false);
    emit('close');
  }
};

// Handle close
const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};

// Handle escape key
const handleEscape = (event) => {
  if (event.key === 'Escape' && props.modelValue) {
    handleClose();
  }
};

// Add/remove escape listener
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <!-- Overlay -->
  <div 
    v-if="overlay"
    :class="overlayClasses"
    @click="handleOverlayClick"
  />

  <!-- Sidebar -->
  <aside :class="sidebarClasses">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-base-300">
      <div class="flex-1">
        <slot name="header">
          <h2 class="text-lg font-semibold text-base-content">
            Menu
          </h2>
        </slot>
      </div>
      
      <button
        @click="handleClose"
        class="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="p-6 border-t border-base-300">
      <slot name="footer" />
    </div>
  </aside>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: "info",
    validator: (value) => ["info", "success", "warning", "error"].includes(value),
  },
  title: {
    type: String,
    default: undefined,
  },
  dismissible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['dismiss']);

const variantClasses = {
  info: "bg-info/10 border-info/20 text-info-content",
  success: "bg-success/10 border-success/20 text-success-content", 
  warning: "bg-warning/10 border-warning/20 text-warning-content",
  error: "bg-error/10 border-error/20 text-error-content",
};

const iconClasses = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning", 
  error: "text-error",
};

const icons = {
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
  error: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
};
</script>

<template>
  <div 
    role="alert" 
    :class="[
      'rounded-xl border p-4 transition-all duration-200',
      variantClasses[variant]
    ]"
  >
    <div class="flex items-start gap-3">
      <!-- Icon -->
      <div :class="['flex-shrink-0 mt-0.5', iconClasses[variant]]">
        <slot name="icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              :d="icons[variant]"
            />
          </svg>
        </slot>
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Title -->
        <h4 v-if="title" class="font-medium text-sm mb-1">
          {{ title }}
        </h4>
        
        <!-- Message -->
        <div class="text-sm">
          <slot />
        </div>
      </div>
      
      <!-- Dismiss button -->
      <button 
        v-if="dismissible"
        @click="emit('dismiss')"
        class="flex-shrink-0 p-1 hover:bg-black/10 rounded-lg transition-colors duration-200"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { designTokens, shadows } from "../design-system/tokens.js";

const props = defineProps({
  variant: {
    type: String,
    default: "info",
    validator: (value) => ["info", "success", "warning", "error", "premium"].includes(value),
  },
  title: {
    type: String,
    default: undefined,
  },
  dismissible: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
});

const emit = defineEmits(['dismiss']);

const variantClasses = computed(() => ({
  info: `bg-gradient-to-r from-info/5 to-info/10 
         border border-info/20 text-info-content 
         shadow-sm hover:shadow-md transition-all duration-300`,
  success: `bg-gradient-to-r from-success/5 to-success/10 
           border border-success/20 text-success-content 
           shadow-sm hover:shadow-md transition-all duration-300`, 
  warning: `bg-gradient-to-r from-warning/5 to-warning/10 
           border border-warning/20 text-warning-content 
           shadow-sm hover:shadow-md transition-all duration-300`,
  error: `bg-gradient-to-r from-error/5 to-error/10 
         border border-error/20 text-error-content 
         shadow-sm hover:shadow-md transition-all duration-300`,
  premium: `bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 
           border border-primary/20 text-primary-content 
           shadow-lg hover:shadow-xl transition-all duration-300
           ring-1 ring-primary/10`,
}));

const iconClasses = computed(() => ({
  info: "text-info drop-shadow-sm",
  success: "text-success drop-shadow-sm",
  warning: "text-warning drop-shadow-sm", 
  error: "text-error drop-shadow-sm",
  premium: "text-primary drop-shadow-sm",
}));

const sizeClasses = computed(() => ({
  sm: "p-3 text-sm",
  md: "p-4 text-base",
  lg: "p-6 text-lg",
}));

const icons = {
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
  error: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  premium: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
};
</script>

<template>
  <div 
    role="alert" 
    class="rounded-xl transition-all duration-300 backdrop-blur-sm"
    :class="[
      variantClasses[variant],
      sizeClasses[size]
    ]"
  >
    <div class="flex items-start gap-4">
      <!-- Icon -->
      <div class="flex-shrink-0 mt-1">
        <slot name="icon">
          <div class="relative">
            <svg 
              class="w-5 h-5 transition-transform duration-200 hover:scale-110" 
              :class="iconClasses[variant]"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                :d="icons[variant]"
              />
            </svg>
            <!-- Subtle glow effect for premium variant -->
            <div 
              v-if="variant === 'premium'" 
              class="absolute inset-0 w-5 h-5 bg-primary/20 rounded-full blur-sm -z-10"
            ></div>
          </div>
        </slot>
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Title -->
        <h4 v-if="title" class="font-semibold text-sm mb-2 tracking-wide">
          {{ title }}
        </h4>
        
        <!-- Message -->
        <div class="text-sm leading-relaxed">
          <slot />
        </div>
      </div>
      
      <!-- Dismiss button -->
      <button 
        v-if="dismissible"
        @click="emit('dismiss')"
        class="flex-shrink-0 p-2 hover:bg-black/10 
               rounded-lg transition-all duration-200 
               focus:outline-none focus:ring-2 focus:ring-current/20
               hover:scale-105 active:scale-95"
        aria-label="Dismiss alert"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>

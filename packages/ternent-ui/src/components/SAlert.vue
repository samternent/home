<script setup>
import { computed } from "vue";

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

const variantStyles = computed(() => ({
  info: {
    container: "border-info/25 text-info/90 bg-info/5",
    accent: "from-info/60 to-info/15",
    icon: "text-info",
  },
  success: {
    container: "border-success/25 text-success/90 bg-success/5",
    accent: "from-success/60 to-success/20",
    icon: "text-success",
  },
  warning: {
    container: "border-warning/30 text-warning/90 bg-warning/5",
    accent: "from-warning/60 to-warning/20",
    icon: "text-warning",
  },
  error: {
    container: "border-error/25 text-error/90 bg-error/5",
    accent: "from-error/60 to-error/20",
    icon: "text-error",
  },
  premium: {
    container: "border-primary/25 text-primary-content/80 bg-primary/5",
    accent: "from-primary/60 via-primary/35 to-primary/15",
    icon: "text-primary",
  },
}));

const sizeClasses = computed(() => ({
  sm: "px-4 py-3 text-sm",
  md: "px-5 py-4 text-base",
  lg: "px-6 py-5 text-lg",
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
    class="relative overflow-hidden rounded-2xl transition-all duration-300 ui-surface"
    :class="[
      sizeClasses[size],
      variantStyles[variant].container,
      'hover:-translate-y-0.5 hover:shadow-lg'
    ]"
    :data-tone="variant === 'premium' ? 'prominent' : 'muted'"
  >
    <span
      class="absolute inset-y-3 left-3 w-1 rounded-full bg-gradient-to-b opacity-80"
      :class="variantStyles[variant].accent"
      aria-hidden="true"
    ></span>
    <div class="flex items-start gap-4">
      <!-- Icon -->
      <div class="flex-shrink-0 mt-1 h-10 w-10 rounded-2xl border border-base-300/50 bg-base-200/60 backdrop-blur-sm grid place-items-center shadow-sm">
        <slot name="icon">
          <div class="relative">
            <svg
              class="w-5 h-5 transition-transform duration-200 hover:scale-110"
              :class="variantStyles[variant].icon"
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
        <h4 v-if="title" class="font-semibold text-sm mb-2 tracking-tight">
          {{ title }}
        </h4>

        <!-- Message -->
        <div class="text-sm leading-relaxed text-base-content/80">
          <slot />
        </div>
      </div>

      <!-- Dismiss button -->
      <button
        v-if="dismissible"
        @click="emit('dismiss')"
        class="flex-shrink-0 p-2 rounded-xl transition-all duration-200 text-base-content/70 hover:text-base-content
               hover:bg-base-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
        aria-label="Dismiss alert"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>

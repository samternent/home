<script setup>
import { computed } from "vue";

const props = defineProps({
  size: {
    type: String,
    default: "md",
    validator: (value) => ["xs", "sm", "md", "lg", "xl"].includes(value),
  },
  color: {
    type: String,
    default: "primary",
    validator: (value) => ["primary", "secondary", "slate", "white"].includes(value),
  },
});

const sizeClasses = computed(() => ({
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6", 
  lg: "w-8 h-8",
  xl: "w-10 h-10",
}));

const colorClasses = computed(() => ({
  primary: "text-indigo-600",
  secondary: "text-slate-600",
  slate: "text-slate-400",
  white: "text-white",
}));
</script>
<template>
  <div class="inline-flex items-center justify-center">
    <svg 
      :class="[sizeClasses[size], colorClasses[color]]"
      class="animate-spin"
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        class="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        stroke-width="4"
      />
      <path 
        class="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
</template>

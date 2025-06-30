<script setup>
import { computed } from "vue";

const props = defineProps({
  message: {
    type: String,
    default: "Enter your message.",
  },
  buttonText: {
    type: String,
    default: "Button Text",
  },
  type: {
    type: String,
    default: "info",
    validator: (value) => ["info", "success", "warning", "error"].includes(value),
  },
  dismissible: {
    type: Boolean,
    default: true,
  },
});

defineEmits(["click", "dismiss"]);

const typeClasses = computed(() => ({
  info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
  success: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
  warning: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100",
  error: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
}));

const iconPaths = computed(() => ({
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L5.268 16.5c-.77.833.192 2.5 1.732 2.5z",
  error: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
}));

const buttonColorClasses = computed(() => ({
  info: "border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50",
  success: "border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50",
  warning: "border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/50",
  error: "border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50",
}));
</script>
<template>
  <div 
    class="flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm transition-all duration-300"
    :class="typeClasses[type]"
  >
    <div class="flex items-center gap-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 flex-shrink-0"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          :d="iconPaths[type]"
        />
      </svg>
      <span class="text-sm font-medium">{{ message }}</span>
    </div>
    
    <div class="flex items-center gap-2">
      <button 
        class="px-3 py-1.5 text-sm font-medium border rounded-xl transition-all duration-200 hover:scale-105" 
        :class="buttonColorClasses[type]"
        @click="$emit('click')"
      >
        {{ buttonText }}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4 ml-1.5 inline"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </button>
      
      <button 
        v-if="dismissible"
        @click="$emit('dismiss')"
        class="p-1.5 rounded-xl hover:bg-current/10 transition-colors duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
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

const typeClasses = {
  info: "bg-gradient-to-r from-info/10 to-info/5 border-info/20 text-info-content",
  success: "bg-gradient-to-r from-success/10 to-success/5 border-success/20 text-success-content",
  warning: "bg-gradient-to-r from-warning/10 to-warning/5 border-warning/20 text-warning-content",
  error: "bg-gradient-to-r from-error/10 to-error/5 border-error/20 text-error-content",
};

const iconPaths = {
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L5.268 16.5c-.77.833.192 2.5 1.732 2.5z",
  error: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};
</script>
<template>
  <div 
    class="flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 fade-in"
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
        class="btn btn-sm btn-outline hover:scale-105 transition-all duration-200" 
        @click="$emit('click')"
      >
        {{ buttonText }}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
      
      <button 
        v-if="dismissible"
        @click="$emit('dismiss')"
        class="p-1 rounded-lg hover:bg-current/10 transition-colors duration-200"
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

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    default: null,
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["xs", "sm", "md", "lg", "xl"].includes(value),
  },
  variant: {
    type: String,
    default: "circular",
    validator: (value) => ["circular", "rounded", "square"].includes(value),
  },
  status: {
    type: String,
    default: null,
    validator: (value) => !value || ["online", "offline", "away", "busy"].includes(value),
  },
});

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
};

const variantClasses = {
  circular: "rounded-full",
  rounded: "rounded-lg",
  square: "rounded-none",
};

const statusClasses = {
  online: "bg-success",
  offline: "bg-base-300",
  away: "bg-warning", 
  busy: "bg-error",
};

const statusSizes = {
  xs: "w-2 h-2",
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-3.5 h-3.5",
  xl: "w-4 h-4",
};
</script>
<template>
  <div class="relative inline-flex items-center justify-center">
    <div 
      :class="[
        sizeClasses[size],
        variantClasses[variant],
        'bg-gradient-to-br from-primary to-secondary text-primary-content font-semibold flex items-center justify-center shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105'
      ]"
    >
      <img 
        v-if="url" 
        :src="url" 
        :alt="name"
        :class="[variantClasses[variant], 'w-full h-full object-cover']"
      />
      <span v-else class="select-none">{{ name[0]?.toUpperCase() }}</span>
    </div>
    
    <!-- Status indicator -->
    <div 
      v-if="status"
      :class="[
        statusSizes[size],
        statusClasses[status],
        'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-base-100'
      ]"
    />
  </div>
</template>

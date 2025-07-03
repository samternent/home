<script setup>
import { computed } from "vue";

const props = defineProps({
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

const sizeClasses = computed(() => ({
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
}));

const variantClasses = computed(() => ({
  circular: "rounded-full",
  rounded: "rounded-xl",
  square: "rounded-none",
}));

const statusClasses = computed(() => ({
  online: "bg-green-500",
  offline: "bg-slate-400",
  away: "bg-yellow-500", 
  busy: "bg-red-500",
}));

const statusSizes = computed(() => ({
  xs: "w-2 h-2",
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-3.5 h-3.5",
  xl: "w-4 h-4",
}));

// Generate a consistent color based on the name
const avatarColor = computed(() => {
  const colors = [
    'bg-gradient-to-br from-indigo-500 to-purple-600',
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    'bg-gradient-to-br from-green-500 to-emerald-600',
    'bg-gradient-to-br from-yellow-500 to-orange-600',
    'bg-gradient-to-br from-red-500 to-pink-600',
    'bg-gradient-to-br from-purple-500 to-violet-600',
    'bg-gradient-to-br from-cyan-500 to-blue-600',
    'bg-gradient-to-br from-emerald-500 to-green-600',
  ];
  
  const charCode = props.name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
});
</script>
<template>
  <div class="relative inline-flex items-center justify-center">
    <div 
      :class="[
        sizeClasses[size],
        variantClasses[variant],
        url ? 'bg-slate-200 dark:bg-slate-700' : avatarColor,
        'text-white font-semibold flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-900 transition-all duration-200 hover:scale-105'
      ]"
    >
      <img 
        v-if="url" 
        :src="url" 
        :alt="name"
        :class="[variantClasses[variant], 'w-full h-full object-cover']"
      />
      <span v-else class="select-none font-medium">{{ name[0]?.toUpperCase() }}</span>
    </div>
    
    <!-- Status indicator -->
    <div 
      v-if="status"
      :class="[
        statusSizes[size],
        statusClasses[status],
        'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-slate-900'
      ]"
    />
  </div>
</template>

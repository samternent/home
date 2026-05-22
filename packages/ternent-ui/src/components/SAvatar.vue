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
  online: "bg-[var(--ui-success)]",
  offline: "bg-[var(--ui-fg-muted)]",
  away: "bg-[var(--ui-warning)]",
  busy: "bg-[var(--ui-critical)]",
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
    "bg-[linear-gradient(135deg,var(--ui-primary),color-mix(in_srgb,var(--ui-primary)_70%,var(--ui-accent)))]",
    "bg-[linear-gradient(135deg,var(--ui-accent),color-mix(in_srgb,var(--ui-accent)_70%,var(--ui-primary)))]",
    "bg-[linear-gradient(135deg,var(--ui-success),color-mix(in_srgb,var(--ui-success)_70%,var(--ui-primary)))]",
    "bg-[linear-gradient(135deg,var(--ui-warning),color-mix(in_srgb,var(--ui-warning)_70%,var(--ui-accent)))]",
    "bg-[linear-gradient(135deg,var(--ui-critical),color-mix(in_srgb,var(--ui-critical)_70%,var(--ui-primary)))]",
    "bg-[linear-gradient(135deg,var(--ui-info),color-mix(in_srgb,var(--ui-info)_70%,var(--ui-accent)))]",
    "bg-[linear-gradient(135deg,var(--ui-secondary),color-mix(in_srgb,var(--ui-secondary)_70%,var(--ui-primary)))]",
    "bg-[linear-gradient(135deg,var(--ui-primary),color-mix(in_srgb,var(--ui-primary)_70%,var(--ui-success)))]",
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
        url ? 'bg-[var(--ui-tonal-secondary)]' : avatarColor,
        'text-[var(--ui-on-primary)] font-semibold flex items-center justify-center shadow-[var(--ui-shadow-md)] ring-2 ring-[var(--ui-surface)] transition-all duration-200 hover:scale-105',
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
        'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[var(--ui-surface)]',
      ]"
    />
  </div>
</template>

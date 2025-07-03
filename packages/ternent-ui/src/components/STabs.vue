<script setup>
import { computed } from "vue";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  exact: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "underline",
    validator: (value) => ["underline", "pills", "bordered", "segmented", "stripe"].includes(value),
  },
  size: {
    type: String,
    default: "micro",
    validator: (value) => ["nano", "micro", "tiny", "small", "medium", "sm", "md", "lg"].includes(value),
  },
  sticky: {
    type: Boolean,
    default: false,
  },
});

function isActiveLink(t) {
  return new RegExp(`${t.path}*`, "g").test(props.path);
}
function isExactActiveLink(t) {
  return new RegExp(`^${t.path}$`, "g").test(props.path);
}

const sizeClasses = computed(() => ({
  nano: "text-xs px-3 py-1.5",
  micro: "text-sm px-4 py-2", 
  tiny: "text-sm px-5 py-2.5",
  small: "text-base px-6 py-3",
  medium: "text-lg px-7 py-3.5",
  // Legacy size mappings for compatibility
  sm: "text-sm px-4 py-2",
  md: "text-base px-5 py-2.5", 
  lg: "text-lg px-6 py-3",
}));

const typeClasses = computed(() => ({
  underline: "relative transition-all duration-200 ease-out hover:text-base-content/80",
  pills: "rounded-lg hover:bg-base-200/60 transition-all duration-200 ease-out border border-transparent hover:border-base-300/40",
  bordered: "border border-base-300/40 hover:border-base-300/60 hover:bg-base-50/50 transition-all duration-200 ease-out rounded-lg",
  segmented: "first:rounded-l-lg last:rounded-r-lg border-r border-base-300/30 last:border-r-0 hover:bg-base-100/80 transition-all duration-200 ease-out relative",
  stripe: "relative text-base-content/60 hover:text-base-content",
}));

const activeClasses = computed(() => ({
  underline: "text-primary font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-secondary after:rounded-full",
  pills: "bg-primary/10 text-primary font-medium border-primary/30 shadow-sm",
  bordered: "border-primary/50 bg-primary/5 text-primary font-medium shadow-sm",
  segmented: "bg-base-100 text-primary font-medium shadow-sm z-10",
  stripe: "text-base-content font-semibold relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-secondary",
}));
</script>
<template>
  <div 
    class="relative"
    :class="{
      'sticky top-0 z-40 bg-base-100/95 border-b border-base-300/40': sticky,
      'border-b border-base-300/20': type === 'stripe'
    }"
  >
    <nav 
      role="tablist"
      class="flex relative"
      :class="{
        'space-x-1': type === 'pills',
        'space-x-0': type !== 'pills',
        'bg-gradient-to-r from-base-200/60 to-base-300/40 rounded-2xl p-1.5 border border-base-300/30': type === 'segmented',
      }"
    >
      <RouterLink
        v-for="t in items"
        :key="`tab-${t.path}`"
        :to="t.path"
        role="tab"
        class="relative flex items-center gap-2 font-medium focus:outline-none group text-base-content/70 flex-1 justify-center"
        :class="[
          sizeClasses[size],
          typeClasses[type],
          {
            [activeClasses[type]]: 
              (!exact && isActiveLink(t)) || (exact && isExactActiveLink(t)),
          }
        ]"
      >
        <!-- Icon if provided -->
        <span v-if="t.icon" class="w-4 h-4 flex-shrink-0" v-html="t.icon" />
        
        <span class="truncate relative z-10 text-sm">{{ t.title }}</span>
        
        <!-- Enhanced Badge -->
        <span 
          v-if="t.badge" 
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
        >
          {{ t.badge }}
        </span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
/* Clean, minimal focus styles */
a:focus {
  outline: none;
}

a:focus-visible {
  outline: 2px solid hsl(var(--primary) / 0.3);
  outline-offset: 2px;
}
</style>

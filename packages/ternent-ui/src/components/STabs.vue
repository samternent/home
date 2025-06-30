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
    validator: (value) => ["underline", "pills", "bordered", "segmented"].includes(value),
  },
  size: {
    type: String,
    default: "micro",
    validator: (value) => ["nano", "micro", "tiny", "small", "medium"].includes(value),
  },
});

function isActiveLink(t) {
  return new RegExp(`${t.path}*`, "g").test(props.path);
}
function isExactActiveLink(t) {
  return new RegExp(`^${t.path}$`, "g").test(props.path);
}

const sizeClasses = computed(() => ({
  nano: "text-sm px-3 py-1.5",
  micro: "text-sm px-3.5 py-2", 
  tiny: "text-base px-4 py-2",
  small: "text-base px-4 py-2.5",
  medium: "text-lg px-5 py-3",
}));

const typeClasses = computed(() => ({
  underline: "border-b border-transparent hover:border-slate-300/60 dark:hover:border-slate-400/60 transition-all duration-200",
  pills: "rounded-md hover:bg-slate-100/80 dark:hover:bg-slate-700/40 transition-all duration-200",
  bordered: "border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300/60 dark:hover:border-indigo-400/60 transition-all duration-200",
  segmented: "first:rounded-l-md last:rounded-r-md border-r border-slate-200/60 dark:border-slate-700/60 last:border-r-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all duration-200",
}));

const activeClasses = computed(() => ({
  underline: "border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300 font-medium",
  pills: "bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 font-medium shadow-sm",
  bordered: "border-indigo-300/80 dark:border-indigo-500/80 bg-indigo-50/60 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 font-medium",
  segmented: "bg-indigo-600 dark:bg-indigo-500 text-white font-medium shadow-sm z-10",
}));
</script>
<template>
  <div class="relative">
    <!-- Background line for underline type -->
    <div 
      v-if="type === 'underline'" 
      class="absolute bottom-0 left-0 right-0 h-px bg-slate-200/60 dark:bg-slate-700/60"
    />
    
    <nav 
      role="tablist"
      class="flex relative"
      :class="{
        'space-x-1': type === 'pills',
        'space-x-0': type !== 'pills',
        'bg-slate-100 dark:bg-slate-800 rounded-xl p-1': type === 'segmented',
      }"
    >
      <RouterLink
        v-for="t in items"
        :key="`tab-${t.path}`"
        :to="t.path"
        role="tab"
        class="relative flex items-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-1"
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
        
        <span class="truncate">{{ t.title }}</span>
        
        <!-- Badge if provided -->
        <span 
          v-if="t.badge" 
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100/80 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
        >
          {{ t.badge }}
        </span>
        
        <!-- Active indicator for underline type -->
        <span 
          v-if="type === 'underline' && ((!exact && isActiveLink(t)) || (exact && isExactActiveLink(t)))"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
        />
      </RouterLink>
    </nav>
  </div>
</template>

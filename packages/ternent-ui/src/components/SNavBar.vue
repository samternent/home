<script setup>
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { computed } from "vue";

const breakpoints = useBreakpoints(breakpointsTailwind);
const smallerThanMd = breakpoints.smaller("md");

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "minimal", "bordered", "blur"].includes(value),
  },
  sticky: {
    type: Boolean,
    default: true,
  },
});

const variantClasses = computed(() => ({
  default: "bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm",
  minimal: "bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50",
  bordered: "bg-white dark:bg-slate-950 border-b-2 border-indigo-500 shadow-md",
  blur: "bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60",
}));
</script>
<template>
  <header 
    class="w-full z-40 transition-all duration-200"
    :class="[
      variantClasses[variant],
      {
        'sticky top-0': sticky,
      }
    ]"
  >
    <div class="container-modern">
      <nav class="flex items-center justify-between h-16">
        <!-- Left section -->
        <div class="flex items-center flex-1">
          <slot name="nav" v-if="smallerThanMd" />
          
          <div class="flex items-center">
            <slot name="start">
              <RouterLink
                to="/"
                class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 font-bold text-lg group"
              >
                {{ title }}
                <span class="text-indigo-500 transition-transform duration-200 group-hover:scale-110">
                  .
                </span>
              </RouterLink>
            </slot>
          </div>
        </div>

        <!-- Center section -->
        <div class="hidden md:flex items-center justify-center flex-1">
          <slot name="center" />
        </div>

        <!-- Right section -->
        <div class="flex items-center justify-end flex-1 gap-3">
          <slot name="end" />
        </div>
      </nav>
    </div>
  </header>
</template>

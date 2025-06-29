<script setup>
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const breakpoints = useBreakpoints(breakpointsTailwind);
const smallerThanMd = breakpoints.smaller("md");

defineProps({
  title: {
    type: String,
    default: null,
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "glass", "glassmorphic", "minimal", "bordered"].includes(value),
  },
  sticky: {
    type: Boolean,
    default: true,
  },
});

const variantClasses = {
  default: "bg-base-100 border-b border-base-200/60 shadow-sm",
  glass: "bg-base-100/90 backdrop-blur-md border-b border-base-200/40",
  glassmorphic: "bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-700/40",
  minimal: "bg-transparent border-b border-base-200/30",
  bordered: "bg-base-100 border-b-4 border-primary shadow-sm",
};
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
                class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-base-200/60 transition-all duration-200 font-bold text-lg group"
              >
                {{ title }}
                <span class="text-primary transition-transform duration-200 group-hover:scale-110">
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
        <div class="flex items-center justify-end flex-1 gap-2">
          <slot name="end" />
        </div>
      </nav>
    </div>
  </header>
</template>

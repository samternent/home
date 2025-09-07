<script setup>
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { computed } from "vue";
import { designTokens, spacing, typography } from "../design-system/tokens.js";

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
    validator: (value) => ["default", "minimal", "bordered", "blur", "glass"].includes(value),
  },
  sticky: {
    type: Boolean,
    default: true,
  },
});

const variantClasses = computed(() => ({
  default: `bg-base-100/95 backdrop-blur-sm 
            border-b border-base-300/20 
            shadow-sm hover:shadow-md transition-all duration-300`,
  minimal: `bg-base-100/60 backdrop-blur-md 
           border-b border-base-300/10`,
  bordered: `bg-base-100 
            border-b-2 border-primary/80 shadow-lg`,
  blur: `bg-base-100/80 backdrop-blur-xl 
        border-b border-base-300/30`,
  glass: `bg-base-100/30 backdrop-blur-xl 
         border-b border-base-100/20 
         shadow-[0_8px_32px_rgba(0,0,0,0.08)]`,
}));
</script>
<template>
  <header 
    class="w-full z-40 transition-all duration-300 ease-out"
    :class="[
      variantClasses[variant],
      {
        'sticky top-0': sticky,
      }
    ]"
  >
    <div class="w-full px-3 lg:px-4">
      <nav class="flex items-center justify-between h-12">
        <!-- Left section -->
        <div class="flex items-center flex-1">
          <slot name="nav" v-if="smallerThanMd" />
          
          <div class="flex items-center">
            <slot name="start">
              <RouterLink
                to="/"
                class="flex items-center gap-2 px-2 py-1 rounded-lg 
                       hover:bg-neutral-100/50 
                       transition-all duration-200 font-semibold text-base group 
                       focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {{ title }}
                <span class="text-primary transition-transform duration-200 group-hover:scale-110 
                           group-hover:rotate-12">
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

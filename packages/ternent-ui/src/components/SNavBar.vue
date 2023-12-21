<script setup>
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const breakpoints = useBreakpoints(breakpointsTailwind);
const smallerThanMd = breakpoints.smaller("md");
defineProps({
  title: {
    type: String,
    default: null,
  },
});
</script>
<template>
  <div class="w-full bg-base-100 border-primary border-b-4 sticky top-0 z-10">
    <div class="navbar flex min-h-0 items-center">
      <div class="flex-1 items-center">
        <slot name="nav" v-if="smallerThanMd"> </slot>
        <slot name="start">
          <RouterLink
            to="/"
            class="btn btn-ghost btn-sm text-base normal-case font-extrabold md:mx-4"
            >{{ title }}<span class="text-accent -mx-2">.</span></RouterLink
          >
        </slot>
      </div>
      <div class="flex-none md:px-4">
        <slot name="end" />
      </div>
    </div>
  </div>
</template>

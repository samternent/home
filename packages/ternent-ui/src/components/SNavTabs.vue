<script setup>
import { computed } from "vue";
// import SDropdown from "./SDropdown.vue";
import STabs from "./STabs.vue";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
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
});

const breakpoints = useBreakpoints(breakpointsTailwind);

const mdAndLarger = breakpoints.greaterOrEqual("md");
const smallerThanMd = breakpoints.smaller("md");

const currentPathTitle = computed(
  () => props.items.find((tab) => tab.path === props.path)?.title
);
</script>
<template>
  <div class="sticky top-0 z-40 bg-base-100/95 backdrop-blur-sm border-b border-base-300/60 shadow-sm">
    <div class="flex items-center px-6 py-3">
      <h2 class="text-xl font-medium text-base-content border-r border-base-300/60 pr-6 mr-6">
        {{ title }}
      </h2>
    <STabs
      v-if="mdAndLarger"
      :items="items"
      :path="path"
      :exact="true"
      size="small"
      class="flex-1"
    />
    <div
      v-if="smallerThanMd"
      class="flex w-full justify-between flex-1 items-center"
    >
      <span class="px-4">{{ currentPathTitle }}</span>
    </div>
    </div>
  </div>
</template>

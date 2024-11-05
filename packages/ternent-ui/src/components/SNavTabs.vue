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
  <div class="flex items-center p-2">
    <h2 class="text-2xl font-light border-r border-base-300 px-4 sm:px-8">
      {{ title }}
    </h2>
    <STabs
      v-if="mdAndLarger"
      :items="items"
      :path="path"
      :exact="true"
      class="mx-2 hidden md:flex"
    />
    <div
      v-if="smallerThanMd"
      class="flex w-full justify-between flex-1 items-center"
    >
      <span class="px-4">{{ currentPathTitle }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LandingPageIcon } from "./LandingPage.types";

const props = withDefaults(
  defineProps<{
    name?: LandingPageIcon;
  }>(),
  {
    name: "spark",
  },
);

const pathData = computed(() => {
  switch (props.name) {
    case "globe":
      return ["circle 12 12 9", "path M3 12h18", "path M12 3a14 14 0 0 1 0 18", "path M12 3a14 14 0 0 0 0 18"];
    case "pin":
      return [
        "path M12 3a7 7 0 0 0-7 7c0 5 7 11 7 11s7-6 7-11a7 7 0 0 0-7-7Z",
        "path M12 8v5",
        "path M9.5 10.5h5",
      ];
    case "shield":
      return ["path m12 3 8 4.5v9L12 21 4 16.5v-9L12 3Z", "path m9 12 2 2 4-4"];
    case "check":
      return ["rect 4 4 16 16 2", "path m8 12 2.5 2.5L16 9"];
    case "stack":
      return [
        "path M12 3 4 7l8 4 8-4-8-4Z",
        "path M4 12l8 4 8-4",
        "path M4 17l8 4 8-4",
      ];
    case "document":
      return ["rect 5 3 14 18 2", "path M9 8h6", "path M9 12h6", "path M9 16h4"];
    case "terminal":
      return ["rect 3 4 18 16 2", "path M8 9 11 12 8 15", "path M13 15h3"];
    case "dataset":
      return [
        "ellipse 12 5 7 3",
        "path M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5",
        "path M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6",
      ];
    case "grid":
      return [
        "rect 4 4 7 7 1.5",
        "rect 13 4 7 7 1.5",
        "rect 4 13 7 7 1.5",
        "rect 13 13 7 7 1.5",
      ];
    default:
      return ["path M12 3 14.8 8.2 20 11l-5.2 2.8L12 19l-2.8-5.2L4 11l5.2-2.8L12 3Z"];
  }
});
</script>

<template>
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-for="segment in pathData" :key="segment">
      <circle
        v-if="segment.startsWith('circle ')"
        :cx="segment.split(' ')[1]"
        :cy="segment.split(' ')[2]"
        :r="segment.split(' ')[3]"
      />
      <ellipse
        v-else-if="segment.startsWith('ellipse ')"
        :cx="segment.split(' ')[1]"
        :cy="segment.split(' ')[2]"
        :rx="segment.split(' ')[3]"
        :ry="segment.split(' ')[4]"
      />
      <rect
        v-else-if="segment.startsWith('rect ')"
        :x="segment.split(' ')[1]"
        :y="segment.split(' ')[2]"
        :width="segment.split(' ')[3]"
        :height="segment.split(' ')[4]"
        :rx="segment.split(' ')[5]"
      />
      <path v-else :d="segment.replace(/^path /, '')" />
    </template>
  </svg>
</template>

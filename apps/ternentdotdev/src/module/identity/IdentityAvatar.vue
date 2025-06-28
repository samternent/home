<script setup>
import { computed } from "vue";
import Glyphy from "./Glyphy.vue";

const props = defineProps({
  identity: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: "sm",
  },
});

const sizeVariant = computed(() => {
  if (props.size === "xs") {
    return {
      classes: "w-5 h-5",
      grid: 9,
    };
  }
  if (props.size === "sm") {
    return {
      classes: "w-8 h-8",
      grid: 9,
    };
  }
  if (props.size === "md") {
    return {
      classes: "w-16 h-16",
      grid: 16,
    };
  }
  if (props.size === "lg") {
    return {
      classes: "w-32 h-32",
      grid: 25,
    };
  }
  if (props.size === "xl") {
    return {
      classes: "w-48 h-48",
      grid: 36,
    };
  }
  
  // Default fallback for unsupported sizes
  return {
    classes: "w-8 h-8",
    grid: 9,
  };
});
</script>
<template>
  <div :class="`p-0 m-0 ${sizeVariant.classes}`">
    <Glyphy v-if="identity" :identity="identity" :gridLen="sizeVariant.grid" />
  </div>
</template>

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
      classes: "w-5",
      grid: 9,
    };
  }
  if (props.size === "sm") {
    return {
      classes: "w-8",
      grid: 9,
    };
  }
  if (props.size === "md") {
    return {
      classes: "w-16",
      grid: 16,
    };
  }
  if (props.size === "lg") {
    return {
      classes: "w-32",
      grid: 25,
    };
  }
});
</script>
<template>
  <Glyphy
    v-if="identity"
    :identity="identity"
    :class="`p-0 m-0 ${sizeVariant.classes}`"
    :gridLen="sizeVariant.grid"
  />
</template>

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
  variant: {
    type: Number,
    default: 0,
  },
});

const sizeVariant = computed(() => {
  if (props.size === "xs") {
    return {
      classes: "w-5 h-5",
    };
  }
  if (props.size === "sm") {
    return {
      classes: "w-8 h-8",
    };
  }
  if (props.size === "md") {
    return {
      classes: "w-16 h-16",
    };
  }
  if (props.size === "lg") {
    return {
      classes: "w-32 h-32",
    };
  }
});
</script>
<template>
  <div :class="`p-0 m-0 ${sizeVariant.classes}`" :key="identity">
    <Glyphy
      v-if="identity"
      :identity="identity.replace(/\s/g, '')"
      :variant="variant"
    />
  </div>
</template>

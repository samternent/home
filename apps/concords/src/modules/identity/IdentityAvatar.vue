<script setup>
import Glyphy from "./Glyphy.vue";

defineProps({
  identity: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <Glyphy v-if="identity" :identity="identity" class="w-8" :gridLen="9" />
</template>

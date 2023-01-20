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
  <Glyphy v-if="identity" :identity="identity" class="w-12" :gridLen="16" />
</template>

<script setup>
defineProps({
  slideName: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <iframe :src="`/slides/${slideName}`" class="w-full h-full border-0" />
</template>

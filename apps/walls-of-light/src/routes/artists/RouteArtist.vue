<script setup>
defineProps({
  artist: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <div class="flex flex-col p-2">
    {{ artist }}
  </div>
</template>
<style></style>

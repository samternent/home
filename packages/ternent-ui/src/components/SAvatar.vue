<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    default: null,
  },
});
</script>
<template>
  <div class="avatar placeholder">
    <div class="bg-neutral text-neutral-content rounded-full">
      <span class="text-2xl">{{ name[0] }}</span>
    </div>
  </div>
</template>

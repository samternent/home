<script setup>
defineProps({
  type: {
    type: String,
    default: "primary",
  },
});
</script>
<template>
  <span class="badge badge-secondary"><slot /></span>
</template>

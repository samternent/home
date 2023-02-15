<script setup>
defineProps({
  item: {
    type: String,
    default: "",
  },
});
</script>
<template>
  <div class="p-2 min-w-32 truncate">{{ item }}</div>
</template>

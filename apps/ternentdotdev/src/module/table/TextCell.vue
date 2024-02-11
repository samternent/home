<script setup>
defineProps({
  item: {
    type: [String, Boolean],
    default: "",
  },
});
</script>
<template>
  <div class="px-2 w-64 truncate">{{ item }}</div>
</template>

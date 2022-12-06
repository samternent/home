<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
});
</script>
<template>
  <header
    class="breadcrumbs p-2 flex overflow-visible justify-between flex-1 items-center"
  >
    <div class="font-bold text-xl">{{ title }}</div>
    <span class="text-xs mr-3 text-gray-600 font-medium">{{
      description
    }}</span>
  </header>
</template>

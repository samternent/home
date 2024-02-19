<script setup>
import Tasks from "@/module/tasks/Tasks.vue";

defineProps({
  sheetName: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <Tasks :collection="sheetName" />
</template>

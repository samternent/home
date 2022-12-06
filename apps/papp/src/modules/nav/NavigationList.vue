<script setup lang="ts">
import NavigationListItem from "./NavigationListItem.vue";

defineProps({
  items: {
    type: Array,
    required: true,
  },
});
</script>
<template>
  <ul class="flex flex-col flex-1 mt-8 gap-2">
    <NavigationListItem v-for="item in items" :item="item" :key="item.path" />
  </ul>
</template>

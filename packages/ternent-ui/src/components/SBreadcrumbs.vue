<script setup>
const props = defineProps({
  breadcrumbs: {
    type: Array,
    required: true,
  },
});
</script>
<template>
  <div class="text-xs breadcrumbs">
    <ul>
      <li v-for="breadcrumb in breadcrumbs" :key="breadcrumb.path">
        <RouterLink :to="breadcrumb.path">{{ breadcrumb.name }}</RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({});
</script>
<template>
  <button v-bind="$props" class="bg-primary py-2 px-3 rounded"><slot /></button>
</template>

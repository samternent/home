<script lang="ts" setup>
import { shallowRef } from "vue";

const columns = shallowRef([]);
</script>

<template>
  <div v-if="!columns.length">Add a column</div>
  <div v-else></div>
</template>

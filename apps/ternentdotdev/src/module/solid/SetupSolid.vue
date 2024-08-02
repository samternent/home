<script setup>
import { onMounted } from "vue";
import { provideSolid } from "./useSolid";

const { handleSessionLogin } = provideSolid();
onMounted(handleSessionLogin);
</script>
<template>
  <slot />
</template>

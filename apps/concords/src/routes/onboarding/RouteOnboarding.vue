<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>
<template>
  <div class="flex flex-col">
    <RouterView />
  </div>
</template>

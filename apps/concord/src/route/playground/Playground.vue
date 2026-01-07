<script setup lang="ts">
import Demo from "../../module/demo/Demo.vue";
</script>
<template>
  <div class="h-screen w-screen flex flex-col">
    <ClientOnly>
      <Demo />
    </ClientOnly>
  </div>
</template>

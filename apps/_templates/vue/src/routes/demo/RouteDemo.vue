<script setup>
import { computed } from "vue";
import { SBrandHeader, STabs } from "ternent-ui/components";

const tabs = computed(() => [
  {
    title: "Board",
    path: "/demo/board",
  },
  {
    title: "List",
    path: "/demo/list",
  },
]);
</script>
<template>
  <div class="flex flex-col h-full flex-1">
    <div class="flex items-center p-2">
      <h2 class="text-2xl font-light border-r border-base-300 px-8">Demos</h2>
      <STabs :items="tabs" :path="$route.path" :exact="true" class="mx-2" />
    </div>
    <RouterView />
  </div>
</template>

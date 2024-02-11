<script setup>
import Tasks from "@/module/tasks/Tasks.vue";
import { SBrandHeader } from "ternent-ui/components";
</script>

<template>
  <div class="p-2 flex-1">
    <SBrandHeader class="font-light mb-4">Tasks</SBrandHeader>
    <Tasks />
  </div>
</template>

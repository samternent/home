<script setup lang="ts">
import { onMounted } from "vue";
import { useRunCoreRuntime } from "@/modules/run/core";
import AppShell from "@/modules/ui/components/AppShell.vue";

const runtime = useRunCoreRuntime();

onMounted(async () => {
  await runtime.init();
});
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
</template>

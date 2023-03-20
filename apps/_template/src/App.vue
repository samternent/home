<script setup lang="ts">
import { AppShell } from "@/modules/appShell";
</script>

<template>
  <AppShell>
    <template #side-nav> </template>
    <RouterView />
  </AppShell>
</template>

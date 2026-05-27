<script setup lang="ts">
import { appConfig } from "@/app/config/app.config";
</script>

<template>
  <footer class="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-fg-muted">
    <span>{{ appConfig.appTitle }}</span>
    <span>{{ appConfig.defaultHost }}</span>
  </footer>
</template>

<script setup lang="ts">
import { SBrandHeader } from "ternent-ui/components";
import { appConfig } from "@/app/config/app.config";
</script>

<template>
  <header class="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
    <RouterLink to="/" class="no-underline">
      <SBrandHeader size="md">{{ appConfig.appTitle }}</SBrandHeader>
    </RouterLink>

    <nav class="flex items-center gap-2 text-sm">
      <RouterLink class="rounded-md px-3 py-2 hover:bg-surface" to="/">Home</RouterLink>
      <RouterLink class="rounded-md px-3 py-2 hover:bg-surface" to="/settings">Settings</RouterLink>
    </nav>
  </header>
</template>

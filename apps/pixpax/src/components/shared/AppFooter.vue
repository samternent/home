<script setup lang="ts">
import { appConfig } from "@/app/config/app.config";
</script>

<template>
  <footer
    class="flex flex-col gap-3 border-t border-border px-6 py-4 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between"
  >
    <span>{{ appConfig.appTitle }}</span>
    <div class="flex flex-col gap-1 sm:items-end">
      <a
        href="https://concord.ternent.dev"
        target="_blank"
        rel="noreferrer"
        class="text-[11px] font-medium uppercase tracking-[0.22em] text-fg no-underline transition-colors hover:text-primary"
      >
        Powered by Concord
      </a>
      <span>{{ appConfig.defaultHost }}</span>
    </div>
  </footer>
</template>

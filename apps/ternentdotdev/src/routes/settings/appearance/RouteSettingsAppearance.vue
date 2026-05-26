<script setup lang="ts">
import { SCard } from "ternent-ui/components";
import ThemeModeToggle from "@/modules/ui/components/ThemeModeToggle.vue";
import { useThemeMode } from "@/modules/ui";

const { mode } = useThemeMode();
</script>

<template>
  <SCard class="space-y-4 p-5">
    <h2 class="m-0 text-xl">Appearance</h2>
    <p class="text-sm text-fg-muted">
      This template intentionally supports only one custom light/dark theme pair.
    </p>

    <div class="flex items-center gap-3">
      <ThemeModeToggle />
      <span class="text-sm text-fg-muted">Current mode: <strong>{{ mode }}</strong></span>
    </div>
  </SCard>
</template>

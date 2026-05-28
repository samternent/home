<script setup lang="ts">
import { Logo } from "ternent-ui/patterns";
import { Button, Separator } from "ternent-ui/primitives";
import ThemeModeToggle from "@/modules/ui/components/ThemeModeToggle.vue";
</script>
<template>
  <div class="min-h-screen">
    <div
      class="sticky top-0 z-50 h-16 w-full border-b border-[var(--ui-border)] bg-[var(--ui-bg)]/90 p-4 backdrop-blur"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between">
        <RouterLink to="/" class="flex items-end gap-3 no-underline">
          <Logo class="!size-8" />
        </RouterLink>

        <nav class="flex gap-3 text-sm">
          <!-- <RouterLink to="/armour">Armour</RouterLink>
          <RouterLink to="/concord">Concord</RouterLink>
          <RouterLink to="/ledger">Ledger</RouterLink>
          <RouterLink to="/seal">Seal</RouterLink> -->
        </nav>
      </div>
    </div>

    <RouterView />

    <footer class="px-4 py-6 bg-[var(--ui-bg)]/90 backdrop-blur border-t border-[var(--ui-border)]">
      <div
        class="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-[var(--ui-fg-muted)] mx-auto max-w-6xl"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span>ternent.dev</span>
          <span class="opacity-60">•</span>
          <span>© 2026</span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- <Button as="RouterLink" to="/concord" variant="plain-secondary" size="sm">Concord</Button>
          <Button as="RouterLink" to="/ledger" variant="plain-secondary" size="sm">Ledger</Button>
          <Button as="RouterLink" to="/seal" variant="plain-secondary" size="sm">Seal</Button>
          <Button as="RouterLink" to="/armour" variant="plain-secondary" size="sm">Armour</Button> -->
          <ThemeModeToggle />
        </div>
      </div>
    </footer>
  </div>
</template>

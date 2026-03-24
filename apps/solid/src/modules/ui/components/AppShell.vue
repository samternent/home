<script setup lang="ts">
import AppHeader from "@/components/shared/AppHeader.vue";
import AppFooter from "@/components/shared/AppFooter.vue";
import ThemeModeToggle from "@/modules/ui/components/ThemeModeToggle.vue";
import OfflineBanner from "@/modules/offline/components/OfflineBanner.vue";
</script>

<template>
  <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
    <AppHeader />

    <main class="flex-1 px-6 py-6">
      <div class="mb-4 flex justify-end">
        <ThemeModeToggle />
      </div>

      <div class="mb-4">
        <OfflineBanner />
      </div>

      <slot />
    </main>

    <AppFooter />
  </div>
</template>

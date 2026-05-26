<script setup lang="ts">
import IdentityStatusCard from "@/modules/identity/components/IdentityStatusCard.vue";
</script>

<template>
  <section class="space-y-4">
    <IdentityStatusCard />

    <nav class="flex flex-wrap gap-2 rounded-lg border border-border bg-surface p-2 text-sm">
      <RouterLink class="rounded-md px-3 py-2 hover:bg-surface-hover" to="/settings/identity/create">
        Create
      </RouterLink>
      <RouterLink class="rounded-md px-3 py-2 hover:bg-surface-hover" to="/settings/identity/import">
        Import
      </RouterLink>
      <RouterLink class="rounded-md px-3 py-2 hover:bg-surface-hover" to="/settings/identity/export">
        Export
      </RouterLink>
    </nav>

    <RouterView />
  </section>
</template>

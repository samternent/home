<script setup lang="ts">
import { SButton, SCard } from "ternent-ui/components";
import IdentityStatusCard from "@/modules/identity/components/IdentityStatusCard.vue";
import { appConfig } from "@/app/config/app.config";
</script>

<template>
  <section class="grid gap-4 md:grid-cols-2">
    <SCard class="p-6">
      <h1 class="m-0 text-2xl">Template-ready ternent app</h1>
      <p class="mt-3 text-fg-muted">
        This baseline app is optimized for feature modules, route-folder structure,
        offline-first behavior, and foundational identity flows.
      </p>
      <div class="mt-5 flex flex-wrap gap-3">
        <SButton type="primary" to="/settings/identity/create">Create identity</SButton>
        <SButton type="secondary" to="/settings">Open settings</SButton>
      </div>
      <p class="mt-4 text-xs text-fg-muted">Default host: {{ appConfig.defaultHost }}</p>
    </SCard>

    <IdentityStatusCard />
  </section>
</template>

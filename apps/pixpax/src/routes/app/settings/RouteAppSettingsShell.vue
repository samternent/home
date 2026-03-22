<script setup lang="ts">
import { useRoute } from "vue-router";
import { Button, Card } from "ternent-ui/primitives";

const route = useRoute();

const tabs = [
  {
    path: "/app/settings/my-device",
    label: "My device",
  },
  {
    path: "/app/settings/children",
    label: "Children",
  },
  {
    path: "/app/settings/family",
    label: "Family backup",
  },
  {
    path: "/app/settings/import-export",
    label: "Import / export",
  },
];
</script>

<template>
  <section class="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
    <Card variant="showcase" padding="sm" class="lg:sticky lg:top-24">
      <div class="space-y-5">
        <div class="space-y-2">
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
            Settings
          </p>
          <h1 class="m-0 text-xl font-semibold tracking-tight">Family controls</h1>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            Keep this device simple for kids. Family backup, child switching, and safe exports live here.
          </p>
        </div>

        <div class="grid gap-2">
          <Button
            v-for="tab in tabs"
            :key="tab.path"
            as="RouterLink"
            :to="tab.path"
            size="sm"
            :variant="route.path === tab.path ? 'secondary' : 'plain-secondary'"
            class="!justify-start !rounded-2xl !px-4 !py-3 !font-mono !text-[11px] !uppercase !tracking-[0.18em]"
          >
            {{ tab.label }}
          </Button>
        </div>
      </div>
    </Card>

    <RouterView />
  </section>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { Button } from "ternent-ui/primitives";

const route = useRoute();
const router = useRouter();

const items = [
  {
    label: "Tasks",
    href: "/tasks",
    description: "Work items in this ledger",
  },
  {
    label: "Permissions",
    href: "/tasks/permissions",
    description: "Access groups stored in this ledger",
  },
] as const;

function isActiveHref(href: string): boolean {
  return route.path === href || route.path.startsWith(`${href}/`);
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Button
      v-for="item in items"
      :key="item.href"
      size="sm"
      :variant="isActiveHref(item.href) ? 'secondary' : 'plain-secondary'"
      class="rounded-lg"
      @click="router.push(item.href)"
    >
      {{ item.label }}
    </Button>
  </div>
</template>

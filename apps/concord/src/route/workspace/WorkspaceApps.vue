<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const tabs = [
  { name: "Tasks", to: "/workspace/apps/todos" },
  { name: "Patient Records", to: "/workspace/apps/patients" },
];

const activePath = computed(() => route.path);

function isActive(to: string) {
  return activePath.value.startsWith(to);
}
</script>

<template>
  <div class="mx-auto w-full flex flex-col flex-1">
    <nav
      class="sticky top-0 z-10 border-b border-[var(--ui-border)] flex flex-wrap items-center text-xs"
    >
      <RouterLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.to"
        class="px-4 py-2 transition border-[var(--ui-border)] border-r"
        :class="
          isActive(tab.to)
            ? 'bg-[var(--ui-surface)] text-[var(--ui-primary)]  '
            : 'hover:bg-[var(--ui-surface)] '
        "
      >
        {{ tab.name }}
      </RouterLink>
    </nav>

    <section class="flex-1 flex flex-col min-h-0">
      <RouterView />
    </section>
  </div>
</template>

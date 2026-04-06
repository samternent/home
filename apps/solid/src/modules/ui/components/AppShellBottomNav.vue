<script setup lang="ts">
import { Button } from "ternent-ui/primitives";
import { useAppShellState } from "@/modules/ui/useAppShellState";

const shellState = useAppShellState();
</script>

<template>
  <div class="mx-auto m-2 flex max-w-7xl justify-center">
    <nav
      class="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2"
    >
      <Button variant="plain-primary" @click="$router.push('/')" size="xl">
        <svg
          v-if="$route.path === '/'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="var(--ui-accent)"
          class="size-8"
        >
          <path
            d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z"
          />
          <path
            d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z"
          />
        </svg>

        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="var(--ui-accent)"
          class="size-8"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      </Button>
      <Button
        variant="plain-secondary"
        @click="$router.push('/tasks')"
        size="xl"
      >
        <svg
          v-if="$route.path === '/tasks'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="size-8"
        >
          <path
            fill-rule="evenodd"
            d="M2.25 6a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V6Zm3.97.97a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 0 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Zm4.28 4.28a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
            clip-rule="evenodd"
          />
        </svg>

        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-8"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7.5 6.75h9a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 16.5 18.75h-9a2.25 2.25 0 0 1-2.25-2.25V9A2.25 2.25 0 0 1 7.5 6.75Zm1.5 3h6m-6 3h4.5"
          />
        </svg>
      </Button>
    </nav>
  </div>
</template>

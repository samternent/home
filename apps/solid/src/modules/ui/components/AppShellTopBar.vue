<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Button } from "ternent-ui/primitives";
import { useRunCoreRuntime } from "@/modules/run/core";
import ThemeModeToggle from "@/modules/ui/components/ThemeModeToggle.vue";
import { useAppShellIdentityModel } from "@/modules/ui/useAppShellIdentityModel";
import { useAppShellState } from "@/modules/ui/useAppShellState";

const runtime = useRunCoreRuntime();
const shellState = useAppShellState();
const identity = useAppShellIdentityModel();
const route = useRoute();
const router = useRouter();

const activeMountLabel = computed(
  () => runtime.workspace.selection.value.activeMountId ?? "No mount selected",
);

async function logout() {
  await runtime.auth.logout();
}

const appNav = [
  { label: "Home", href: "/" },
  { label: "Tasks", href: "/tasks" },
];

const documentNav = [
  { label: "Tasks", href: "/tasks" },
  { label: "Users", href: "/tasks/users" },
  { label: "Permissions", href: "/tasks/permissions" },
];

const inTasksDocument = computed(() => route.path.startsWith("/tasks"));

function isActiveHref(href: string): boolean {
  if (href === "/") {
    return route.path === "/";
  }

  return route.path === href || route.path.startsWith(`${href}/`);
}
</script>

<template>
  <div
    class="flex items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-surface)] p-1.5"
  >
    <div class="flex min-w-0 items-center gap-2 p-1">
      <div
        class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-3 py-1 text-[11px] text-[var(--ui-fg-muted)]"
      >
        {{ activeMountLabel }}
      </div>
      <div
        class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-3 py-1 text-[11px] text-[var(--ui-fg-muted)]"
      >
        {{ identity.activeIdentityLabel.value }}
      </div>
      <Button
        v-if="runtime.auth.isAuthenticated.value"
        size="xs"
        variant="plain-secondary"
        class="rounded-lg"
        @click="logout"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="var(--ui-critical)"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"
          />
        </svg>
      </Button>
    </div>
    <div class="flex items-center gap-2">
      <div class="hidden items-center gap-2 lg:flex">
        <Button
          v-for="item in appNav"
          :key="item.href"
          size="xs"
          :variant="isActiveHref(item.href) ? 'secondary' : 'plain-secondary'"
          class="rounded-lg"
          @click="router.push(item.href)"
        >
          {{ item.label }}
        </Button>
      </div>
      <div
        v-if="inTasksDocument"
        class="hidden items-center gap-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-2 py-1 lg:flex"
      >
        <span class="px-2 text-[10px] uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">
          Document
        </span>
        <Button
          v-for="item in documentNav"
          :key="`document:${item.href}`"
          size="xs"
          :variant="isActiveHref(item.href) ? 'secondary' : 'plain-secondary'"
          class="rounded-lg"
          @click="router.push(item.href)"
        >
          {{ item.label }}
        </Button>
      </div>
      <Button
        size="xs"
        variant="plain-secondary"
        class="rounded-lg"
        @click="shellState.togglePanel('explorer')"
      >
        Explorer
      </Button>
      <Button
        size="xs"
        variant="plain-secondary"
        class="rounded-lg"
        @click="shellState.toggleTerminal()"
      >
        Terminal
      </Button>
      <Button
        size="xs"
        variant="plain-secondary"
        class="rounded-lg"
        @click="shellState.toggleConnect()"
      >
        Connect
      </Button>
      <ThemeModeToggle size="xs" />
    </div>
  </div>
</template>

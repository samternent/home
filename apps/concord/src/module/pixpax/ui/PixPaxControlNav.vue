<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { usePixpaxAuth, type PixPaxPermission } from "../auth/usePixpaxAuth";

type NavItem = {
  label: string;
  to: string;
  permission: PixPaxPermission;
};

const route = useRoute();
const auth = usePixpaxAuth();

const items: NavItem[] = [
  {
    label: "Login",
    to: "/pixpax/control/login",
    permission: "pixpax.creator.view",
  },
  {
    label: "Creator",
    to: "/pixpax/control/creator",
    permission: "pixpax.creator.view",
  },
  {
    label: "Analytics",
    to: "/pixpax/control/analytics",
    permission: "pixpax.analytics.read",
  },
  {
    label: "Admin",
    to: "/pixpax/control/admin",
    permission: "pixpax.admin.manage",
  },
];

const authLabel = computed(() => {
  if (auth.status.value === "authenticated") return "authenticated";
  if (auth.status.value === "validating") return "checking token";
  if (auth.status.value === "invalid") return "token invalid";
  if (auth.status.value === "error") return "auth error";
  return "guest";
});

function canAccess(item: NavItem) {
  return auth.hasPermission(item.permission);
}

function linkFor(item: NavItem) {
  if (canAccess(item)) return item.to;
  return {
    path: "/pixpax/control/login",
    query: { redirect: item.to },
  };
}

onMounted(() => {
  void auth.validateToken();
});
</script>

<template>
  <aside
    class="h-full w-64 shrink-0 border-r border-[var(--ui-border)] bg-[var(--ui-bg)]"
  >
    <div class="border-b border-[var(--ui-border)] p-3">
      <div class="text-xs uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
        PixPax Control
      </div>
      <div class="mt-2 text-xs text-[var(--ui-fg-muted)]">Status: {{ authLabel }}</div>
      <button
        v-if="auth.isAuthenticated.value"
        type="button"
        class="mt-2 rounded border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5"
        @click="auth.logout()"
      >
        Logout
      </button>
    </div>

    <nav class="flex flex-col p-2 text-xs">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="linkFor(item)"
        class="flex items-center justify-between rounded px-3 py-2 transition-colors"
        :class="{
          'bg-[var(--ui-fg)]/10': route.path === item.to,
          'text-[var(--ui-fg-muted)]': !canAccess(item),
        }"
      >
        <span>{{ item.label }}</span>
        <span v-if="!canAccess(item)">locked</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAppApi } from "@/app/api";

const appApi = useAppApi();
const loadError = ref<string | null>(null);

const activeIdentityLabel = computed(
  () => appApi.identity.activeIdentity.value?.label ?? "none",
);
const userCount = computed(() => appApi.users.all().length);
const permissionCount = computed(() => appApi.permissions.all().length);

onMounted(async () => {
  try {
    await appApi.load();
    await appApi.identity.ensureActiveIdentity();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error);
  }
});
</script>

<template>
  <section class="space-y-4" data-test="home-v2">
    <p class="m-0 text-xs uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">
      Home
    </p>
    <h2 class="m-0 text-2xl font-semibold text-[var(--ui-fg)]">
      Concord host is active
    </h2>
    <p class="m-0 max-w-2xl text-sm leading-6 text-[var(--ui-fg-muted)]">
      This app runs as a thin host over Concord. Replay of committed plus staged entries is the only state source.
    </p>
    <dl class="m-0 grid gap-2 rounded-lg border border-[var(--ui-border)] p-3 text-sm">
      <div class="flex items-center justify-between gap-4">
        <dt class="text-[var(--ui-fg-muted)]">
          Status
        </dt>
        <dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-status">
          {{ appApi.status.value }}
        </dd>
      </div>
      <div class="flex items-center justify-between gap-4">
        <dt class="text-[var(--ui-fg-muted)]">
          Integrity valid
        </dt>
        <dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-integrity">
          {{ appApi.getState().integrityValid ? "yes" : "no" }}
        </dd>
      </div>
      <div class="flex items-center justify-between gap-4">
        <dt class="text-[var(--ui-fg-muted)]">
          Staged entries
        </dt>
        <dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-staged-count">
          {{ appApi.getState().stagedCount }}
        </dd>
      </div>
      <div class="flex items-center justify-between gap-4">
        <dt class="text-[var(--ui-fg-muted)]">
          Active identity
        </dt>
        <dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-active-identity">
          {{ activeIdentityLabel }}
        </dd>
      </div>
      <div class="flex items-center justify-between gap-4">
        <dt class="text-[var(--ui-fg-muted)]">
          Users
        </dt>
        <dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-user-count">
          {{ userCount }}
        </dd>
      </div>
      <div class="flex items-center justify-between gap-4">
        <dt class="text-[var(--ui-fg-muted)]">
          Permissions
        </dt>
        <dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-permission-count">
          {{ permissionCount }}
        </dd>
      </div>
    </dl>
    <p
      v-if="loadError || appApi.lastError.value"
      class="m-0 text-sm text-[var(--ui-critical)]"
      data-test="home-v2-error"
    >
      {{ loadError ?? appApi.lastError.value }}
    </p>
    <RouterLink
      to="/permissions"
      class="inline-flex rounded-lg border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-fg)] no-underline transition hover:bg-[var(--ui-tonal-secondary)]"
      data-test="home-v2-permissions-link"
    >
      Open permissions
    </RouterLink>
  </section>
</template>

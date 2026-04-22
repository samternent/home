<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAppApi } from "@/app/api";
import { Button } from "ternent-ui/primitives";
import { KeyValueList } from "ternent-ui/patterns";

const appApi = useAppApi();
const loadError = ref<string | null>(null);

const activeIdentityLabel = computed(
  () => appApi.identity.activeIdentity.value?.label ?? "none",
);
const userCount = computed(() => appApi.users.all().length);
const permissionCount = computed(() => appApi.permissions.all().length);

const summaryItems = computed(() => [
  {
    label: "Status",
    value: appApi.status.value,
    dataTest: "home-v2-status",
  },
  {
    label: "Integrity valid",
    value: appApi.getState().integrityValid,
    dataTest: "home-v2-integrity",
  },
  {
    label: "Staged entries",
    value: appApi.getState().stagedCount,
    dataTest: "home-v2-staged-count",
  },
  {
    label: "Active identity",
    value: activeIdentityLabel.value,
    dataTest: "home-v2-active-identity",
  },
  {
    label: "Users",
    value: userCount.value,
    dataTest: "home-v2-user-count",
  },
  {
    label: "Permissions",
    value: permissionCount.value,
    dataTest: "home-v2-permission-count",
  },
]);

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

    <KeyValueList :items="summaryItems" />

    <p
      v-if="loadError || appApi.lastError.value"
      class="m-0 text-sm text-[var(--ui-critical)]"
      data-test="home-v2-error"
    >
      {{ loadError ?? appApi.lastError.value }}
    </p>

    <Button
      as="RouterLink"
      to="/permissions"
      variant="secondary"
      size="sm"
      data-test="home-v2-permissions-link"
    >
      Open permissions
    </Button>
  </section>
</template>

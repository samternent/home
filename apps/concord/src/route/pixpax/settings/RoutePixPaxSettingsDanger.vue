<script setup lang="ts">
import { usePixpaxCloudSync } from "../../../module/pixpax/context/usePixpaxCloudSync";

const cloudSync = usePixpaxCloudSync();
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-lg font-semibold text-red-600">Danger Zone</h1>
    <p class="text-xs text-[var(--ui-fg-muted)]">
      Destructive removal is account-backed. Local destructive tools are disabled in this flow.
    </p>

    <section class="rounded-lg border border-red-500/40 p-3 flex flex-col gap-2">
      <p class="text-xs text-[var(--ui-fg-muted)]">
        Use <RouterLink :to="{ name: 'pixpax-settings-identity-devices' }" class="underline">Identity & Devices</RouterLink>
        to remove identities from your account.
      </p>
      <p v-if="!cloudSync.account.isAuthenticated.value" class="text-xs text-amber-600">
        Sign in to perform backend removal actions.
      </p>
    </section>
  </div>
</template>

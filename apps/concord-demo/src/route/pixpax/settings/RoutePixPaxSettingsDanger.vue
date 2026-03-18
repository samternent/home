<script setup lang="ts">
import { usePixpaxContextStore } from "../../../module/pixpax/context/usePixpaxContextStore";
import { usePixpaxCloudSync } from "../../../module/pixpax/context/usePixpaxCloudSync";

const context = usePixpaxContextStore();
const cloudSync = usePixpaxCloudSync();

async function resetAccountIdentityData() {
  if (!cloudSync.account.isAuthenticated.value) {
    context.setError("Sign in before resetting account identity data.");
    return;
  }

  const confirmation = window.prompt(
    "Type RESET to remove all identities and pixbooks from this account."
  );
  if (confirmation !== "RESET") return;

  const ok = await cloudSync.resetAccountIdentityData();
  if (!ok) {
    context.setError(
      cloudSync.cloudSyncError.value || "Failed to reset account identity data."
    );
    return;
  }

  context.setStatus("Account identity data reset. Recreate identities explicitly.");
}
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
      <button
        type="button"
        class="w-fit rounded-md border border-red-500/40 px-3 py-2 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
        :disabled="!cloudSync.account.isAuthenticated.value"
        @click="resetAccountIdentityData"
      >
        Reset account identities + pixbooks
      </button>
      <p class="text-[11px] text-[var(--ui-fg-muted)]">
        This only clears PixPax account domain data. It does not delete your login account.
      </p>
    </section>

    <p v-if="context.errorMessage.value" class="text-xs text-red-600">{{ context.errorMessage.value }}</p>
    <p v-if="context.statusMessage.value" class="text-xs text-green-600">{{ context.statusMessage.value }}</p>
  </div>
</template>

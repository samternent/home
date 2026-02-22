<script setup lang="ts">
import IdentityAvatar from "../../../module/identity/IdentityAvatar.vue";
import { usePixpaxCloudSync } from "../../../module/pixpax/context/usePixpaxCloudSync";
import { usePixpaxContextStore } from "../../../module/pixpax/context/usePixpaxContextStore";
import { usePixpaxSwitchContext } from "../../../module/pixpax/context/usePixpaxSwitchContext";

const context = usePixpaxContextStore();
const cloudSync = usePixpaxCloudSync();
const switchContext = usePixpaxSwitchContext();
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-lg font-semibold">Settings Home</h1>
    <p class="text-xs text-[var(--ui-fg-muted)]">
      Identity is your ownership root in PixPax. Pixbooks are datasets under the active identity.
    </p>

    <div class="grid gap-3 md:grid-cols-2">
      <div class="rounded-lg border border-[var(--ui-border)] p-3">
        <p class="text-[10px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">Current identity</p>
        <div class="mt-2 flex items-center gap-3">
          <IdentityAvatar :identity="context.publicKeyPEM.value" size="sm" />
          <p class="text-sm font-semibold">
            {{ context.currentIdentityUsername.value ? `@${context.currentIdentityUsername.value}` : "Identity" }}
          </p>
        </div>
      </div>
      <div class="rounded-lg border border-[var(--ui-border)] p-3">
        <p class="text-[10px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">Current pixbook</p>
        <p class="text-sm font-semibold">{{ context.currentPixbookLabel.value }}</p>
        <p class="text-xs text-[var(--ui-fg-muted)]">
          One pixbook for this identity in collection <code>{{ context.currentCollectionId.value }}</code>
        </p>
      </div>
    </div>

    <p v-if="switchContext.switchWarning.value" class="text-xs text-amber-600">
      {{ switchContext.switchWarning.value }}
    </p>
    <p v-if="switchContext.switchError.value" class="text-xs text-red-600">
      {{ switchContext.switchError.value }}
    </p>
    <p v-if="cloudSync.cloudSyncError.value" class="text-xs text-red-600">
      {{ cloudSync.cloudSyncError.value }}
    </p>
    <p v-if="cloudSync.cloudSyncStatus.value" class="text-xs text-green-600">
      {{ cloudSync.cloudSyncStatus.value }}
    </p>
  </div>
</template>

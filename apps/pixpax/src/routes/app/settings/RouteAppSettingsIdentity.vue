<script setup lang="ts">
import { ref } from "vue";
import { Badge, Button, Card } from "ternent-ui/primitives";
import { useIdentitySession } from "@/modules/identity";
import { usePixpaxFamilySync } from "@/modules/family/usePixpaxFamilySync";

const identitySession = useIdentitySession();
const family = usePixpaxFamilySync();
const newChildName = ref("");

async function createChildOnDevice() {
  await family.createLocalChild(newChildName.value.trim());
  newChildName.value = "";
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
    <Card variant="showcase" padding="sm" class="space-y-5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">This device</p>
          <h2 class="m-0 text-xl font-semibold">Ready for sticker collecting</h2>
        </div>
        <Badge :tone="identitySession.hasIdentity.value ? 'success' : 'warning'" variant="soft">
          {{ identitySession.hasIdentity.value ? "Active child ready" : "No child yet" }}
        </Badge>
      </div>

      <div v-if="identitySession.identity.value" class="grid gap-3 sm:grid-cols-2">
        <label class="grid gap-2">
          <span class="text-sm font-medium">Current child</span>
          <input
            readonly
            :value="identitySession.identity.value.displayName || identitySession.identity.value.id"
            class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-sm text-[var(--ui-fg)]"
          />
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-medium">Local children on this device</span>
          <input
            readonly
            :value="String(identitySession.identities.value.length)"
            class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-sm text-[var(--ui-fg)]"
          />
        </label>
      </div>

      <div class="grid gap-2">
        <label class="grid gap-2">
          <span class="text-sm font-medium">Add another child to this device</span>
          <input
            v-model="newChildName"
            type="text"
            placeholder="e.g. Dotty"
            class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-sm text-[var(--ui-fg)]"
          />
        </label>
        <div class="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" @click="createChildOnDevice">
            Create child on this device
          </Button>
        </div>
      </div>

      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
        Kids do not need their own account. This device can hold several child profiles, and adults can save or recover them from the family backup page.
      </p>
    </Card>

    <Card variant="subtle" padding="sm" class="space-y-4">
      <div class="space-y-1">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Family space</p>
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          {{ family.account.isAuthenticated.value
            ? `Signed in as ${family.account.user.value?.email || family.account.user.value?.name || family.account.user.value?.id}`
            : "Sign in on the Family backup page to save children and open them on another device." }}
        </p>
      </div>

      <div class="rounded-3xl border border-[var(--ui-border)] bg-[rgba(255,255,255,0.03)] p-4">
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          Active family: <span class="text-[var(--ui-fg)]">{{ family.familySession.value.workspace?.name || "Not connected" }}</span>
        </p>
      </div>
    </Card>
  </div>
</template>

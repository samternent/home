<script setup lang="ts">
import { computed, ref } from "vue";
import { Badge, Button } from "ternent-ui/primitives";
import { useRunTasksSurface } from "@/modules/run/tasks/useRunTasksSurface";
import { useRunDemoIdentityModel } from "@/modules/run/tasks/useRunDemoIdentityModel";

const surface = useRunTasksSurface();
const demoIdentity = useRunDemoIdentityModel();
const actionBusy = ref<"create" | "switch" | null>(null);
const actionError = ref<string | null>(null);

const activeIdentityId = computed(
  () => demoIdentity.activeIdentity.value?.id ?? null,
);

const deviceIdentities = computed(() =>
  demoIdentity.identities.value.map((identity) => ({
    id: identity.id,
    label: identity.profile.label,
    fingerprint: identity.identity.keyId.slice(0, 12),
    ledgerUserId: `user:${identity.identity.keyId}`,
    isActive: identity.id === activeIdentityId.value,
  })),
);

const syncedDeviceIdentityIds = computed(() =>
  new Set(surface.users.value.map((user) => user.userId)),
);

async function handleCreateDemoIdentity() {
  actionError.value = null;
  actionBusy.value = "create";
  try {
    await demoIdentity.createDemoIdentity();
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  } finally {
    actionBusy.value = null;
  }
}

async function handleSwitchIdentity(identityId: string) {
  if (!identityId || identityId === activeIdentityId.value) {
    return;
  }

  actionError.value = null;
  actionBusy.value = "switch";
  try {
    await demoIdentity.switchIdentity(identityId);
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : String(error);
  } finally {
    actionBusy.value = null;
  }
}
</script>

<template>
  <section class="space-y-4">
    <div
      class="flex flex-col gap-4 rounded-[1.5rem] border border-white/12 bg-white/[0.04] px-5 py-4 lg:flex-row lg:items-start lg:justify-between"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <Badge tone="neutral" variant="soft">
          device {{ deviceIdentities.length }}
        </Badge>
        <Badge tone="neutral" variant="soft">
          ledger {{ surface.users.value.length }}
        </Badge>
        <Badge
          v-if="surface.hasHiddenProtectedEntries.value"
          tone="warning"
          variant="soft"
        >
          access partial
        </Badge>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            v-if="surface.mode.value === 'unavailable'"
            tone="critical"
            variant="soft"
          >
            unavailable
          </Badge>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          size="sm"
          class="rounded-lg"
          :disabled="actionBusy === 'create'"
          @click="handleCreateDemoIdentity"
        >
          {{ actionBusy === "create" ? "Creating..." : "New demo user" }}
        </Button>
      </div>
    </div>

    <div
      v-if="actionError"
      class="rounded-[1.5rem] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-5 py-4 text-sm text-[var(--ui-critical)]"
    >
      {{ actionError }}
    </div>

    <div
      class="overflow-hidden rounded-[1.5rem] border border-white/12 bg-white/[0.04]"
    >
      <div
        class="grid grid-cols-[minmax(0,1fr)_120px_140px] gap-4 border-b border-white/10 px-5 py-3 text-[11px] uppercase tracking-[0.1em] text-white/45"
      >
        <span>Device user</span>
        <span>Fingerprint</span>
        <span class="text-right">Switch</span>
      </div>

      <div class="divide-y divide-white/8">
        <div
          v-for="identity in deviceIdentities"
          :key="identity.id"
          class="grid grid-cols-[minmax(0,1fr)_120px_140px] items-center gap-4 px-5 py-4"
        >
          <div class="min-w-0">
            <p class="m-0 truncate text-[15px] text-white">
              {{ identity.label }}
            </p>
            <p class="m-0 mt-1 text-xs text-white/45">
              {{
                syncedDeviceIdentityIds.has(identity.ledgerUserId)
                  ? "Present in this ledger"
                  : "Not yet added to this ledger"
              }}
            </p>
          </div>
          <p class="m-0 truncate text-xs text-white/60">
            {{ identity.fingerprint }}
          </p>
          <div class="text-right">
            <Badge v-if="identity.isActive" tone="success" variant="soft">
              Active
            </Badge>
            <Button
              v-else
              size="sm"
              variant="plain-secondary"
              class="rounded-lg border border-white/15 bg-white/8 text-white hover:bg-white/12"
              :disabled="actionBusy === 'switch'"
              @click="handleSwitchIdentity(identity.id)"
            >
              {{ actionBusy === "switch" ? "Switching..." : "Switch" }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="surface.mode.value === 'unavailable'"
      class="rounded-[1.5rem] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-5 py-4 text-sm text-[var(--ui-critical)]"
    >
      {{ surface.reason.value }}
    </div>

    <template v-else>
      <div
        class="rounded-[1.5rem] border border-white/12 bg-white/[0.04] px-5 py-4 text-sm text-white/65"
      >
        {{ surface.accessSummary.value }}
      </div>

      <div
        v-if="!surface.users.value.length"
        class="rounded-[1.5rem] border border-dashed border-white/14 px-5 py-8 text-center"
      >
        <div class="mx-auto flex max-w-2xl flex-col items-center gap-3">
          <p class="m-0 text-sm text-white/65">No ledger users</p>
        </div>
      </div>

      <div
        v-else
        class="overflow-hidden rounded-[1.5rem] border border-white/12 bg-white/[0.04]"
      >
        <div
          class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-white/10 px-5 py-3 text-[11px] uppercase tracking-[0.1em] text-white/45"
        >
          <span>Ledger user</span>
          <span>Identity key</span>
          <span>Encryption recipient</span>
        </div>

        <div class="divide-y divide-white/8">
          <div
            v-for="user in surface.users.value"
            :key="user.userId"
            class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 px-5 py-4"
          >
            <div class="min-w-0">
              <p class="m-0 truncate text-[15px] text-white">
                {{ user.name }}
              </p>
            </div>
            <details class="text-xs text-white/60">
              <summary class="cursor-pointer select-none">
                {{ user.publicIdentityKey ? "Show identity key" : "No identity key" }}
              </summary>
              <p class="m-0 mt-2 break-all">
                {{ user.publicIdentityKey || "None" }}
              </p>
            </details>
            <details class="text-xs text-white/60">
              <summary class="cursor-pointer select-none">
                {{ user.publicEncryptionKey ? "Show encryption key" : "No encryption key" }}
              </summary>
              <p class="m-0 mt-2 break-all">
                {{ user.publicEncryptionKey || "None" }}
              </p>
            </details>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

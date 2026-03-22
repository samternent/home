<script setup lang="ts">
import { computed } from "vue";
import { Button, Card } from "ternent-ui/primitives";
import { useIdentitySession } from "@/modules/identity";
import { usePixpaxFamilySync } from "@/modules/family/usePixpaxFamilySync";

const identities = useIdentitySession();
const family = usePixpaxFamilySync();

const activeChildLabel = computed(
  () => family.activeManagedUser.value?.displayName || identities.identity.value?.displayName || "Current child",
);
</script>

<template>
  <div class="space-y-6">
    <Card variant="showcase" padding="sm" class="space-y-5">
      <div class="space-y-1">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Family backup</p>
        <h2 class="m-0 text-xl font-semibold">Keep children safe across devices</h2>
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          Adults sign in. Children do not. Save child identities and Pixbooks to the family space, then open them on another trusted device when needed.
        </p>
      </div>

      <div v-if="family.account.isAuthenticated.value" class="space-y-3">
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          Signed in as
          <span class="text-[var(--ui-fg)]">{{ family.account.user.value?.email || family.account.user.value?.name || family.account.user.value?.id }}</span>
        </p>
        <div class="flex flex-wrap gap-2">
          <Button size="sm" variant="plain-secondary" @click="family.registerPasskeyForAccount()">
            Add passkey to this device
          </Button>
          <Button size="sm" variant="plain-secondary" @click="family.signOutAccount()">
            Sign out
          </Button>
        </div>
      </div>

      <div v-else class="grid gap-3">
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          Adults sign in here to unlock family backup. Children stay local and never need their own account.
        </p>
        <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            v-model="family.authEmail.value"
            type="email"
            placeholder="Parent email"
            class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-sm text-[var(--ui-fg)]"
          />
          <Button size="sm" variant="secondary" :disabled="family.authBusy.value" @click="family.sendOtpCode()">
            Email code
          </Button>
        </div>
        <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            v-model="family.authOtp.value"
            inputmode="numeric"
            autocomplete="one-time-code"
            placeholder="6-digit code"
            class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-sm text-[var(--ui-fg)]"
          />
          <Button size="sm" variant="plain-secondary" :disabled="family.authBusy.value" @click="family.submitOtpCode()">
            Sign in
          </Button>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button size="sm" variant="plain-secondary" :disabled="family.authBusy.value" @click="family.signInWithPasskey()">
            Use passkey
          </Button>
        </div>
      </div>

      <p v-if="family.authMessage.value" class="m-0 text-sm text-[var(--ui-fg-muted)]">{{ family.authMessage.value }}</p>
    </Card>

    <Card variant="subtle" padding="sm" class="space-y-4">
      <div class="space-y-1">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Recovery passphrase</p>
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          This passphrase encrypts child identity backups before they leave the device.
        </p>
      </div>

      <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          v-model="family.recoveryPassphrase.value"
          type="password"
          placeholder="Recovery passphrase"
          class="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-sm text-[var(--ui-fg)]"
        />
        <Button size="sm" variant="secondary" @click="family.unlockRecoveryPassphrase(family.recoveryPassphrase.value)">
          Unlock
        </Button>
        <Button size="sm" variant="plain-secondary" @click="family.clearRecoveryPassphrase()">
          Clear
        </Button>
      </div>

      <p class="m-0 text-sm" :class="family.recoveryPassphraseUnlocked.value ? 'text-[var(--ui-accent)]' : 'text-[var(--ui-fg-muted)]'">
        {{ family.recoveryPassphraseUnlocked.value ? "Passphrase unlocked for this session." : "Passphrase locked. Child key backup is paused." }}
      </p>
    </Card>

    <Card variant="subtle" padding="sm" class="space-y-4">
      <div class="space-y-1">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Current child</p>
        <h3 class="m-0 text-lg font-semibold">{{ activeChildLabel }}</h3>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" @click="family.saveLocalIdentityToFamily()">
          Save child to family
        </Button>
        <Button size="sm" variant="plain-secondary" @click="family.backupLocalIdentityToFamily()">
          Back up child keys
        </Button>
        <Button size="sm" variant="plain-secondary" @click="family.saveActivePixbookSnapshot()">
          Save current Pixbook
        </Button>
      </div>

      <div class="rounded-3xl border border-[var(--ui-border)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-[var(--ui-fg-muted)]">
        <p class="m-0">
          Last family save:
          <span class="text-[var(--ui-fg)]">{{ family.snapshotState.value.savedAt || "Not saved yet" }}</span>
        </p>
        <p class="m-0">
          Family copy:
          <span class="text-[var(--ui-fg)]">{{ family.isSnapshotDirty.value ? "Needs save" : "Up to date" }}</span>
        </p>
      </div>

      <p v-if="family.familyError.value" class="m-0 text-sm text-[var(--ui-danger)]">{{ family.familyError.value }}</p>
      <p v-else-if="family.familyStatus.value" class="m-0 text-sm text-[var(--ui-fg-muted)]">{{ family.familyStatus.value }}</p>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import IdentityAvatar from "../../../module/identity/IdentityAvatar.vue";
import { usePixpaxCloudSync } from "../../../module/pixpax/context/usePixpaxCloudSync";
import { usePixpaxContextStore } from "../../../module/pixpax/context/usePixpaxContextStore";
import { usePixpaxSwitchContext } from "../../../module/pixpax/context/usePixpaxSwitchContext";

const context = usePixpaxContextStore();
const cloudSync = usePixpaxCloudSync();
const switchContext = usePixpaxSwitchContext();

const profileHandle = shallowRef(context.currentIdentityUsername.value || "");
const candidateIdentity = computed(
  () => context.candidateIdentities.value[0] || null
);

function getIdentityName(entry: { metadata?: Record<string, unknown> } | null) {
  const username = String(entry?.metadata?.username || "").trim();
  return username ? `@${username}` : "Identity";
}

watch(
  () => context.currentIdentityId.value,
  () => {
    profileHandle.value = context.currentIdentityUsername.value || "";
  }
);

async function createCandidate() {
  await context.createIdentityCandidate();
}

async function confirmCandidate() {
  if (!candidateIdentity.value) return;
  await context.confirmIdentityCandidate(candidateIdentity.value.id);
}

function discardCandidate() {
  if (!candidateIdentity.value) return;
  context.discardIdentityCandidate(candidateIdentity.value.id);
}

function setIdentityUsername(
  identityId: string,
  metadata: Record<string, unknown> | undefined
) {
  const currentUsername = String(metadata?.username || "").trim();
  const next = window.prompt("Identity username", currentUsername);
  if (next === null) return;
  context.setIdentityUsername(identityId, next.trim());
}

async function removeIdentity(identityId: string) {
  const entry = context.identities.value.find((candidate) => candidate.id === identityId);
  if (!entry) return;
  if (!cloudSync.account.isAuthenticated.value) {
    context.setError("Sign in with your account to remove identities.");
    return;
  }

  const cloudIdentity = cloudSync.cloudProfiles.value.find((candidate) => {
    const profileId = String(candidate.profileId || "").trim();
    const identityPublicKey = String(candidate.identityPublicKey || "").trim();
    return (
      profileId === String(entry.profileId || "").trim() &&
      identityPublicKey === String(entry.publicKeyPEM || "").trim()
    );
  });

  if (!cloudIdentity) {
    context.setError(
      "This identity is not synced to your account yet. Save/sync it first before backend removal."
    );
    return;
  }

  const confirmed = window.confirm(
    "Remove this identity from your account? This is a backend action and removes its account pixbook."
  );
  if (!confirmed) return;
  try {
    const ok = await cloudSync.removeCloudIdentity(cloudIdentity.id);
    if (ok) {
      context.setStatus("Identity removed from account.");
    }
  } catch (error: unknown) {
    context.setError(String((error as Error)?.message || "Unable to remove identity from account."));
  }
}

async function switchIdentity(identityId: string) {
  await switchContext.switchIdentity(identityId);
}

function saveHandle() {
  context.setProfileHandle(profileHandle.value);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-lg font-semibold">Identity & Devices</h1>
    <p class="text-xs text-[var(--ui-fg-muted)]">
      This identity owns your packs. Changing identity changes ownership context.
    </p>

    <section class="rounded-lg border border-[var(--ui-border)] p-3 flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <IdentityAvatar :identity="context.publicKeyPEM.value" size="sm" />
        <div>
          <p class="text-sm font-semibold">
            {{ context.currentIdentityUsername.value ? `@${context.currentIdentityUsername.value}` : "Identity" }}
          </p>
        </div>
      </div>
      <div class="grid gap-2 md:grid-cols-2">
        <input
          v-model="profileHandle"
          type="text"
          class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 text-xs"
          placeholder="Display handle"
        />
        <button
          type="button"
          class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5"
          @click="saveHandle"
        >
          Save display handle
        </button>
      </div>
    </section>

    <section class="rounded-lg border border-[var(--ui-border)] p-3 flex flex-col gap-3">
      <h2 class="text-sm font-semibold">Account Session</h2>
      <p v-if="cloudSync.account.isAuthenticated.value" class="text-xs text-green-600">
        Signed in as {{ cloudSync.account.user.value?.email || cloudSync.account.user.value?.name || cloudSync.account.user.value?.id }}
      </p>
      <template v-if="!cloudSync.account.isAuthenticated.value">
        <input
          v-model="cloudSync.authEmail.value"
          type="email"
          class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 text-xs"
          placeholder="Email"
        />
        <div class="grid gap-2 md:grid-cols-3">
          <input
            v-model="cloudSync.authOtp.value"
            type="text"
            class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 text-xs"
            placeholder="6-digit code"
          />
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
            :disabled="cloudSync.authBusy.value"
            @click="cloudSync.sendOtpCode()"
          >
            Send code
          </button>
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
            :disabled="cloudSync.authBusy.value"
            @click="cloudSync.submitOtpCode()"
          >
            Verify code
          </button>
        </div>
        <button
          type="button"
          class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
          :disabled="cloudSync.authBusy.value || !cloudSync.canUsePasskey.value"
          @click="cloudSync.signInWithPasskey()"
        >
          Sign in with passkey
        </button>
      </template>
      <template v-else>
        <div class="grid gap-2 md:grid-cols-2">
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
            :disabled="cloudSync.authBusy.value || !cloudSync.canUsePasskey.value"
            @click="cloudSync.registerPasskeyForAccount()"
          >
            Add passkey to this device
          </button>
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
            :disabled="cloudSync.authBusy.value"
            @click="cloudSync.signOutAccount()"
          >
            Sign out
          </button>
        </div>
      </template>
      <p v-if="cloudSync.authMessage.value" class="text-xs text-[var(--ui-fg-muted)]">
        {{ cloudSync.authMessage.value }}
      </p>
    </section>

    <section class="rounded-lg border border-[var(--ui-border)] p-3 flex flex-col gap-2">
      <h2 class="text-sm font-semibold">Create New Identity</h2>
      <p class="text-xs text-amber-600">
        Create new identity (new avatar, new ownership). A new identity will not own packs issued to your current identity.
      </p>
      <p class="text-xs text-[var(--ui-fg-muted)]">
        Preview avatars by refreshing. Creating saves a new identity and does not switch to it automatically.
      </p>
      <div
        v-if="!candidateIdentity"
        class="rounded-md border border-[var(--ui-border)] p-3 flex flex-col items-center gap-3"
      >
        <button
          type="button"
          class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5"
          @click="createCandidate"
        >
          Generate avatar preview
        </button>
      </div>
      <div
        v-else
        class="rounded-md border border-[var(--ui-border)] p-3 flex flex-col items-center gap-3"
      >
        <IdentityAvatar :identity="candidateIdentity.publicKeyPEM" size="xl" />
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5"
            @click="createCandidate"
          >
            Refresh avatar
          </button>
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5"
            @click="confirmCandidate"
          >
            Create identity
          </button>
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5"
            @click="discardCandidate"
          >
            Clear preview
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-lg border border-[var(--ui-border)] p-3 flex flex-col gap-2">
      <h2 class="text-sm font-semibold">Manage Identities</h2>
      <p class="text-xs text-[var(--ui-fg-muted)]">
        Identity management is account-backed. Removed identities stay removed from your account unless you explicitly add them again.
      </p>
      <button
        type="button"
        class="w-fit rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
        :disabled="!cloudSync.account.isAuthenticated.value || cloudSync.identityDirectorySyncing.value"
        @click="cloudSync.syncLocalIdentitiesToCloud()"
      >
        {{ cloudSync.identityDirectorySyncing.value ? "Syncing identities..." : "Sync identities to account" }}
      </button>
      <div
        v-for="entry in context.identities.value"
        :key="entry.id"
        class="rounded-md border border-[var(--ui-border)] p-2 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3">
          <IdentityAvatar :identity="entry.publicKeyPEM" size="sm" />
          <p class="text-xs font-semibold">
            {{ getIdentityName(entry) }}
            <span v-if="entry.id === context.currentIdentityId.value" class="text-[11px] text-[var(--ui-fg-muted)]">(current)</span>
          </p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="entry.id !== context.currentIdentityId.value"
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5"
            @click="switchIdentity(entry.id)"
          >
            Switch
          </button>
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5"
            @click="setIdentityUsername(entry.id, entry.metadata)"
          >
            Username
          </button>
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs text-red-600 hover:bg-[var(--ui-critical)]/10 disabled:opacity-50"
            :disabled="!cloudSync.account.isAuthenticated.value"
            @click="removeIdentity(entry.id)"
          >
            Remove from account
          </button>
        </div>
      </div>
    </section>

    <p v-if="context.errorMessage.value" class="text-xs text-red-600">{{ context.errorMessage.value }}</p>
    <p v-if="cloudSync.identityDirectorySyncError.value" class="text-xs text-red-600">
      {{ cloudSync.identityDirectorySyncError.value }}
    </p>
    <p v-if="cloudSync.identityDirectorySyncStatus.value" class="text-xs text-green-600">
      {{ cloudSync.identityDirectorySyncStatus.value }}
    </p>
    <p v-if="context.statusMessage.value" class="text-xs text-green-600">{{ context.statusMessage.value }}</p>
  </div>
</template>

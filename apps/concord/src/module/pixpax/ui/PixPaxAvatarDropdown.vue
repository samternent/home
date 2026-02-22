<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import IdentityAvatar from "../../identity/IdentityAvatar.vue";
import { usePixpaxCloudSync } from "../context/usePixpaxCloudSync";
import { usePixpaxContextStore } from "../context/usePixpaxContextStore";
import { usePixpaxSwitchContext } from "../context/usePixpaxSwitchContext";

const context = usePixpaxContextStore();
const cloudSync = usePixpaxCloudSync();
const switchContext = usePixpaxSwitchContext();

const menuRef = shallowRef<HTMLElement | null>(null);
const menuOpen = shallowRef(false);
const identitiesOpen = shallowRef(false);
const pixbooksOpen = shallowRef(false);

function getIdentityName(entry: { metadata?: Record<string, unknown> } | null) {
  const username = String(entry?.metadata?.username || "").trim();
  return username ? `@${username}` : "Identity";
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

onClickOutside(menuRef, () => {
  menuOpen.value = false;
  identitiesOpen.value = false;
  pixbooksOpen.value = false;
});

const sortedIdentities = computed(() => {
  return [...context.identities.value].sort((a, b) =>
    getIdentityName(a).localeCompare(getIdentityName(b)),
  );
});

const currentIdentity = computed(
  () =>
    context.identities.value.find(
      (entry) => entry.id === context.currentIdentityId.value,
    ) || null,
);

const canSwitchPixbook = computed(
  () => context.activeIdentityPixbooks.value.length > 1,
);

async function handleSwitchIdentity(identityId: string) {
  if (identityId === context.currentIdentityId.value) return;
  await switchContext.switchIdentity(identityId);
  menuOpen.value = false;
}

async function handleSwitchPixbook(pixbookId: string) {
  if (pixbookId === context.currentPixbookId.value) return;
  await switchContext.switchPixbook(pixbookId);
  menuOpen.value = false;
}

async function handleSignOut() {
  await cloudSync.signOutAccount();
  menuOpen.value = false;
}
</script>

<template>
  <div ref="menuRef" class="relative flex justify-end items-center">
    <button
      @click="toggleMenu"
      class="flex items-center gap-2"
      :class="{ active: menuOpen }"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-3 h-3 ml-1 transition-transform"
        :class="{ 'rotate-180': menuOpen }"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
        />
      </svg>
      <div
        class="rounded-full overflow-hidden border border-[var(--ui-border)]"
      >
        <IdentityAvatar :identity="context.publicKeyPEM.value" size="sm" />
      </div>
      <span
        v-if="context.pixbookReadOnly.value"
        class="text-[10px] uppercase tracking-wide text-amber-600 border border-amber-600/30 rounded-full px-2 py-0.5"
      >
        read-only
      </span>
    </button>

    <div
      v-if="menuOpen"
      class="border border-[var(--ui-border)] absolute p-3 bg-[var(--ui-surface)] rounded mt-2 w-[24rem] right-0 shadow top-12 max-h-[80vh] overflow-auto"
    >
      <div class="flex flex-col gap-3 py-1">
        <div
          class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)]/50 p-3"
        >
          <div class="flex items-center gap-3">
            <IdentityAvatar :identity="context.publicKeyPEM.value" size="sm" />
            <div class="flex flex-col min-w-0">
              <span
                class="text-[10px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
              >
                Identity
              </span>
              <span class="text-xs font-semibold truncate">
                {{
                  context.currentIdentityUsername.value
                    ? `@${context.currentIdentityUsername.value}`
                    : getIdentityName(currentIdentity)
                }}
              </span>
              <span class="text-[11px] text-[var(--ui-fg-muted)]">
                {{ context.currentPixbookLabel.value }}
              </span>
            </div>
          </div>
        </div>

        <section class="rounded-md border border-[var(--ui-border)] p-2">
          <button
            type="button"
            class="w-full text-left text-xs px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5"
            @click="identitiesOpen = !identitiesOpen"
          >
            Switch Identity...
          </button>
          <div v-if="identitiesOpen" class="mt-2 flex flex-col gap-1">
            <button
              v-for="entry in sortedIdentities"
              :key="entry.id"
              type="button"
              class="w-full text-left text-xs px-2 py-2 rounded-md border border-transparent hover:border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5"
              :class="{
                'bg-[var(--ui-fg)]/10 border-[var(--ui-border)]':
                  entry.id === context.currentIdentityId.value,
              }"
              :disabled="switchContext.switchBusy.value"
              @click="handleSwitchIdentity(entry.id)"
            >
              <span class="font-semibold">{{ getIdentityName(entry) }}</span>
            </button>
          </div>
        </section>

        <section
          v-if="canSwitchPixbook"
          class="rounded-md border border-[var(--ui-border)] p-2"
        >
          <button
            type="button"
            class="w-full text-left text-xs px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5"
            @click="pixbooksOpen = !pixbooksOpen"
          >
            Switch Pixbook...
          </button>
          <div v-if="pixbooksOpen" class="mt-2 flex flex-col gap-1">
            <button
              v-for="entry in context.activeIdentityPixbooks.value"
              :key="entry.id"
              type="button"
              class="w-full text-left text-xs px-2 py-2 rounded-md border border-transparent hover:border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5"
              :class="{
                'bg-[var(--ui-fg)]/10 border-[var(--ui-border)]':
                  entry.id === context.currentPixbookId.value,
              }"
              :disabled="switchContext.switchBusy.value"
              @click="handleSwitchPixbook(entry.id)"
            >
              <span class="font-semibold">{{ entry.name }}</span>
              <span
                v-if="entry.isDefault"
                class="text-[11px] text-[var(--ui-fg-muted)]"
              >
                · default</span
              >
            </button>
          </div>
        </section>

        <RouterLink
          :to="{ name: 'pixpax-my-collections' }"
          class="w-full text-left text-xs px-3 py-2 rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 transition-colors"
          >My Collections</RouterLink
        >
        <RouterLink
          :to="{ name: 'pixpax-settings-home' }"
          class="w-full text-left text-xs px-3 py-2 rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 transition-colors"
        >
          Settings...
        </RouterLink>

        <button
          type="button"
          class="w-full text-left text-xs px-3 py-2 rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 transition-colors disabled:opacity-50"
          :disabled="cloudSync.authBusy.value"
          @click="handleSignOut"
        >
          {{ cloudSync.authBusy.value ? "Signing out..." : "Sign out" }}
        </button>

        <p
          v-if="switchContext.switchMessage.value"
          class="text-xs text-green-600"
        >
          {{ switchContext.switchMessage.value }}
        </p>
        <p
          v-if="switchContext.switchWarning.value"
          class="text-xs text-amber-600"
        >
          {{ switchContext.switchWarning.value }}
        </p>
        <p v-if="switchContext.switchError.value" class="text-xs text-red-600">
          {{ switchContext.switchError.value }}
        </p>
      </div>
    </div>
  </div>
</template>

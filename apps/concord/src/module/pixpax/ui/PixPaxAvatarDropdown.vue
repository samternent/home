<script setup lang="ts">
import { computed, nextTick, shallowRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useRouter } from "vue-router";
import IdentityAvatar from "../../identity/IdentityAvatar.vue";
import { usePixpaxAuth } from "../auth/usePixpaxAuth";
import { usePixpaxCloudSync } from "../context/usePixpaxCloudSync";
import { usePixpaxContextStore } from "../context/usePixpaxContextStore";
import { usePixpaxSwitchContext } from "../context/usePixpaxSwitchContext";

const context = usePixpaxContextStore();
const cloudSync = usePixpaxCloudSync();
const switchContext = usePixpaxSwitchContext();
const auth = usePixpaxAuth();
const router = useRouter();

const menuRef = shallowRef<HTMLElement | null>(null);
const triggerRef = shallowRef<HTMLButtonElement | null>(null);
const menuOpen = shallowRef(false);
const menuView = shallowRef<"main" | "identity-switch" | "settings">("main");
const identitySearch = shallowRef("");
const switchError = shallowRef("");
const switchingIdentityId = shallowRef("");
const switchingBookId = shallowRef("");
const advancedOpen = shallowRef(false);
const dangerModalOpen = shallowRef(false);
const dangerConfirmText = shallowRef("");

function trim(value: unknown) {
  return String(value || "").trim();
}

function displayHandle(value: string) {
  const normalized = trim(value);
  if (!normalized) return "@identity";
  return normalized.startsWith("@") ? normalized : `@${normalized}`;
}

function identityBindingKey(profileId: unknown, identityPublicKey: unknown) {
  const normalizedProfileId = trim(profileId);
  const normalizedIdentityPublicKey = trim(identityPublicKey);
  if (!normalizedProfileId || !normalizedIdentityPublicKey) return "";
  return `${normalizedProfileId}::${normalizedIdentityPublicKey}`;
}

const isAuthenticated = computed(() => cloudSync.account.isAuthenticated.value);

const accountNod = computed(() => {
  const user = cloudSync.account.user.value;
  return trim(user?.email) || trim(user?.name) || trim(user?.id) || "account";
});

const persistedIdentities = computed(() => {
  const localIdentityByBinding = new Map<
    string,
    { id: string; publicKeyPEM: string }
  >();
  for (const identity of context.identities.value) {
    const key = identityBindingKey(identity.profileId, identity.publicKeyPEM);
    if (!key) continue;
    localIdentityByBinding.set(key, {
      id: trim(identity.id),
      publicKeyPEM: trim(identity.publicKeyPEM),
    });
  }

  const booksByIdentity = new Map<string, number>();
  for (const book of cloudSync.cloudBooks.value) {
    if (trim(book.status) === "deleted") continue;
    if (trim(book.collectionId) !== trim(cloudSync.activeCollectionId.value)) continue;
    const key = trim(book.managedUserId);
    if (!key) continue;
    booksByIdentity.set(key, (booksByIdentity.get(key) || 0) + 1);
  }

  return cloudSync.cloudProfiles.value
    .filter((entry) => trim(entry.status) !== "deleted")
    .map((entry) => {
      const name = trim(entry.displayName) || entry.id;
      const bindingKey = identityBindingKey(entry.profileId, entry.identityPublicKey);
      const localMatch = bindingKey ? localIdentityByBinding.get(bindingKey) || null : null;
      const localIdentityId = trim(localMatch?.id);
      const avatarIdentity =
        trim(localMatch?.publicKeyPEM) ||
        trim(entry.identityPublicKey) ||
        `account:${trim(entry.id)}`;
      return {
        id: trim(entry.id),
        handle: displayHandle(name),
        label: name,
        bookCount: booksByIdentity.get(trim(entry.id)) || 0,
        localIdentityId,
        avatarIdentity,
        isLocal: Boolean(localIdentityId),
      };
    })
    .sort((a, b) => a.handle.localeCompare(b.handle));
});

const filteredIdentities = computed(() => {
  const query = trim(identitySearch.value).toLowerCase();
  if (!query) return persistedIdentities.value;
  return persistedIdentities.value.filter((entry) => {
    return (
      entry.handle.toLowerCase().includes(query) ||
      entry.label.toLowerCase().includes(query) ||
      entry.id.toLowerCase().includes(query)
    );
  });
});

const activeIdentity = computed(() => {
  const selectedId = trim(cloudSync.selectedCloudProfileId.value);
  return persistedIdentities.value.find((entry) => entry.id === selectedId) || null;
});

const activeBookId = computed(() =>
  trim(cloudSync.selectedCloudBookId.value || cloudSync.cloudBookId.value)
);

const filteredBooks = computed(() => {
  const profileId = trim(cloudSync.selectedCloudProfileId.value);
  return cloudSync.cloudBooks.value
    .filter((entry) => {
      if (trim(entry.status) === "deleted") return false;
      if (trim(entry.collectionId) !== trim(cloudSync.activeCollectionId.value)) return false;
      if (!profileId) return true;
      return trim(entry.managedUserId) === profileId;
    })
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
});

const statusLine = computed(() => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "Offline";
  if (trim(cloudSync.cloudSyncError.value)) return "Attention needed";
  if (cloudSync.cloudSyncing.value) return "Saving progress...";
  const at = trim(cloudSync.cloudSnapshotAt.value);
  if (!at) return "Ready";
  const parsed = new Date(at);
  if (Number.isNaN(parsed.getTime())) return "Ready";
  const minutes = Math.max(0, Math.round((Date.now() - parsed.getTime()) / 60000));
  if (minutes < 1) return "Last sync: now";
  if (minutes < 60) return `Last sync: ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `Last sync: ${hours}h ago`;
});

function openMenu() {
  menuOpen.value = true;
  menuView.value = "main";
  switchError.value = "";
  nextTick(() => focusFirstMenuItem());
}

function closeMenu() {
  menuOpen.value = false;
  menuView.value = "main";
  identitySearch.value = "";
  switchError.value = "";
  advancedOpen.value = false;
  dangerModalOpen.value = false;
  dangerConfirmText.value = "";
}

function toggleMenu() {
  if (menuOpen.value) {
    closeMenu();
    return;
  }
  openMenu();
}

onClickOutside(menuRef, () => {
  closeMenu();
});

function menuItems() {
  const root = menuRef.value;
  if (!root) return [] as HTMLElement[];
  return Array.from(
    root.querySelectorAll<HTMLElement>("[data-menu-focusable='true']:not([disabled])")
  );
}

function focusFirstMenuItem() {
  const items = menuItems();
  if (!items.length) return;
  items[0].focus();
}

function focusNextMenuItem(direction: 1 | -1) {
  const items = menuItems();
  if (!items.length) return;
  const active = document.activeElement as HTMLElement | null;
  const currentIndex = Math.max(
    0,
    items.findIndex((entry) => entry === active)
  );
  const nextIndex = (currentIndex + direction + items.length) % items.length;
  items[nextIndex].focus();
}

function onMenuKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  const isTextInput =
    target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
    triggerRef.value?.focus();
    return;
  }
  if (isTextInput && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    focusNextMenuItem(1);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    focusNextMenuItem(-1);
    return;
  }
  if (event.key === "Tab") {
    const items = menuItems();
    if (!items.length) return;
    const active = document.activeElement as HTMLElement | null;
    const currentIndex = items.findIndex((entry) => entry === active);
    const direction: 1 | -1 = event.shiftKey ? -1 : 1;
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + direction + items.length) % items.length;
    event.preventDefault();
    items[nextIndex].focus();
  }
}

async function goTo(routeName: string) {
  await router.push({ name: routeName });
  closeMenu();
}

function openIdentitySwitch() {
  menuView.value = "identity-switch";
  switchError.value = "";
  nextTick(() => focusFirstMenuItem());
}

function openSettingsPanel() {
  menuView.value = "settings";
  switchError.value = "";
  nextTick(() => focusFirstMenuItem());
}

function backToMain() {
  menuView.value = "main";
  switchError.value = "";
  nextTick(() => focusFirstMenuItem());
}

async function handleSelectIdentity(identityId: string) {
  const targetId = trim(identityId);
  const selected = persistedIdentities.value.find((entry) => entry.id === targetId);
  const localIdentityId = trim(selected?.localIdentityId);
  const alreadySelectedCloud = targetId === trim(cloudSync.selectedCloudProfileId.value);
  const alreadySelectedLocal =
    !localIdentityId || localIdentityId === trim(context.currentIdentityId.value);
  if (!targetId || (alreadySelectedCloud && alreadySelectedLocal)) {
    menuView.value = "main";
    return;
  }
  switchingIdentityId.value = targetId;
  switchError.value = "";
  try {
    if (!localIdentityId) {
      switchError.value =
        "This account identity is not available on this device yet. Use Identity & Devices to create or recover it locally.";
      return;
    }

    const switched = await switchContext.switchIdentity(localIdentityId);
    if (!switched.ok) {
      switchError.value =
        trim(switched.error) || trim(switchContext.switchError.value) || "Couldn’t switch identity. Try again.";
      return;
    }

    const ok = await cloudSync.selectCloudProfile(targetId);
    if (!ok) {
      switchError.value =
        trim(cloudSync.cloudSyncError.value) || "Couldn’t switch identity. Try again.";
      return;
    }
    cloudSync.cloudSyncStatus.value = `Switched identity to ${selected?.handle || "@identity"}.`;
    closeMenu();
  } catch (error: unknown) {
    switchError.value = String((error as Error)?.message || "Couldn’t switch identity. Try again.");
  } finally {
    switchingIdentityId.value = "";
  }
}

async function handleSelectBook(bookId: string) {
  const targetId = trim(bookId);
  if (!targetId || targetId === activeBookId.value) return;
  switchingBookId.value = targetId;
  switchError.value = "";
  try {
    const ok = await cloudSync.selectCloudBook(targetId);
    if (!ok) {
      switchError.value =
        trim(cloudSync.cloudSyncError.value) || "Couldn’t open pixbook. Try again.";
      return;
    }
    closeMenu();
  } catch (error: unknown) {
    switchError.value = String((error as Error)?.message || "Couldn’t open pixbook. Try again.");
  } finally {
    switchingBookId.value = "";
  }
}

async function handleSignOut() {
  await cloudSync.signOutAccount();
  closeMenu();
}

function canOpenDangerZone() {
  return trim(dangerConfirmText.value).toUpperCase() === "RESET";
}

async function handleDangerConfirm() {
  if (!canOpenDangerZone()) return;
  await goTo("pixpax-settings-danger");
}

</script>

<template>
  <div ref="menuRef" class="relative flex justify-end items-center">
    <button
      ref="triggerRef"
      type="button"
      class="flex items-center gap-2"
      :class="{ active: menuOpen }"
      aria-haspopup="menu"
      :aria-expanded="menuOpen ? 'true' : 'false'"
      @click="toggleMenu"
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
      <div class="rounded-full overflow-hidden border border-[var(--ui-border)]">
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
      class="border border-[var(--ui-border)] absolute p-3 bg-[var(--ui-surface)] rounded mt-2 w-[22rem] right-0 shadow top-12 max-h-[80vh] overflow-auto focus:outline-none"
      role="menu"
      aria-label="PixPax user menu"
      @keydown="onMenuKeydown"
    >
      <template v-if="menuView === 'main'">
        <div class="flex flex-col gap-3 py-1">
          <section class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)]/50 p-3">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <IdentityAvatar :identity="context.publicKeyPEM.value" size="sm" />
                <div class="min-w-0">
                  <p class="text-xs font-semibold truncate">
                    {{ context.currentIdentityLabel.value || activeIdentity?.handle || "@identity" }}
                  </p>
                  <p class="text-[11px] text-[var(--ui-fg-muted)]">Identity</p>
                </div>
              </div>
              <button
                v-if="isAuthenticated"
                type="button"
                class="text-xs rounded-md border border-[var(--ui-border)] px-2 py-1 hover:bg-[var(--ui-fg)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-fg)]"
                role="menuitem"
                data-menu-focusable="true"
                @click="openIdentitySwitch"
              >
                Switch
              </button>
            </div>
            <p v-if="isAuthenticated" class="mt-2 text-[11px] text-[var(--ui-fg-muted)] truncate" :title="accountNod">
              Signed in as {{ accountNod }}
            </p>
          </section>

          <template v-if="isAuthenticated">
            <section class="rounded-md border border-[var(--ui-border)] p-2">
              <p class="px-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">Pixbooks</p>
              <div class="max-h-36 overflow-auto flex flex-col gap-1">
                <button
                  v-for="book in filteredBooks"
                  :key="book.id"
                  type="button"
                  class="w-full text-left text-xs px-2 py-2 rounded-md border border-transparent hover:border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-fg)]"
                  role="menuitemradio"
                  :aria-checked="book.id === activeBookId"
                  :class="{
                    'bg-[var(--ui-fg)]/10 border-[var(--ui-border)]': book.id === activeBookId,
                  }"
                  :disabled="Boolean(switchingBookId)"
                  data-menu-focusable="true"
                  @click="handleSelectBook(book.id)"
                >
                  <span class="font-semibold">{{ book.name }}</span>
                </button>
              </div>
            </section>

            <section class="rounded-md border border-[var(--ui-border)] p-2">
              <RouterLink
                :to="{ name: 'pixpax-my-collections' }"
                class="block w-full text-left text-xs px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-fg)]"
                role="menuitem"
                data-menu-focusable="true"
                @click="closeMenu"
              >
                My collections
              </RouterLink>
              <RouterLink
                :to="{ name: 'pixpax-settings-import-export' }"
                class="block w-full text-left text-xs px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-fg)]"
                role="menuitem"
                data-menu-focusable="true"
                @click="closeMenu"
              >
                Import / Export
              </RouterLink>
              <button
                type="button"
                class="w-full text-left text-xs px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-fg)]"
                role="menuitem"
                data-menu-focusable="true"
                @click="openSettingsPanel"
              >
                Settings...
              </button>
            </section>

            <section class="rounded-md border border-[var(--ui-border)] p-2">
              <button
                type="button"
                class="w-full text-left text-xs px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-fg)]"
                :disabled="cloudSync.authBusy.value"
                role="menuitem"
                data-menu-focusable="true"
                @click="handleSignOut"
              >
                {{ cloudSync.authBusy.value ? "Signing out..." : "Sign out" }}
              </button>
            </section>
          </template>

          <template v-else>
            <section class="rounded-md border border-[var(--ui-border)] p-3 flex flex-col gap-2">
              <label class="text-[10px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">Account email</label>
              <input
                v-model="cloudSync.authEmail.value"
                type="email"
                placeholder="you@company.com"
                class="w-full rounded-md border border-[var(--ui-border)] bg-transparent px-2 py-2 text-xs"
                data-menu-focusable="true"
              />
              <input
                v-model="cloudSync.authOtp.value"
                type="text"
                inputmode="numeric"
                placeholder="OTP code"
                class="w-full rounded-md border border-[var(--ui-border)] bg-transparent px-2 py-2 text-xs"
                data-menu-focusable="true"
              />
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="rounded-md border border-[var(--ui-border)] px-2 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
                  :disabled="cloudSync.authBusy.value"
                  data-menu-focusable="true"
                  @click="cloudSync.sendOtpCode()"
                >
                  Send code
                </button>
                <button
                  type="button"
                  class="rounded-md border border-[var(--ui-border)] px-2 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
                  :disabled="cloudSync.authBusy.value"
                  data-menu-focusable="true"
                  @click="cloudSync.submitOtpCode()"
                >
                  Sign in
                </button>
              </div>
              <button
                type="button"
                class="rounded-md border border-[var(--ui-border)] px-2 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
                :disabled="cloudSync.authBusy.value || !cloudSync.canUsePasskey.value"
                data-menu-focusable="true"
                @click="cloudSync.signInWithPasskey()"
              >
                Use passkey
              </button>
              <p v-if="cloudSync.authMessage.value" class="text-xs text-[var(--ui-fg-muted)]">
                {{ cloudSync.authMessage.value }}
              </p>
            </section>
          </template>

          <p v-if="switchError" class="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
            {{ switchError }}
          </p>
          <p class="text-[11px] text-[var(--ui-fg-muted)] px-1">{{ statusLine }}</p>
        </div>
      </template>

      <template v-else-if="menuView === 'identity-switch'">
        <div class="flex flex-col gap-3 py-1">
          <button
            type="button"
            class="text-left text-xs px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-fg)]"
            role="menuitem"
            data-menu-focusable="true"
            @click="backToMain"
          >
            ← Switch identity
          </button>

          <input
            v-if="persistedIdentities.length > 8"
            v-model="identitySearch"
            type="text"
            placeholder="Search identities..."
            class="w-full rounded-md border border-[var(--ui-border)] bg-transparent px-2 py-2 text-xs"
            data-menu-focusable="true"
          />

          <div class="max-h-64 overflow-auto flex flex-col gap-1">
            <button
              v-for="entry in filteredIdentities"
              :key="entry.id"
              type="button"
              class="w-full text-left text-xs px-2 py-2 rounded-md border border-transparent hover:border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-fg)]"
              role="menuitemradio"
              :aria-checked="entry.id === cloudSync.selectedCloudProfileId.value"
              :disabled="Boolean(switchingIdentityId)"
              data-menu-focusable="true"
              @click="handleSelectIdentity(entry.id)"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <IdentityAvatar :identity="entry.avatarIdentity" size="sm" />
                  <div class="min-w-0">
                    <span class="block font-semibold truncate">{{ entry.handle }}</span>
                    <p class="text-[11px] text-[var(--ui-fg-muted)]">
                      {{ entry.bookCount }} pixbooks
                    </p>
                  </div>
                </div>
                <div class="shrink-0 flex items-center gap-1">
                  <span
                    v-if="entry.id === cloudSync.selectedCloudProfileId.value && !switchingIdentityId"
                    class="text-[10px] text-[var(--ui-fg-muted)]"
                  >
                    Active
                  </span>
                  <span
                    class="text-[10px] rounded-full border px-1.5 py-0.5"
                    :class="
                      entry.isLocal
                        ? 'border-emerald-500/40 text-emerald-700'
                        : 'border-amber-500/40 text-amber-700'
                    "
                  >
                    {{ entry.isLocal ? "This device" : "Account only" }}
                  </span>
                  <span
                    v-if="switchingIdentityId === entry.id"
                    class="text-[10px] text-[var(--ui-fg-muted)]"
                  >
                    Switching...
                  </span>
                </div>
              </div>
            </button>
          </div>

          <button
            type="button"
            class="text-left text-xs px-2 py-2 rounded-md border border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-fg)]"
            role="menuitem"
            data-menu-focusable="true"
            @click="goTo('pixpax-settings-identity-devices')"
          >
            Create new identity...
          </button>

          <p v-if="switchError" class="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
            {{ switchError }}
          </p>
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col gap-3 py-1">
          <button
            type="button"
            class="text-left text-xs px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-fg)]"
            role="menuitem"
            data-menu-focusable="true"
            @click="backToMain"
          >
            ← Settings
          </button>

          <section class="rounded-md border border-[var(--ui-border)] p-2">
            <p class="px-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">Account</p>
            <button
              type="button"
              class="w-full text-left px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5"
              role="menuitem"
              data-menu-focusable="true"
              @click="goTo('pixpax-settings-identity-devices')"
            >
              <p class="text-xs font-semibold">Account &amp; session</p>
              <p class="text-[11px] text-[var(--ui-fg-muted)]">Passkeys, devices, active sessions</p>
            </button>
          </section>

          <section class="rounded-md border border-[var(--ui-border)] p-2">
            <p class="px-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">Identity</p>
            <button
              type="button"
              class="w-full text-left px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5"
              role="menuitem"
              data-menu-focusable="true"
              @click="goTo('pixpax-settings-identity-devices')"
            >
              <p class="text-xs font-semibold">Signing identities</p>
              <p class="text-[11px] text-[var(--ui-fg-muted)]">Create, rename, revoke identities</p>
            </button>
          </section>

          <section class="rounded-md border border-[var(--ui-border)] p-2">
            <p class="px-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">Data &amp; verification</p>
            <button
              type="button"
              class="w-full text-left px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5"
              role="menuitem"
              data-menu-focusable="true"
              @click="goTo('pixpax-settings-import-export')"
            >
              <p class="text-xs font-semibold">Import / export</p>
              <p class="text-[11px] text-[var(--ui-fg-muted)]">Move your pixbooks between devices</p>
            </button>
            <button
              type="button"
              class="w-full text-left px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5"
              role="menuitem"
              data-menu-focusable="true"
              @click="goTo('pixpax-settings-sync-backup')"
            >
              <p class="text-xs font-semibold">Ledger health</p>
              <p class="text-[11px] text-[var(--ui-fg-muted)]">Verify receipts and integrity</p>
            </button>
          </section>

          <section class="rounded-md border border-[var(--ui-border)] p-2">
            <button
              type="button"
              class="w-full text-left px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5"
              role="menuitem"
              data-menu-focusable="true"
              @click="advancedOpen = !advancedOpen"
            >
              <p class="text-xs font-semibold">Advanced</p>
            </button>

            <div v-if="advancedOpen" class="mt-1 flex flex-col gap-1">
              <button
                type="button"
                class="w-full text-left px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5"
                role="menuitem"
                data-menu-focusable="true"
                @click="goTo('pixpax-settings-sync-backup')"
              >
                <p class="text-xs font-semibold">Account backup</p>
                <p class="text-[11px] text-[var(--ui-fg-muted)]">Download a full backup bundle</p>
              </button>
              <button
                v-if="auth.hasPermission('pixpax.admin.manage')"
                type="button"
                class="w-full text-left px-2 py-2 rounded-md hover:bg-[var(--ui-fg)]/5"
                role="menuitem"
                data-menu-focusable="true"
                @click="goTo('pixpax-control-admin')"
              >
                <p class="text-xs font-semibold">Admin tools</p>
                <p class="text-[11px] text-[var(--ui-fg-muted)]">Issuance, studio, diagnostics</p>
              </button>
              <button
                type="button"
                class="w-full text-left px-2 py-2 rounded-md border border-amber-500/40 text-amber-700 hover:bg-amber-50"
                role="menuitem"
                data-menu-focusable="true"
                @click="dangerModalOpen = true"
              >
                <p class="text-xs font-semibold">Danger zone</p>
                <p class="text-[11px] opacity-80">Destructive actions</p>
              </button>
            </div>
          </section>
        </div>
      </template>
    </div>

    <div
      v-if="dangerModalOpen"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-lg">
        <h3 class="text-sm font-semibold">Danger zone confirmation</h3>
        <p class="mt-2 text-xs text-[var(--ui-fg-muted)]">
          This opens destructive account reset controls.
        </p>
        <p class="text-xs text-[var(--ui-fg-muted)]">
          It will affect your account identity data. It will not sign you out.
        </p>
        <p class="text-xs text-[var(--ui-fg-muted)]">
          Scope: account <code>{{ accountNod }}</code>.
        </p>
        <label class="mt-3 block text-[10px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">
          Type RESET to continue
        </label>
        <input
          v-model="dangerConfirmText"
          type="text"
          class="mt-1 w-full rounded-md border border-[var(--ui-border)] bg-transparent px-2 py-2 text-xs"
        />
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5"
            @click="dangerModalOpen = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-md border border-red-500/50 px-3 py-2 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
            :disabled="!canOpenDangerZone()"
            @click="handleDangerConfirm"
          >
            Open danger zone
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

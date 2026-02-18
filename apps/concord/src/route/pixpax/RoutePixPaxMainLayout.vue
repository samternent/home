<script lang="ts" setup>
import { shallowRef, computed, onMounted, onUnmounted, watch } from "vue";
import { onClickOutside, useLocalStorage } from "@vueuse/core";
import {
  createIdentity,
  exportPublicKeyAsPem,
  exportPrivateKeyAsPem,
} from "ternent-identity";
import { SThemeToggle } from "ternent-ui";
import { generate as generateEncryptionKeys } from "ternent-encrypt";
import { stripIdentityKey } from "ternent-utils";
import AppBootstrap from "../../module/app/AppBootstrap.vue";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import { useIdentity } from "../../module/identity/useIdentity";
import { useEncryption } from "../../module/encryption/useEncryption";
import { useLedger } from "../../module/ledger/useLedger";
import {
  type PublicProfile,
  type PrivateProfile,
  useProfile,
} from "../../module/profile/useProfile";
import Logo from "../../module/brand/Logo.vue";
import PixPaxLogo from "../../module/pixpax/ui/assets/PixPaxLogo.svg?component";
import PixPaxLogoText from "../../module/pixpax/ui/assets/PixPaxLogoText.svg?component";
import { usePixpaxAccount } from "../../module/pixpax/auth/usePixpaxAccount";
import {
  PixPaxApiError,
  getPixbookCloudState,
  savePixbookCloudSnapshot,
} from "../../module/pixpax/api/client";

type PixbookExport =
  | {
      format: "pixpax-pixbook";
      version: "1.0";
      kind: "public";
      profile: PublicProfile;
      ledger: any;
    }
  | {
      format: "pixpax-pixbook";
      version: "1.0";
      kind: "private";
      profile: PrivateProfile;
      ledger: any;
    };

const { ledger, api } = useLedger();
const {
  publicKeyPEM,
  privateKeyPEM,
  privateKey,
  publicKey,
  init,
  impersonate: impersonateIdentity,
} = useIdentity();
const {
  publicKey: encryptionPublicKey,
  privateKey: encryptionPrivateKey,
  impersonate: impersonateEncryption,
} = useEncryption();
const profile = useProfile();

const userMenuRef = shallowRef<HTMLElement | null>();
const userMenuOpen = shallowRef(false);
const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value;
};
onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false;
});

const theme = useLocalStorage("app/theme", "obsidian");

const hasProfile = computed(() => {
  const meta = profile.meta.value as { username?: string };
  return !!meta.username;
});

const profileUsername = computed(() => {
  const meta = profile.meta.value as { username?: string };
  return typeof meta.username === "string" ? meta.username : "";
});

const disabled = computed(
  () => !profile.ready.value || !profile.profileId.value,
);

const themeMode = useLocalStorage("app/themeMode", "light");

const username = shallowRef<string>("");
const pixbookUploadInputRef = shallowRef<HTMLInputElement | null>(null);
const pixbookUploadError = shallowRef("");
const pixbookUploadStatus = shallowRef("");
const pixbookReadOnly = useLocalStorage("pixpax/pixbook/readOnly", false);
const viewedPixbookProfileJson = useLocalStorage(
  "pixpax/pixbook/viewProfileJson",
  "",
);
const viewedPixbookProfile = computed<PublicProfile | null>({
  get() {
    if (!viewedPixbookProfileJson.value) return null;
    try {
      return JSON.parse(viewedPixbookProfileJson.value) as PublicProfile;
    } catch {
      viewedPixbookProfileJson.value = "";
      return null;
    }
  },
  set(value) {
    viewedPixbookProfileJson.value = value ? JSON.stringify(value) : "";
  },
});
const publicLedgerSnapshot = useLocalStorage("pixpax/pixbook/publicLedger", "");
const privateLedgerSnapshot = useLocalStorage(
  "pixpax/pixbook/privateLedger",
  "",
);

const PIXBOOK_FORMAT = "pixpax-pixbook";
const PIXBOOK_VERSION = "1.0";

const CORE_LEDGER_KEY = "concord:ledger:core";
const TAMPER_LEDGER_KEY = "concord:ledger:tamper";
const TAMPER_ACTIVE_KEY = "concord:ledger:tampered";

const pixbookHead = computed(() => {
  return ledger.value?.head?.slice(0, 7) || "new";
});

const storageChecked = shallowRef(false);
const creatingPixbook = shallowRef(false);
const shouldAutoCreatePixbook = shallowRef(true);
const account = usePixpaxAccount();
const authMode = useLocalStorage<"signin" | "signup">("pixpax/auth/mode", "signin");
const authEmail = shallowRef("");
const authPassword = shallowRef("");
const authName = shallowRef("");
const authOtp = shallowRef("");
const authBusy = shallowRef(false);
const authMessage = shallowRef("");
const cloudAutoSync = useLocalStorage("pixpax/pixbook/cloudAutoSync", true);
const cloudSyncing = shallowRef(false);
const cloudSyncStatus = shallowRef("");
const cloudSyncError = shallowRef("");
const cloudSnapshotVersion = shallowRef<number | null>(null);
const cloudSnapshotAt = shallowRef("");
const cloudWorkspaceId = shallowRef("");
const cloudBookId = shallowRef("");
const cloudSnapshotPayload = shallowRef<unknown | null>(null);
const lastCloudSyncHead = shallowRef("");
let cloudSyncTimer: number | null = null;
const viewingIdentityKey = computed(() => {
  return viewedPixbookProfile.value?.identity?.publicKey || "";
});
const viewingLabel = computed(() => {
  const meta = viewedPixbookProfile.value?.metadata as { username?: string };
  if (meta?.username) return `@${meta.username}`;
  const id = viewedPixbookProfile.value?.profileId || "";
  return id ? `Pixbook ${id.slice(0, 6)}` : "Pixbook";
});
const hasPublicView = computed(() => {
  return (
    pixbookReadOnly.value &&
    Boolean(viewedPixbookProfile.value) &&
    Boolean(publicLedgerSnapshot.value)
  );
});

const canCloudSync = computed(() => {
  return account.isAuthenticated.value && !pixbookReadOnly.value && Boolean(ledger.value);
});

function resetCloudSyncState() {
  cloudSyncStatus.value = "";
  cloudSyncError.value = "";
  cloudSnapshotVersion.value = null;
  cloudSnapshotAt.value = "";
  cloudWorkspaceId.value = "";
  cloudBookId.value = "";
  cloudSnapshotPayload.value = null;
  lastCloudSyncHead.value = "";
}

async function refreshCloudSnapshot() {
  if (!account.isAuthenticated.value) {
    resetCloudSyncState();
    return;
  }

  cloudSyncError.value = "";
  try {
    const response = await getPixbookCloudState(account.workspace.value?.workspaceId || undefined);
    cloudWorkspaceId.value = response.workspaceId || "";
    cloudBookId.value = response.book?.id || "";
    cloudSnapshotVersion.value = response.snapshot?.version ?? null;
    cloudSnapshotAt.value = response.snapshot?.createdAt || "";
    cloudSnapshotPayload.value = response.snapshot?.payload ?? null;
  } catch (error: unknown) {
    if (error instanceof PixPaxApiError && error.status === 401) {
      resetCloudSyncState();
      return;
    }
    cloudSyncError.value = String((error as Error)?.message || "Failed to load cloud snapshot.");
  }
}

async function saveCloudSnapshot(options: { silent?: boolean } = {}) {
  if (!canCloudSync.value || !ledger.value) return false;
  if (cloudSyncing.value) return false;

  cloudSyncing.value = true;
  if (!options.silent) cloudSyncStatus.value = "Saving pixbook to cloud...";
  cloudSyncError.value = "";
  try {
    const payload = buildPixbook("private");
    const response = await savePixbookCloudSnapshot({
      payload,
      ledgerHead: ledger.value?.head || "",
      workspaceId: account.workspace.value?.workspaceId || undefined,
    });
    cloudWorkspaceId.value = response.workspaceId || "";
    cloudBookId.value = response.book?.id || "";
    cloudSnapshotVersion.value = response.snapshot?.version ?? null;
    cloudSnapshotAt.value = response.snapshot?.createdAt || "";
    cloudSnapshotPayload.value = response.snapshot?.payload ?? payload;
    lastCloudSyncHead.value = ledger.value?.head || "";
    if (!options.silent) {
      cloudSyncStatus.value = `Cloud save complete (v${cloudSnapshotVersion.value ?? 0}).`;
    }
    return true;
  } catch (error: unknown) {
    cloudSyncError.value = String((error as Error)?.message || "Cloud save failed.");
    return false;
  } finally {
    cloudSyncing.value = false;
  }
}

async function restoreCloudSnapshot() {
  if (!account.isAuthenticated.value) {
    cloudSyncError.value = "Sign in to restore cloud pixbooks.";
    return;
  }

  cloudSyncError.value = "";
  cloudSyncStatus.value = "Loading cloud snapshot...";
  try {
    const response = await getPixbookCloudState(account.workspace.value?.workspaceId || undefined);
    const payload = response.snapshot?.payload as PixbookExport | null;
    if (!payload || typeof payload !== "object") {
      throw new Error("No cloud snapshot found yet.");
    }
    if (payload.format !== PIXBOOK_FORMAT || payload.version !== PIXBOOK_VERSION) {
      throw new Error("Cloud snapshot format is invalid.");
    }

    if (payload.kind === "public") {
      pixbookReadOnly.value = true;
      viewedPixbookProfile.value = payload.profile as PublicProfile;
      publicLedgerSnapshot.value = JSON.stringify(payload.ledger);
      await api.load(payload.ledger, [], true, true);
      await api.replay();
      cloudSyncStatus.value = "Public cloud pixbook loaded (read-only).";
      return;
    }

    const privateProfile = payload.profile as PrivateProfile;
    if (privateProfile?.format !== "concord-profile-private") {
      throw new Error("Cloud snapshot private profile is missing.");
    }

    pixbookReadOnly.value = false;
    viewedPixbookProfile.value = null;
    publicLedgerSnapshot.value = "";
    await impersonateIdentity(privateProfile);
    await impersonateEncryption(privateProfile);
    profile.replaceProfileMeta(privateProfile.metadata);
    profile.setProfileId(privateProfile.profileId);
    await api.load(payload.ledger, [], true, true);
    await reauthAndReplay();
    cloudSyncStatus.value = `Cloud pixbook restored (v${response.snapshot?.version || 0}).`;
    if (ledger.value?.head) {
      lastCloudSyncHead.value = ledger.value.head;
    }
    await refreshCloudSnapshot();
  } catch (error: unknown) {
    cloudSyncError.value = String((error as Error)?.message || "Cloud restore failed.");
    cloudSyncStatus.value = "";
  }
}

async function submitAccountAuth() {
  authBusy.value = true;
  authMessage.value = "";
  cloudSyncError.value = "";
  try {
    if (authMode.value === "signup") {
      await account.registerWithEmail({
        name: authName.value,
        email: authEmail.value,
        password: authPassword.value,
      });
      authMessage.value = "Account created and signed in.";
    } else {
      await account.loginWithEmail({
        email: authEmail.value,
        password: authPassword.value,
      });
      authMessage.value = "Signed in.";
    }
    authPassword.value = "";
    authOtp.value = "";
    await refreshCloudSnapshot();
  } catch (error: unknown) {
    authMessage.value = String((error as Error)?.message || "Authentication failed.");
  } finally {
    authBusy.value = false;
  }
}

async function sendOtpCode() {
  authBusy.value = true;
  authMessage.value = "";
  try {
    await account.requestLoginOtp(authEmail.value);
    authMessage.value = "Verification code sent.";
  } catch (error: unknown) {
    authMessage.value = String((error as Error)?.message || "Failed to send OTP.");
  } finally {
    authBusy.value = false;
  }
}

async function submitOtpCode() {
  authBusy.value = true;
  authMessage.value = "";
  try {
    await account.loginWithOtp({
      email: authEmail.value,
      otp: authOtp.value,
    });
    authMessage.value = "Signed in with OTP.";
    authOtp.value = "";
    await refreshCloudSnapshot();
  } catch (error: unknown) {
    authMessage.value = String((error as Error)?.message || "OTP sign-in failed.");
  } finally {
    authBusy.value = false;
  }
}

async function signOutAccount() {
  authBusy.value = true;
  authMessage.value = "";
  try {
    await account.logout();
    resetCloudSyncState();
    authPassword.value = "";
    authOtp.value = "";
    authMessage.value = "Signed out.";
  } catch (error: unknown) {
    authMessage.value = String((error as Error)?.message || "Sign-out failed.");
  } finally {
    authBusy.value = false;
  }
}

onMounted(async () => {
  await account.refreshSession({ force: true });
  await refreshCloudSnapshot();

  if (
    pixbookReadOnly.value &&
    (!viewedPixbookProfile.value || !publicLedgerSnapshot.value)
  ) {
    pixbookReadOnly.value = false;
    viewedPixbookProfile.value = null;
  }

  if (hasPublicView.value) {
    try {
      await api.load(JSON.parse(publicLedgerSnapshot.value), [], true, true);
      await api.replay();
    } catch {
      publicLedgerSnapshot.value = "";
      await api.loadFromStorage();
    }
  } else {
    await api.loadFromStorage();
  }
  storageChecked.value = true;
  if (!publicKeyPEM.value || !privateKeyPEM.value) {
    await generateNewIdentity();
  }
});

watch(
  () =>
    [
      ledger.value,
      publicKey.value,
      privateKey.value,
      storageChecked.value,
    ] as const,
  async ([currentLedger, pubKey, privKey, checked]) => {
    if (!checked) return;
    if (hasPublicView.value) return;
    if (!shouldAutoCreatePixbook.value) return;
    if (currentLedger) return;
    if (!pubKey || !privKey) return;
    await ensurePixbook();
  },
  { immediate: true },
);

watch(
  () => [ledger.value, pixbookReadOnly.value] as const,
  ([currentLedger, readOnly]) => {
    if (!currentLedger || readOnly) return;
    try {
      privateLedgerSnapshot.value = JSON.stringify(currentLedger);
    } catch {
      privateLedgerSnapshot.value = "";
    }
  },
  { immediate: true },
);

watch(
  () => account.isAuthenticated.value,
  async (next) => {
    if (!next) {
      resetCloudSyncState();
      return;
    }
    await refreshCloudSnapshot();
  },
  { immediate: true }
);

watch(
  () =>
    [
      account.isAuthenticated.value,
      cloudAutoSync.value,
      pixbookReadOnly.value,
      ledger.value?.head || "",
    ] as const,
  ([authenticated, autoSyncEnabled, readOnly, head]) => {
    if (!authenticated || !autoSyncEnabled || readOnly || !head) return;
    if (head === lastCloudSyncHead.value) return;
    if (cloudSyncTimer != null) {
      window.clearTimeout(cloudSyncTimer);
      cloudSyncTimer = null;
    }
    cloudSyncTimer = window.setTimeout(() => {
      void saveCloudSnapshot({ silent: true });
    }, 1400);
  },
  { immediate: false }
);

onUnmounted(() => {
  if (cloudSyncTimer != null) {
    window.clearTimeout(cloudSyncTimer);
    cloudSyncTimer = null;
  }
});

function downloadText(
  filename: string,
  content: string,
  mime = "application/json",
) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 250);
}

async function ensurePixbook() {
  if (creatingPixbook.value || ledger.value) return;
  if (!publicKey.value || !privateKey.value) return;
  pixbookReadOnly.value = false;
  viewedPixbookProfile.value = null;
  publicLedgerSnapshot.value = "";
  privateLedgerSnapshot.value = "";
  creatingPixbook.value = true;
  try {
    await api.auth(privateKey.value, publicKey.value);
    await api.create();
  } finally {
    creatingPixbook.value = false;
  }
}

function buildPixbook(kind: "public" | "private") {
  if (!ledger.value) {
    throw new Error("Pixbook ledger not available.");
  }

  if (kind === "public") {
    return {
      format: PIXBOOK_FORMAT,
      version: PIXBOOK_VERSION,
      kind,
      profile: profile.getPublicProfile(),
      ledger: ledger.value,
    };
  }

  return {
    format: PIXBOOK_FORMAT,
    version: PIXBOOK_VERSION,
    kind,
    profile: profile.getPrivateProfile(),
    ledger: ledger.value,
  };
}

async function downloadPixbook(kind: "public" | "private") {
  if (kind === "private" && pixbookReadOnly.value) {
    pixbookUploadError.value =
      "Private pixbook export requires the signing keys.";
    return;
  }
  await profile.ensureProfileId();
  if (!ledger.value) {
    await ensurePixbook();
  }

  if (!ledger.value) {
    pixbookUploadError.value = "Pixbook ledger not available yet.";
    return;
  }

  const pixbook = buildPixbook(kind);
  const filename = `pixbook.${kind}.${pixbookHead.value}.json`;
  const json = JSON.stringify(pixbook, null, 2);
  downloadText(filename, json);
}

function triggerPixbookUpload() {
  pixbookUploadError.value = "";
  pixbookUploadStatus.value = "";
  pixbookUploadInputRef.value?.click();
}

async function handlePixbookUpload(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target?.files?.length) return;
  const file = target.files[0];
  target.value = "";

  let parsed: PixbookExport;
  try {
    parsed = JSON.parse(await file.text()) as PixbookExport;
  } catch {
    pixbookUploadError.value = "Invalid pixbook JSON.";
    return;
  }

  if (
    parsed?.format !== PIXBOOK_FORMAT ||
    parsed?.version !== PIXBOOK_VERSION
  ) {
    pixbookUploadError.value = "Not a pixbook export.";
    return;
  }

  const confirmed = window.confirm(
    "Import this pixbook? This will replace your current pixbook and may replace your identity.",
  );
  if (!confirmed) return;

  shouldAutoCreatePixbook.value = false;
  try {
    if (parsed.kind === "public") {
      pixbookReadOnly.value = true;
      viewedPixbookProfile.value = parsed.profile as PublicProfile;
      publicLedgerSnapshot.value = JSON.stringify(parsed.ledger);
      if (ledger.value) {
        try {
          privateLedgerSnapshot.value = JSON.stringify(ledger.value);
        } catch {
          privateLedgerSnapshot.value = "";
        }
      }
      await api.load(parsed.ledger, [], true, true);
      await api.replay();
      pixbookUploadStatus.value = "Public pixbook loaded (read-only).";
      lastCloudSyncHead.value = "";
      return;
    }

    const privateProfile = parsed.profile as PrivateProfile;
    if (privateProfile?.format !== "concord-profile-private") {
      pixbookUploadError.value = "Missing private profile in pixbook.";
      return;
    }

    pixbookReadOnly.value = false;
    viewedPixbookProfile.value = null;
    publicLedgerSnapshot.value = "";
    await impersonateIdentity(privateProfile);
    await impersonateEncryption(privateProfile);
    profile.replaceProfileMeta(privateProfile.metadata);
    profile.setProfileId(privateProfile.profileId);

    await api.load(parsed.ledger, [], true, true);
    await reauthAndReplay();
    pixbookUploadStatus.value = "Private pixbook imported.";
    lastCloudSyncHead.value = ledger.value?.head || "";
  } finally {
    shouldAutoCreatePixbook.value = true;
  }
}

async function reauthAndReplay() {
  if (!publicKey.value || !privateKey.value) return;
  await api.auth(privateKey.value, publicKey.value);
  await api.replay();
}

async function generateNewIdentity(e?: Event) {
  if (e) {
    e.currentTarget?.classList.add("spin");
  }
  const keys = await createIdentity();
  if (!keys) return;
  publicKeyPEM.value = stripIdentityKey(
    await exportPublicKeyAsPem(keys.publicKey),
  );
  publicKey.value = keys.publicKey;
  privateKey.value = keys.privateKey;
  privateKeyPEM.value = await exportPrivateKeyAsPem(keys.privateKey);
}

async function resetIdentityAndProfile() {
  const confirmed = window.confirm(
    "This will clear the current identity and profile and generate a new one.",
  );
  if (!confirmed) return;

  pixbookUploadError.value = "";
  pixbookUploadStatus.value = "";
  username.value = "";

  profile.clearProfileMeta();
  profile.resetProfileId();

  await generateNewIdentity();
  const [nextPrivate, nextPublic] = await generateEncryptionKeys();
  encryptionPublicKey.value = nextPublic;
  encryptionPrivateKey.value = nextPrivate;

  await profile.ensureProfileId();
  await reauthAndReplay();
  pixbookUploadStatus.value = "New identity created.";
}

async function setProfile() {
  profile.setProfileMeta({ username: username.value });
  username.value = "";

  init();
}

async function createNewPixbook() {
  const confirmed = window.confirm(
    "Start a new pixbook? This will replace your current pixbook.",
  );
  if (!confirmed) return;
  pixbookReadOnly.value = false;
  viewedPixbookProfile.value = null;
  publicLedgerSnapshot.value = "";
  privateLedgerSnapshot.value = "";
  shouldAutoCreatePixbook.value = false;
  if (privateKey.value && publicKey.value) {
    await api.auth(privateKey.value, publicKey.value);
  }
  await api.create();
  lastCloudSyncHead.value = "";
  shouldAutoCreatePixbook.value = true;
}

async function returnToMyPixbook() {
  shouldAutoCreatePixbook.value = false;
  pixbookReadOnly.value = false;
  viewedPixbookProfile.value = null;
  publicLedgerSnapshot.value = "";
  if (privateLedgerSnapshot.value) {
    try {
      await api.load(JSON.parse(privateLedgerSnapshot.value), [], true, true);
    } catch {
      privateLedgerSnapshot.value = "";
      await api.loadFromStorage();
    }
  } else {
    await api.loadFromStorage();
  }
  shouldAutoCreatePixbook.value = true;
  await ensurePixbook();
  lastCloudSyncHead.value = ledger.value?.head || "";
}

async function eraseLocalPixbook() {
  const confirmed = window.confirm(
    "Erase this pixbook from this browser? This cannot be undone.",
  );
  if (!confirmed) return;
  pixbookReadOnly.value = false;
  viewedPixbookProfile.value = null;
  publicLedgerSnapshot.value = "";
  privateLedgerSnapshot.value = "";
  await api.destroy();
  window.localStorage.removeItem(CORE_LEDGER_KEY);
  window.localStorage.removeItem(TAMPER_LEDGER_KEY);
  window.localStorage.removeItem(TAMPER_ACTIVE_KEY);
  await ensurePixbook();
  lastCloudSyncHead.value = "";
}
</script>
<template>
  <AppBootstrap :read-only="pixbookReadOnly">
    <div
      class="dark flex flex-col flex-1 w-screen h-screen overflow-auto font-mono bg-[image:var(--bg-pixpax)]"
    >
      <header
        class="sticky top-0 z-30 w-full backdrop-blur-[12px] border-b border-[var(--ui-border)]"
      >
        <div class="mx-auto flex items-center w-full justify-between px-4 py-2">
          <div class="hidden lg:block flex-1" />
          <RouterLink to="/"><PixPaxLogoText class="h-4 lg:h-6" /></RouterLink>

          <div class="flex-1">
            <input
              ref="pixbookUploadInputRef"
              type="file"
              accept="application/json"
              class="hidden"
              @change="handlePixbookUpload"
            />
            <div
              class="relative flex justify-end items-center"
              ref="userMenuRef"
            >
              <button
                @click="toggleUserMenu"
                class="flex items-center gap-2"
                :class="{ active: userMenuOpen }"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-3 h-3 ml-1 transition-transform"
                  :class="{ 'rotate-180': userMenuOpen }"
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
                  <IdentityAvatar :identity="publicKeyPEM" size="sm" />
                </div>
                <span
                  v-if="pixbookReadOnly"
                  class="text-[10px] uppercase tracking-wide text-amber-600 border border-amber-600/30 rounded-full px-2 py-0.5"
                >
                  read-only
                </span>
              </button>

              <div
                v-if="userMenuOpen"
                class="border border-[var(--ui-border)] absolute p-3 bg-[var(--ui-surface)] rounded mt-2 w-[22rem] right-0 shadow top-12 max-h-[80vh] overflow-auto"
              >
                <div class="flex flex-col gap-3 py-1">
                  <IdentityAvatar
                    :identity="publicKeyPEM"
                    size="lg"
                    class="mx-auto mt-1"
                  />
                  <span class="p-2 text-center font-thin"
                    >@{{ profileUsername }}</span
                  >

                  <div
                    v-if="!hasProfile"
                    class="flex flex-col gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)]/60 p-2"
                  >
                    <p class="text-xs text-[var(--ui-fg-muted)]">
                      Set a display handle for your local Pixbook identity.
                    </p>
                    <input
                      v-model="username"
                      type="text"
                      placeholder="Display name"
                      class="border border-[var(--ui-border)] px-3 py-2 rounded-md bg-[var(--ui-bg)] text-xs"
                    />
                    <div class="grid grid-cols-2 gap-2">
                      <button
                        class="border border-[var(--ui-border)] px-3 py-2 text-xs rounded-md"
                        @click="setProfile"
                      >
                        Set handle
                      </button>
                      <button
                        @click="generateNewIdentity"
                        @animationend="
                          (e) => e.currentTarget?.classList.remove('spin')
                        "
                        class="spin-target border border-[var(--ui-border)] px-3 py-2 text-xs rounded-md"
                      >
                        New identity
                      </button>
                    </div>
                  </div>

                  <section class="flex flex-col gap-2 rounded-md border border-[var(--ui-border)] p-2">
                    <h3 class="text-xs uppercase tracking-wide text-[var(--ui-fg-muted)]">
                      Account
                    </h3>
                    <p
                      v-if="account.isAuthenticated.value"
                      class="text-xs text-green-600"
                    >
                      Signed in as {{ account.user.value?.email || account.user.value?.name || account.user.value?.id }}
                    </p>
                    <template v-if="!account.isAuthenticated.value">
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          class="rounded-md border px-2 py-1"
                          :class="authMode === 'signin' ? 'border-[var(--ui-accent)]' : 'border-[var(--ui-border)]'"
                          @click="authMode = 'signin'"
                        >
                          Sign in
                        </button>
                        <button
                          type="button"
                          class="rounded-md border px-2 py-1"
                          :class="authMode === 'signup' ? 'border-[var(--ui-accent)]' : 'border-[var(--ui-border)]'"
                          @click="authMode = 'signup'"
                        >
                          Sign up
                        </button>
                      </div>
                      <input
                        v-model="authEmail"
                        type="email"
                        placeholder="Email"
                        class="border border-[var(--ui-border)] px-3 py-2 rounded-md bg-[var(--ui-bg)] text-xs"
                      />
                      <input
                        v-if="authMode === 'signup'"
                        v-model="authName"
                        type="text"
                        placeholder="Display name"
                        class="border border-[var(--ui-border)] px-3 py-2 rounded-md bg-[var(--ui-bg)] text-xs"
                      />
                      <input
                        v-model="authPassword"
                        type="password"
                        placeholder="Password"
                        class="border border-[var(--ui-border)] px-3 py-2 rounded-md bg-[var(--ui-bg)] text-xs"
                      />
                      <button
                        type="button"
                        class="w-full text-left text-xs px-3 py-2 rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 transition-colors disabled:opacity-50"
                        :disabled="authBusy"
                        @click="submitAccountAuth"
                      >
                        {{ authBusy ? "Working..." : authMode === "signup" ? "Create account" : "Sign in" }}
                      </button>

                      <div class="border-t border-[var(--ui-border)] pt-2 flex flex-col gap-2">
                        <p class="text-[11px] text-[var(--ui-fg-muted)]">Email code sign-in</p>
                        <input
                          v-model="authOtp"
                          type="text"
                          placeholder="6-digit code"
                          class="border border-[var(--ui-border)] px-3 py-2 rounded-md bg-[var(--ui-bg)] text-xs"
                        />
                        <div class="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            class="text-xs px-2 py-2 rounded-md border border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
                            :disabled="authBusy"
                            @click="sendOtpCode"
                          >
                            Send code
                          </button>
                          <button
                            type="button"
                            class="text-xs px-2 py-2 rounded-md border border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
                            :disabled="authBusy"
                            @click="submitOtpCode"
                          >
                            Verify code
                          </button>
                        </div>
                      </div>
                    </template>
                    <button
                      v-else
                      type="button"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 transition-colors disabled:opacity-50"
                      :disabled="authBusy"
                      @click="signOutAccount"
                    >
                      {{ authBusy ? "Signing out..." : "Sign out" }}
                    </button>
                    <p v-if="authMessage" class="text-xs text-[var(--ui-fg-muted)]">
                      {{ authMessage }}
                    </p>
                    <p
                      v-if="account.error.value && account.status.value === 'error'"
                      class="text-xs text-red-600"
                    >
                      {{ account.error.value }}
                    </p>
                  </section>

                  <section class="flex flex-col gap-2 rounded-md border border-[var(--ui-border)] p-2">
                    <h3 class="text-xs uppercase tracking-wide text-[var(--ui-fg-muted)]">
                      Cloud Sync
                    </h3>
                    <p class="text-xs text-[var(--ui-fg-muted)]">
                      Save your private Pixbook to your account so it follows you across devices.
                    </p>
                    <div v-if="account.isAuthenticated.value" class="flex flex-col gap-2">
                      <label class="flex items-center gap-2 text-xs">
                        <input v-model="cloudAutoSync" type="checkbox" />
                        Auto-sync on changes
                      </label>
                      <button
                        type="button"
                        class="w-full text-left text-xs px-3 py-2 rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 transition-colors disabled:opacity-50"
                        :disabled="!canCloudSync || cloudSyncing"
                        @click="saveCloudSnapshot()"
                      >
                        {{ cloudSyncing ? "Saving..." : "Save to cloud now" }}
                      </button>
                      <button
                        type="button"
                        class="w-full text-left text-xs px-3 py-2 rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-fg)]/5 transition-colors disabled:opacity-50"
                        :disabled="cloudSyncing"
                        @click="restoreCloudSnapshot"
                      >
                        Restore from cloud
                      </button>
                      <p
                        v-if="cloudSnapshotVersion !== null"
                        class="text-xs text-[var(--ui-fg-muted)]"
                      >
                        Latest cloud snapshot: v{{ cloudSnapshotVersion }} {{ cloudSnapshotAt ? `(${new Date(cloudSnapshotAt).toLocaleString()})` : "" }}
                      </p>
                    </div>
                    <p v-else class="text-xs text-[var(--ui-fg-muted)]">
                      Sign in to enable cloud Pixbook storage.
                    </p>
                    <p v-if="cloudSyncStatus" class="text-xs text-green-600">
                      {{ cloudSyncStatus }}
                    </p>
                    <p v-if="cloudSyncError" class="text-xs text-red-600">
                      {{ cloudSyncError }}
                    </p>
                  </section>

                  <div class="flex flex-col gap-2 rounded-md border border-[var(--ui-border)] p-2">
                    <h3 class="text-xs uppercase tracking-wide text-[var(--ui-fg-muted)]">
                      Local Pixbook
                    </h3>
                    <p class="text-xs text-[var(--ui-fg-muted)]">
                      Your pixbook lives in this browser. If you delete it or
                      clear storage without exporting, it is gone forever.
                    </p>
                    <p
                      v-if="pixbookReadOnly"
                      class="text-xs text-amber-600 border border-amber-600/30 rounded-md px-2 py-1 bg-amber-500/10"
                    >
                      Read-only pixbook. Import a private pixbook to edit or
                      trade.
                    </p>
                    <button
                      type="button"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-[var(--ui-fg)]/5 transition-colors disabled:opacity-50"
                      :disabled="disabled || pixbookReadOnly"
                      @click="downloadPixbook('private')"
                    >
                      Export private pixbook
                    </button>
                    <button
                      type="button"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-[var(--ui-fg)]/5 transition-colors disabled:opacity-50"
                      :disabled="disabled"
                      @click="downloadPixbook('public')"
                    >
                      Export public pixbook
                    </button>
                    <button
                      type="button"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-[var(--ui-fg)]/5 transition-colors"
                      @click="triggerPixbookUpload"
                    >
                      Import pixbook
                    </button>
                    <button
                      type="button"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg text-red-600 hover:bg-[var(--ui-critical)]/10 transition-colors"
                      @click="createNewPixbook"
                    >
                      Start new pixbook
                    </button>
                    <button
                      type="button"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg text-red-600 hover:bg-[var(--ui-critical)]/10 transition-colors"
                      @click="eraseLocalPixbook"
                    >
                      Erase local pixbook
                    </button>
                  </div>

                  <p v-if="pixbookUploadError" class="text-xs text-red-600">
                    {{ pixbookUploadError }}
                  </p>
                  <p v-if="pixbookUploadStatus" class="text-xs text-green-600">
                    {{ pixbookUploadStatus }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div
        v-if="pixbookReadOnly && viewedPixbookProfile"
        class="mt-6 mx-auto sticky z-20 top-20 backdrop-blur-sm w-100 flex items-center justify-between gap-3 rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)]/60 px-4 py-2 text-xs"
      >
        <div class="flex items-center gap-3">
          <IdentityAvatar :identity="viewingIdentityKey" size="sm" />
          <div class="flex flex-col text-left">
            <span class="text-[var(--ui-fg-muted)]">Viewing</span>
            <span class="text-[var(--ui-fg)] font-semibold"
              >{{ viewingLabel }}'s pixbook</span
            >
          </div>
        </div>
        <button
          type="button"
          class="ml-2 rounded-full border border-[var(--ui-border)] px-3 py-1 text-[10px] uppercase tracking-wide hover:bg-[var(--ui-fg)]/5 transition-colors"
          @click="returnToMyPixbook"
        >
          Return to my pixbook
        </button>
      </div>
      <slot />
      <footer
        class="flex justify-end items-center py-8 border-t-[1px] border-[var(--ui-border)] w-full"
      >
        <div
          class="max-w-[980px] mx-auto w-full flex flex-col items-center gap-6"
        >
          <a
            href="https://concord.ternent.dev"
            class="flex flex-col items-center justify-center gap-1 opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 group-hover:translate-x-1.5 transition-all duration-300"
          >
            <span
              class="text-xs font-mono font-thin -translate-y-1 group-hover:translate-y-0.5 group-hover:translate-x-1.5 transition-all duration-300"
              >Verifiable ownership.</span
            >
            <span
              class="text-xs font-mono font-thin -translate-y-1 group-hover:translate-y-0.5 group-hover:translate-x-1.5 transition-all duration-300"
              >POWERED BY CONCORD</span
            >
            <Logo
              class="size-8 group-hover:-rotate-6 transition-all duration-300"
            />
          </a>
          <div class="flex items-center gap-3">
            <RouterLink
              to="about"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
              >About</RouterLink
            >
            <RouterLink
              to="/pixpax/control/creator"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
              >Creator</RouterLink
            >
            <RouterLink
              to="/pixpax/control/analytics"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
              >Analytics</RouterLink
            >
            <RouterLink
              to="/pixpax/control/admin"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
              >Admin</RouterLink
            >
          </div>
          <div class="flex items-center justify-center py-2 font-sans text-xs">
            <SThemeToggle v-model="themeMode" size="sm" />
          </div>
          <div class="flex gap-2 items-center justify-center">
            <a
              href="mailto:sam@ternent.dev"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
            >
              sam@ternent.dev
            </a>
          </div>
        </div>
      </footer>
    </div>
  </AppBootstrap>
</template>
<style>
@keyframes spin-pop {
  0% {
    transform: rotate(0) scale(1);
  }
  60% {
    transform: rotate(270deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.spin {
  animation: spin-pop 620ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>

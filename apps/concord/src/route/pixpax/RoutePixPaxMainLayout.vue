<script lang="ts" setup>
import { shallowRef, computed, onMounted, watch } from "vue";
import { onClickOutside, useLocalStorage } from "@vueuse/core";
import {
  createIdentity,
  exportPublicKeyAsPem,
  exportPrivateKeyAsPem,
} from "ternent-identity";
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
import PixPaxLogo from "../../module/stickerbook/PixPaxLogo.svg?component";
import PixPaxLogoText from "../../module/stickerbook/PixPaxLogoText.svg?component";

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

onMounted(async () => {
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
          <div class="hidden lg:block w-20" />
          <RouterLink to="/"><PixPaxLogoText class="h-4 lg:h-6" /></RouterLink>

          <div>
            <input
              ref="pixbookUploadInputRef"
              type="file"
              accept="application/json"
              class="hidden"
              @change="handlePixbookUpload"
            />
            <div class="relative w-20" ref="userMenuRef">
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
                class="border border-[var(--ui-border)] absolute p-2 bg-[var(--ui-surface)] rounded mt-2 w-64 right-0 shadow"
              >
                <div class="flex flex-col gap-2 py-2">
                  <IdentityAvatar
                    :identity="publicKeyPEM"
                    size="lg"
                    class="mx-auto my-4"
                  />
                  <span class="p-2 text-center font-thin"
                    >@{{ profileUsername }}</span
                  >

                  <div
                    v-if="!hasProfile"
                    class="flex flex-col justify-center items-center absolute h-full w-full backdrop-blur-md top-0 left-0 right-0 bottom-0"
                  >
                    <div class="flex flex-col gap-2">
                      <div
                        class="flex flex-col items-center gap-2 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]"
                      >
                        <IdentityAvatar
                          :identity="publicKeyPEM"
                          size="lg"
                          class="mx-auto my-4"
                        />
                      </div>

                      <button
                        @click="generateNewIdentity"
                        @animationend="
                          (e) => e.currentTarget?.classList.remove('spin')
                        "
                        class="spin-target size-8 flex items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] p-2 mx-auto"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="size-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                          />
                        </svg>
                      </button>

                      <input
                        v-model="username"
                        type="text"
                        placeholder="Display name"
                        class="border border-[var(--ui-border)] px-4 py-2 rounded-full bg-[var(--ui-bg)]"
                      />
                      <button
                        class="border border-[var(--ui-border)] px-4 py-2 text-sm rounded-full"
                        @click="setProfile"
                      >
                        Set handle
                      </button>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2">
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
              to="admin"
              class="opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 transition-all duration-300"
              >Admin</RouterLink
            >
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

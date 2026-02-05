<script lang="ts" setup>
import { shallowRef, computed } from "vue";
import { onClickOutside, useLocalStorage } from "@vueuse/core";
import { SplitButton } from "ternent-ui/primitives";
import { SThemeToggle } from "ternent-ui/components";
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
import WorkspaceStickerbook from "../workspace/WorkspaceStickerbook.vue";
import Logo from "../../module/brand/Logo.vue";
import PixPaxLogo from "../../module/stickerbook/PixPaxLogo.svg";

type SampleProfilePair = {
  public?: PublicProfile;
  private?: PrivateProfile;
};

const profileModules = import.meta.glob(
  "../../module/profile/samples/concord-profile.*.*.json",
  {
    eager: true,
    import: "default",
  }
) as Record<string, any>;

const profiles = computed<Record<string, SampleProfilePair>>(() => {
  const profiles: Record<string, SampleProfilePair> = {};
  for (const [path, data] of Object.entries(profileModules)) {
    const match = path.match(
      /concord-profile\.(public|private)\.([^.]+)\.json$/
    );

    if (!match) continue;

    const [, visibility, id] = match;

    profiles[id] ??= {};
    profiles[id][visibility as "public" | "private"] = data as
      | PublicProfile
      | PrivateProfile;
  }

  return profiles;
});

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

const myProfile = useLocalStorage(
  "concord/profile/me",
  profile.getPrivateProfileJson()
);

const userMenuRef = shallowRef<HTMLElement | null>();
const userMenuOpen = shallowRef(false);
const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value;
};
onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false;
});

const theme = useLocalStorage("app/theme", "obsidian");
const themeMode = useLocalStorage("app/themeMode", "light");

const hasProfile = computed(() => {
  const meta = profile.meta.value as { username?: string };
  return !!meta.username;
});

const profileUsername = computed(() => {
  const meta = profile.meta.value as { username?: string };
  return typeof meta.username === "string" ? meta.username : "";
});

const disabled = computed(
  () => !profile.ready.value || !profile.profileId.value
);

const username = shallowRef<string>("");
const profileUploadInputRef = shallowRef<HTMLInputElement | null>(null);
const uploadError = shallowRef("");
const uploadStatus = shallowRef("");

const ledgerUploadInputRef = shallowRef<HTMLInputElement | null>(null);
const CORE_LEDGER_KEY = "concord:ledger:core";
const TAMPER_LEDGER_KEY = "concord:ledger:tamper";
const TAMPER_ACTIVE_KEY = "concord:ledger:tampered";

function downloadText(
  filename: string,
  content: string,
  mime = "application/json"
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

async function downloadPublic() {
  await profile.ensureProfileId();

  const files = profile.getDownloadFiles({ pretty: true });
  downloadText(files.public.filename, files.public.json);
}

async function downloadPrivate() {
  await profile.ensureProfileId();

  const files = profile.getDownloadFiles({ pretty: true });
  downloadText(files.private.filename, files.private.json);
}

async function impersonateUser(event: Event) {
  const target = event.target as HTMLSelectElement | null;
  if (!target) return;
  const parsedProfile = JSON.parse(target.value) as PrivateProfile;
  await impersonateIdentity(parsedProfile);
  await impersonateEncryption(parsedProfile);
  profile.replaceProfileMeta(parsedProfile.metadata);
  profile.setProfileId(parsedProfile.profileId);

  await reauthAndReplay();
}

function triggerProfileUpload() {
  uploadError.value = "";
  uploadStatus.value = "";
  profileUploadInputRef.value?.click();
}

async function handleProfileUpload(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target?.files?.length) return;

  const file = target.files[0];
  target.value = "";

  let parsed: PrivateProfile;
  try {
    parsed = JSON.parse(await file.text()) as PrivateProfile;
  } catch {
    uploadError.value = "Invalid JSON file.";
    return;
  }

  if (parsed?.format !== "concord-profile-private") {
    uploadError.value = "Not a private profile file.";
    return;
  }

  await impersonateIdentity(parsed);
  await impersonateEncryption(parsed);
  profile.replaceProfileMeta(parsed.metadata);
  profile.setProfileId(parsed.profileId);

  myProfile.value = JSON.stringify(parsed);
  await reauthAndReplay();
  uploadStatus.value = "Logged in with uploaded profile.";
}

const isImpersonating = computed(() => {
  return JSON.parse(myProfile.value).profileId !== profile.profileId.value;
});

async function cancelImpersonate() {
  const _profile = JSON.parse(myProfile.value);
  await impersonateIdentity(_profile);
  await impersonateEncryption(_profile);
  profile.replaceProfileMeta(_profile.metadata);
  profile.setProfileId(_profile.profileId);

  await reauthAndReplay();
}

function isActiveProfile(profileId: string) {
  return profile.profileId.value === profileId;
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
    await exportPublicKeyAsPem(keys.publicKey)
  );
  publicKey.value = keys.publicKey;
  privateKey.value = keys.privateKey;
  privateKeyPEM.value = await exportPrivateKeyAsPem(keys.privateKey);
}

async function resetIdentityAndProfile() {
  const confirmed = window.confirm(
    "This will clear the current identity and profile and generate a new one."
  );
  if (!confirmed) return;

  uploadError.value = "";
  uploadStatus.value = "";
  username.value = "";

  profile.clearProfileMeta();
  profile.resetProfileId();

  await generateNewIdentity();
  const [nextPrivate, nextPublic] = await generateEncryptionKeys();
  encryptionPublicKey.value = nextPublic;
  encryptionPrivateKey.value = nextPrivate;

  await profile.ensureProfileId();
  myProfile.value = profile.getPrivateProfileJson();
  await reauthAndReplay();
  uploadStatus.value = "New identity created.";
}

async function setProfile() {
  profile.setProfileMeta({ username: username.value });
  username.value = "";

  myProfile.value = profile.getPrivateProfileJson();
  init();
}

function downloadLedger() {
  if (!ledger.value) return;
  const head = ledger.value.head?.slice(0, 7) || "export";
  const filename = `concord-ledger-${head}.json`;
  const json = JSON.stringify(ledger.value, null, 2);
  downloadText(filename, json);
}

async function createNewLedger() {
  const confirmed = window.confirm(
    "Create a new ledger? This will replace the current working copy."
  );
  if (!confirmed) return;
  if (privateKey.value && publicKey.value) {
    await api.auth(privateKey.value, publicKey.value);
  }
  await api.create();
}

function triggerLedgerUpload() {
  ledgerUploadInputRef.value?.click();
}

async function handleLedgerUpload(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target?.files?.length) return;
  const file = target.files[0];
  target.value = "";

  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    window.alert("Invalid ledger JSON.");
    return;
  }

  const confirmed = window.confirm(
    "Upload this ledger? This will replace the current working copy."
  );
  if (!confirmed) return;

  await api.load(parsed, [], true, true);
}

async function deleteLedger() {
  const confirmed = window.confirm(
    "Delete the current ledger? This will permanently remove it from local storage."
  );
  if (!confirmed) return;
  await api.destroy();
  window.localStorage.removeItem(CORE_LEDGER_KEY);
  window.localStorage.removeItem(TAMPER_LEDGER_KEY);
  window.localStorage.removeItem(TAMPER_ACTIVE_KEY);
}
</script>
<template>
  <AppBootstrap>
    <div
      class="dark flex flex-col flex-1 w-screen h-screen overflow-auto font-mono bg-[image:var(--bg-pixpax)]"
    >
      <header
        class="sticky top-0 z-20 w-full backdrop-blur-[12px] border-b border-[var(--ui-border)]"
      >
        <div class="mx-auto flex items-center w-full justify-between px-4 py-2">
          <div class="flex items-center">
            <input
              ref="ledgerUploadInputRef"
              type="file"
              accept="application/json"
              class="hidden"
              @change="handleLedgerUpload"
            />
            <SplitButton>
              <template #primary>
                <button
                  class="flex-1 text-xs px-4 py-2 text-left cursor-pointer hover:bg-[var(--ui-primary)]/10 transition-colors"
                  @click="createNewLedger"
                >
                  Create new ledger
                </button>
              </template>
              <template #menu="{ closeMenu }">
                <button
                  class="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-[var(--ui-fg)]/5 transition-colors"
                  @click="
                    triggerLedgerUpload();
                    closeMenu();
                  "
                >
                  Upload ledger
                </button>
                <button
                  class="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-[var(--ui-fg)]/5 transition-colors"
                  @click="
                    downloadLedger();
                    closeMenu();
                  "
                >
                  Download ledger
                </button>
                <button
                  class="w-full text-left text-xs px-3 py-2 rounded-lg text-red-600 hover:bg-[var(--ui-critical)]/10 transition-colors"
                  @click="
                    deleteLedger();
                    closeMenu();
                  "
                >
                  Delete ledger
                </button>
              </template>
            </SplitButton>
          </div>
          <div class="relative" ref="userMenuRef">
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
                      placeholder="Username"
                      class="border border-[var(--ui-border)] px-4 py-2 rounded-full bg-[var(--ui-bg)]"
                    />
                    <button
                      class="border border-[var(--ui-border)] px-4 py-2 text-sm rounded-full"
                      @click="setProfile"
                    >
                      Set profile
                    </button>
                  </div>
                </div>

                <input
                  ref="profileUploadInputRef"
                  type="file"
                  accept="application/json"
                  class="hidden"
                  @change="handleProfileUpload"
                />
                <SplitButton
                  v-if="hasProfile"
                  :disabled="disabled"
                  menuWidth="w-64"
                >
                  <template #primary>
                    <button
                      type="button"
                      class="flex-1 text-left text-xs px-4 py-2 transition hover:opacity-90 disabled:opacity-50"
                      :disabled="disabled"
                      @click="downloadPublic"
                      title="Download your public profile (safe to share)"
                    >
                      Download public profile
                    </button>
                  </template>
                  <template #menu="{ closeMenu }">
                    <button
                      type="button"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-[var(--ui-fg)]/5 transition-colors disabled:opacity-50"
                      :disabled="disabled"
                      @click="
                        downloadPrivate();
                        closeMenu();
                      "
                      title="Download your private profile (contains secrets — do not share)"
                    >
                      Download private profile
                    </button>
                    <button
                      type="button"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-[var(--ui-fg)]/5 transition-colors"
                      @click="
                        triggerProfileUpload();
                        closeMenu();
                      "
                    >
                      Upload private profile
                    </button>
                    <button
                      type="button"
                      class="w-full text-left text-xs px-3 py-2 rounded-lg text-red-600 hover:bg-[var(--ui-critical)]/10 transition-colors"
                      @click="
                        resetIdentityAndProfile();
                        closeMenu();
                      "
                    >
                      Reset identity + profile
                    </button>
                  </template>
                </SplitButton>

                <p v-if="uploadError" class="text-xs text-red-600">
                  {{ uploadError }}
                </p>
                <p v-if="uploadStatus" class="text-xs text-green-600">
                  {{ uploadStatus }}
                </p>
              </div>
              <div class="p-2 flex gap-2 items-center">
                Impersonate
                <select
                  @change="impersonateUser"
                  class="flex-1 border border-[var(--ui-border)] p-1 rounded-sm"
                  :key="publicKeyPEM"
                >
                  <option disabled selected>...</option>
                  <option
                    v-for="_profile in Object.values(profiles)"
                    :key="_profile.private.profileId"
                    :value="JSON.stringify(_profile.private)"
                    :selected="isActiveProfile(_profile.private.profileId)"
                  >
                    {{ _profile.private?.metadata.username }}
                  </option>
                </select>
              </div>
              <button
                v-if="isImpersonating"
                @click="cancelImpersonate"
                class="px-2 py-1 text-xs rounded-full text-red-500"
              >
                Cancel impersonation
              </button>
            </div>
          </div>
        </div>
      </header>
      <header
        class="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center p-12"
      >
        <div
          class="w-full max-w-xl flex flex-col gap-4 items-center justify-center"
        >
          <PixPaxLogo />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 368 48"
            role="img"
            aria-label="PIXPAX"
            fill="var(--ui-fg)"
          >
            <!--
    Grid rules:
    - Each glyph is 3x3 squares
    - Each square = 16px
    - Glyph size = 48x48
    - Letter spacing = 16px
    - Total width = 6*48 + 5*16 = 368
  -->

            <defs>
              <!-- P (7 blocks): all filled except bottom-center (1,2) and bottom-right (2,2) -->
              <g id="G_P" class="px">
                <!-- row 0 -->
                <rect x="0" y="0" width="16" height="16" />
                <rect x="16" y="0" width="16" height="16" />
                <rect x="32" y="0" width="16" height="16" />
                <!-- row 1 -->
                <rect x="0" y="16" width="16" height="16" />
                <rect x="16" y="16" width="16" height="16" />
                <rect x="32" y="16" width="16" height="16" />
                <!-- row 2 (left only) -->
                <rect x="0" y="32" width="16" height="16" />
              </g>

              <!-- i (7 blocks): top row full + bottom row full + center (1,1) -->
              <g id="G_I" class="px">
                <!-- row 0 -->
                <rect x="0" y="0" width="16" height="16" />
                <rect x="16" y="0" width="16" height="16" />
                <rect x="32" y="0" width="16" height="16" />
                <!-- row 1 (center only) -->
                <rect x="16" y="16" width="16" height="16" />
                <!-- row 2 -->
                <rect x="0" y="32" width="16" height="16" />
                <rect x="16" y="32" width="16" height="16" />
                <rect x="32" y="32" width="16" height="16" />
              </g>

              <!-- X (5 blocks): corners + center -->
              <g id="G_X" class="px">
                <rect x="0" y="0" width="16" height="16" />
                <!-- (0,0) -->
                <rect x="32" y="0" width="16" height="16" />
                <!-- (2,0) -->
                <rect x="16" y="16" width="16" height="16" />
                <!-- (1,1) -->
                <rect x="0" y="32" width="16" height="16" />
                <!-- (0,2) -->
                <rect x="32" y="32" width="16" height="16" />
                <!-- (2,2) -->
              </g>

              <!-- A:
      - Top row: left empty, center filled, right empty
      - Middle row: all filled
      - Bottom row: left+right filled, center empty
    -->
              <g id="G_A" class="px">
                <!-- row 0 (center only) -->
                <rect x="16" y="0" width="16" height="16" />
                <!-- row 1 (full) -->
                <rect x="0" y="16" width="16" height="16" />
                <rect x="16" y="16" width="16" height="16" />
                <rect x="32" y="16" width="16" height="16" />
                <!-- row 2 (left + right) -->
                <rect x="0" y="32" width="16" height="16" />
                <rect x="32" y="32" width="16" height="16" />
              </g>
            </defs>

            <!-- Layout: P I X P A X with 16px letter spacing -->
            <!-- Step per glyph = 48 + 16 = 64 -->
            <g>
              <use href="#G_P" x="0" y="0" />
              <use href="#G_I" x="64" y="0" />
              <use href="#G_X" x="128" y="0" />
              <use href="#G_P" x="192" y="0" />
              <use href="#G_A" x="256" y="0" />
              <use href="#G_X" x="320" y="0" />
            </g>
          </svg>

          <p class="mt-4 text-xs text-[var(--ui-fg-muted)]">
            Open packs, collect pixels, trade with friends.
          </p>
        </div>
      </header>
      <WorkspaceStickerbook />
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
              >POWERED BY CONCORD</span
            >
            <Logo
              class="size-8 group-hover:-rotate-6 transition-all duration-300"
            />
          </a>
          <a
            href="mailto:sam@ternent.dev"
            class="flex items-end justify-center gap-3 opacity-80 hover:opacity-100 text-xs font-mono font-thin -translate-y-1 hover:-translate-y-0.5 group-hover:translate-x-1.5 transition-all duration-300"
          >
            sam@ternent.dev
          </a>
          <div
            class="flex flex-col items-center justify-center gap-2 font-sans text-xs"
          >
            <!-- <SThemeToggle v-model="themeMode" size="sm" /> -->
            <SThemeToggle v-model="theme" show-dropdown size="xs" />
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

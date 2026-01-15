<script setup lang="ts">
import { shallowRef, computed } from "vue";
import { onClickOutside, useLocalStorage } from "@vueuse/core";
import {
  createIdentity,
  exportPublicKeyAsPem,
  exportPrivateKeyAsPem,
} from "ternent-identity";
import { stripIdentityKey } from "ternent-utils";
import { useLedger } from "../ledger/useLedger";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import { useIdentity } from "../../module/identity/useIdentity";
import { useEncryption } from "../../module/encryption/useEncryption";
import {
  type PublicProfile,
  type PrivateProfile,
  useProfile,
} from "../../module/profile/useProfile";

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
    // example filename:
    // concord-profile.private.3edc6ed685.json
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
const { impersonate: impersonateEncryption } = useEncryption();
const profile = useProfile();

const myProfile = useLocalStorage(
  "concord/profile/me",
  profile.getPrivateProfileJson()
);

const contentArea = shallowRef<HTMLElement | null>();
const userMenuRef = shallowRef<HTMLElement | null>();

const genesisId = computed(() =>
  (Object.keys(ledger.value?.commits || {})[0] || "").substring(0, 7)
);

const userMenuOpen = shallowRef(false);
const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value;
};
// Close user menu when clicking outside
onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false;
});

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

  // allow the click to resolve before revoking
  setTimeout(() => URL.revokeObjectURL(url), 250);
}

async function downloadPublic() {
  // ensure profileId is derived if needed
  await profile.ensureProfileId();

  const files = profile.getDownloadFiles({ pretty: true });
  downloadText(files.public.filename, files.public.json);
}

async function downloadPrivate() {
  // ensure profileId is derived if needed
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

function isActiveProfile(profileId) {
  return profile.profileId.value === profileId;
}

async function reauthAndReplay() {
  if (!publicKey.value || !privateKey.value) return;
  await api.auth(privateKey.value, publicKey.value);
  await api.replay();
}

async function generateNewIdentity(e?: Event) {
  if (e) {
    e.currentTarget.classList.add("spin");
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

async function setProfile() {
  profile.setProfileMeta({ username: username.value });
  username.value = "";

  myProfile.value = profile.getPrivateProfileJson();
  init();
}
</script>
<template>
  <div
    class="max-h-screen max-w-screen w-screen h-screen overflow-hidden flex flex-col"
    :key="profile.profileId"
  >
    <header
      class="sticky top-0 z-20 bg-[color-mix(in srgb, var(--paper) 58%, transparent)] backdrop-blur-[12px] border-b-[1px] border-[var(--rule)] w-full"
    >
      <div class="mx-auto px-4 py-2 flex items-center w-full justify-between">
        <div class="flex items-center gap-4 w-64">
          <RouterLink
            class="text-[var(--ink)] font-[900] text-xl no-underline tracking-[-0.08em] brand"
            to="/"
            >Concord</RouterLink
          ><span class="text-sm">DEMO</span>
        </div>

        <nav class="flex items-center flex-1 justify-between text-xs">
          <div>@{{ genesisId }}</div>
          <div class="relative" ref="userMenuRef">
            <!-- Compact user avatar button -->
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
              <IdentityAvatar :identity="publicKeyPEM" size="xs" />
            </button>

            <div
              v-if="userMenuOpen"
              class="border border-[var(--rule)] absolute p-2 bg-[var(--paper2)] rounded mt-2 w-64 right-0 shadow"
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
                      class="flex flex-col items-center gap-2 rounded-lg bg-[var(--paper)] border border-[var(--rule)]"
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
                        (e) => e.currentTarget.classList.remove('spin')
                      "
                      class="spin-target size-8 flex items-center justify-center rounded-full border border-[var(--rule)] bg-[var(--paper)] p-2 mx-auto"
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
                      class="border border-[var(--rule)] px-4 py-2 rounded-full bg-[var(--paper)]"
                    />
                    <button
                      class="border border-[var(--rule)] px-4 py-2 text-sm rounded-full"
                      @click="setProfile"
                    >
                      Set profile
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  class="rounded-full border px-3 py-2 text-sm transition hover:opacity-90 disabled:opacity-50 border-[var(--rule)]"
                  :disabled="disabled"
                  @click="downloadPublic"
                  title="Download your public profile (safe to share)"
                >
                  Download public profile
                </button>

                <button
                  type="button"
                  class="rounded-full border px-3 py-2 text-sm transition hover:opacity-90 disabled:opacity-50 border-[var(--rule)]"
                  :disabled="disabled"
                  @click="downloadPrivate"
                  title="Download your private profile (contains secrets — do not share)"
                >
                  Download private profile
                </button>
              </div>
              <div class="p-2 flex gap-2 items-center">
                Impersonate
                <select
                  @change="impersonateUser"
                  class="flex-1 border border-[var(--rule)] p-1 rounded-sm"
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
        </nav>
      </div>
    </header>
    <div
      ref="contentArea"
      class="flex-1 h-full relative flex z-10 overflow-hidden"
    >
      <slot name="left-side" />

      <slot name="drawer" />
      <div class="flex flex-col flex-1 w-full h-full overflow-hidden">
        <div class="flex flex-1 h-full w-full overflow-auto">
          <div class="flex-1 relative">
            <slot />
          </div>
          <div
            v-if="$slots['right-side']"
            class="w-64 border-l border-[var(--rule)] sticky top-0"
          >
            <slot name="right-side" />
          </div>
        </div>

        <slot name="console" v-bind="{ container: contentArea }" />
      </div>
    </div>
  </div>
</template>
<style>
.user-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  width: 20rem;
  background: oklch(var(--muted) / 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid oklch(var(--b3));
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px oklch(var(--bc) / 0.1);
  z-index: 50;
  overflow: hidden;
}
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

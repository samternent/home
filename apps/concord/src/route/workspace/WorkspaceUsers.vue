<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import {
  type PublicProfile,
  type PrivateProfile,
  useProfile,
} from "../../module/profile/useProfile";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";

const profileModules = import.meta.glob(
  "../../module/profile/samples/concord-profile.*.*.json",
  {
    eager: true,
    import: "default",
  }
) as Record<string, any>;

const { api, bridge } = useLedger();
const { publicKeyPEM } = useIdentity();
const profile = useProfile();

type UserEntry = {
  entryId: string;
  data: {
    id: string;
    publicEncryptionKey: string;
    publicIdentityKey: string;
    name?: string;
  };
};

type SampleProfilePair = {
  public?: PublicProfile;
  private?: PrivateProfile;
};

const users = computed<UserEntry[]>(
  () =>
    Object.values(bridge.collections.byKind.value?.users || {}) as UserEntry[]
);

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);

const isJoined = computed(() =>
  users.value.find(
    ({ data: { publicIdentityKey: pk } }) =>
      pk.replace(/\s/g, "") === publicKeyPEM.value.replace(/\s/g, "")
  )
);

const profileUsername = computed(() => {
  const meta = profile.meta.value as { username?: string };
  return typeof meta.username === "string" ? meta.username : "";
});

async function joinMe() {
  const me = profile.getPublicProfile();
  await api.addAndStage({
    kind: "users",
    payload: {
      id: me.profileId,
      publicEncryptionKey: me.encryption.recipients[0],
      publicIdentityKey: me.identity.publicKey,
      name: me.metadata.username,
    },
  });
}
async function join(_profile: PublicProfile) {
  await api.addAndStage({
    kind: "users",
    payload: {
      id: _profile.profileId,
      publicEncryptionKey: _profile.encryption.recipients[0],
      publicIdentityKey: _profile.identity.publicKey,
      name: _profile.metadata.username,
    },
  });
}

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

const availableUsers = computed<PublicProfile[]>(() =>
  Object.values(profiles.value).flatMap((profile) => {
    const publicProfile = profile.public;
    if (!publicProfile) return [];

    const alreadyJoined = users.value.some(
      (user) =>
        publicProfile.profileId.substring(0, 10) ===
        user.data.id.substring(0, 10)
    );

    return alreadyJoined ? [] : [publicProfile];
  })
);

const uploadError = shallowRef("");
const uploadedProfile = shallowRef<PublicProfile | PrivateProfile | null>(null);
const uploadedFileName = shallowRef("");
const isUploading = ref(false);

function getEncryptionRecipient(profile: PublicProfile | PrivateProfile) {
  if (Array.isArray(profile.encryption?.recipients)) {
    return profile.encryption.recipients[0] ?? null;
  }
  return profile.encryption?.publicKey ?? null;
}

async function handleProfileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploadError.value = "";
  uploadedFileName.value = file.name;
  isUploading.value = true;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!parsed?.profileId || !parsed?.identity?.publicKey) {
      throw new Error("Missing required profile fields.");
    }

    uploadedProfile.value = parsed as PublicProfile | PrivateProfile;
  } catch (error) {
    uploadError.value = "Could not read that profile file.";
    uploadedProfile.value = null;
  } finally {
    isUploading.value = false;
  }
}

async function addUploadedProfile() {
  if (!uploadedProfile.value) return;
  const recipient = getEncryptionRecipient(uploadedProfile.value);

  if (!recipient) {
    uploadError.value = "Profile missing encryption details.";
    return;
  }

  await api.addAndStage({
    kind: "users",
    payload: {
      id: uploadedProfile.value.profileId,
      publicEncryptionKey: recipient,
      publicIdentityKey: uploadedProfile.value.identity.publicKey,
      name: uploadedProfile.value.metadata?.username ?? "Unnamed",
    },
  });

  uploadedProfile.value = null;
  uploadedFileName.value = "";
}
</script>
<template>
  <div class="mx-auto w-full max-w-160 flex flex-col flex-1 gap-4">
    <header class="sticky top-0 bg-[var(--ui-bg)] py-2 z-10">
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl">Users.</h1>
          <p class="text-sm opacity-70">{{ users.length }} members</p>
        </div>
      </div>
    </header>

    <section class="flex-1 flex flex-col gap-3 min-h-0">
      <div class="overflow-auto">
        <table class="w-full">
          <thead class="text-left text-xs uppercase tracking-wide opacity-60">
            <tr class="border-b border-[var(--ui-border)]">
              <th class="p-3">Identity</th>
              <th class="p-3">Name</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr v-for="user in users" :key="user.entryId">
              <td class="p-3">
                <IdentityAvatar
                  :identity="user.data.publicIdentityKey"
                  size="sm"
                />
              </td>
              <td class="p-3 text-sm">
                {{ user.data.name }}
              </td>
            </tr>
            <tr v-if="!users.length">
              <td class="p-4 text-sm opacity-60" colspan="2">No users yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="!isJoined"
      class="border border-[var(--ui-border)] rounded-2xl p-6 flex flex-col items-center gap-4"
    >
      <div v-if="profileUsername" class="flex flex-col items-center gap-3">
        <div class="text-lg">Join as {{ profileUsername }}</div>
        <button
          class="border border-[var(--ui-border)] px-4 py-2 text-sm rounded-full"
          @click="joinMe"
        >
          Join
        </button>
      </div>
      <div v-else class="text-sm opacity-70">
        Set a username in the top right.
      </div>
    </div>
    <div v-else-if="canAddItem" class="flex flex-col gap-3">
      <div class="border border-[var(--ui-border)] rounded-2xl p-4">
        <h2 class="text-sm uppercase tracking-wide opacity-60">
          Add from profile
        </h2>
        <div class="mt-3 flex flex-col gap-3">
          <input
            type="file"
            accept=".json,application/json"
            class="text-sm"
            @change="handleProfileUpload"
          />
          <div
            v-if="uploadedFileName"
            class="flex items-center justify-between gap-2 text-sm"
          >
            <span class="opacity-70">{{ uploadedFileName }}</span>
            <button
              class="border border-[var(--ui-border)] px-4 py-2 rounded-full text-xs"
              :disabled="!uploadedProfile || isUploading"
              @click="addUploadedProfile"
            >
              Add user
            </button>
          </div>
          <p v-if="uploadError" class="text-xs text-red-500" role="alert">
            {{ uploadError }}
          </p>
        </div>
      </div>
      <template v-if="availableUsers.length">
        <div class="border border-[var(--ui-border)] rounded-2xl p-4">
          <h2 class="text-sm uppercase tracking-wide opacity-60">Demo users</h2>
          <ul class="flex flex-wrap gap-2 mt-3">
            <li
              v-for="profile in availableUsers"
              :key="profile.profileId"
              class="flex"
            >
              <button
                class="flex gap-2 items-center py-2 px-4 border border-[var(--ui-border)] rounded-full text-sm"
                @click="join(profile)"
              >
                Add {{ profile.metadata.username }}
                <IdentityAvatar
                  :identity="profile.identity.publicKey"
                  size="xs"
                />
              </button>
            </li>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>

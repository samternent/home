<script setup lang="ts">
import { computed } from "vue";
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
    profiles[id][visibility as "public" | "private"] =
      data as PublicProfile | PrivateProfile;
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
</script>
<template>
  <div class="p-4 mx-auto max-w-140 w-full">
    <h1>Users</h1>

    <table class="w-full">
      <thead>
        <tr>
          <th class="text-left p-2">Identity</th>
          <th class="text-left p-2">Name</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="user in users"
          :key="user.entryId"
          class="border-t border-[var(--rule)] py-2"
        >
          <td class="p-2">
            <IdentityAvatar :identity="user.data.publicIdentityKey" size="sm" />
          </td>
          <td class="p-2">
            {{ user.data.name }}
          </td>
        </tr>
      </tbody>
    </table>
    <hr class="border-[var(--rule)] my-8" />
    <div
      v-if="!isJoined"
      class="border-b border-[var(--rule)] w-full flex flex-col justify-center items-center absolute left-0 top-0 bottom-0 right-0 backdrop-blur-md"
    >
      <div v-if="profileUsername" class="">
        <div class="flex items-center p-2 text-xl">
          Join as {{ profileUsername }}
        </div>
        <div class="flex flex-col p-2 gap-2">
          <button
            class="border border-[var(--rule)] px-4 py-2 text-sm rounded-full"
            @click="joinMe"
          >
            Join
          </button>
        </div>
      </div>
      <div v-else>Set username in the top right</div>
    </div>
    <div v-else-if="canAddItem" class="">
      <template v-if="availableUsers.length">
        <h2>Demo users</h2>
        <ul class="flex gap-2 my-2">
          <li
            v-for="profile in availableUsers"
            :key="profile.profileId"
            class="flex gap-2"
          >
            <button
              class="flex gap-2 items-center py-2 px-4 border border-[var(--rule)] rounded-full"
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
      </template>
    </div>
  </div>
</template>

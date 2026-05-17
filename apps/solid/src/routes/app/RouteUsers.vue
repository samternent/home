<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useAppApi } from "@/app/api";
import { shortIdentityKey, toDidKeyFromPublicKey } from "@/app/plugins/identityKey";
import { Badge, Button, Card, Dialog, FileInput, Input, Textarea } from "ternent-ui/primitives";
import {
  FormField,
  IdentityGlyph,
  IdentityHandle,
  resolveIdentityGlyphInput,
  type IdentityGlyphInput,
} from "ternent-ui/patterns";

const appApi = useAppApi();

const createIdentityFile = ref<File | null>(null);
const createIdentityFilename = ref("");
const createOpen = ref(false);
const createError = ref<string | null>(null);
const createSuccess = ref<string | null>(null);

const pageError = ref<string | null>(null);
const profileError = ref<string | null>(null);
const profileSaved = ref(false);

const editModalOpen = ref(false);
const editIdentityKey = ref<string | null>(null);

const profileDisplayName = ref("");
const profileBio = ref("");
const profileAvatarUrl = ref("");

const users = computed(() => appApi.users.all());
const permissions = computed(() => appApi.permissions.all());
const profiles = computed(() => appApi.profiles.all());
const activeIdentity = computed(() => appApi.identity.activeIdentity.value);
const activeIdentityId = computed(() => activeIdentity.value?.identityId ?? "");
const activeIdentityKey = computed(() => activeIdentity.value?.identityKey ?? "");
const stagedCount = computed(() => appApi.getState().stagedCount);

const profilesByKey = computed(
  () => new Map(profiles.value.map((profile) => [profile.identityKey, profile])),
);
const usersByKey = computed(() => new Map(users.value.map((user) => [user.identityKey, user])));

function resolveUserDisplayName(identityKey: string, label: string | null): string {
  const profile = profilesByKey.value.get(identityKey);
  return profile?.displayName ?? label ?? shortIdentityKey(identityKey);
}

function resolveAddedByLabel(addedBy: string): string {
  if (addedBy === activeIdentityKey.value || addedBy === activeIdentityId.value) {
    return "You";
  }
  const projected = usersByKey.value.get(addedBy);
  if (!projected) {
    return shortIdentityKey(addedBy);
  }
  return resolveUserDisplayName(projected.identityKey, projected.label);
}

const groupCountByIdentity = computed(() => {
  const counts = new Map<string, number>();

  permissions.value.forEach((permission) => {
    const memberKeys = new Set<string>();
    permission.members.forEach((member) => {
      const projected = usersByKey.value.get(member.memberId);
      const canonicalMemberId =
        projected?.identityKey ??
        (member.memberId === activeIdentityId.value ? activeIdentityKey.value : member.memberId);
      memberKeys.add(canonicalMemberId);
    });

    memberKeys.forEach((memberKey) => {
      counts.set(memberKey, (counts.get(memberKey) ?? 0) + 1);
    });
  });

  return counts;
});

const collaborators = computed(() =>
  users.value.map((user) => {
    const isActive = user.identityKey === activeIdentityKey.value;
    const groupCount = groupCountByIdentity.value.get(user.identityKey) ?? 0;
    return {
      ...user,
      displayName: resolveUserDisplayName(user.identityKey, user.label),
      shortIdentity: shortIdentityKey(user.identityKey),
      relationshipLabel: isActive ? "You" : "Workspace collaborator",
      addedByLabel: resolveAddedByLabel(user.addedBy),
      groupCount,
      isActive,
    };
  }),
);
const showCreateForm = computed(() => createOpen.value || users.value.length === 0);
const canCollapseCreateForm = computed(() => users.value.length > 0);

const editUser = computed(() => {
  if (!editIdentityKey.value) {
    return null;
  }
  return appApi.users.byIdentityKey(editIdentityKey.value);
});

const editProfile = computed(() => {
  if (!editUser.value) {
    return null;
  }
  return appApi.profiles.byIdentityKey(editUser.value.identityKey);
});

const canEditSelectedProfile = computed(
  () => Boolean(editUser.value) && editUser.value?.identityKey === activeIdentityKey.value,
);

watch(
  editProfile,
  (nextProfile) => {
    profileDisplayName.value = nextProfile?.displayName ?? "";
    profileBio.value = nextProfile?.bio ?? "";
    profileAvatarUrl.value = nextProfile?.avatarUrl ?? "";
    profileError.value = null;
    profileSaved.value = false;
  },
  { immediate: true },
);

watch(editModalOpen, (nextOpen) => {
  if (!nextOpen) {
    editIdentityKey.value = null;
    profileError.value = null;
    profileSaved.value = false;
  }
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function resolveIdentityKeyFromFilePayload(payload: unknown): string {
  const candidates: unknown[] = [payload];

  if (isRecord(payload)) {
    candidates.push(payload.identity, payload.identityKey, payload.publicKey);

    if (isRecord(payload.identity)) {
      candidates.push(
        payload.identity.identity,
        payload.identity.identityKey,
        payload.identity.publicKey,
      );
    }

    if (isRecord(payload.data)) {
      candidates.push(payload.data, payload.data.identity, payload.data.identityKey);
    }
  }

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) {
      continue;
    }
    const resolved = resolveIdentityGlyphInput(candidate as IdentityGlyphInput);
    if (!resolved.fallback) {
      return toDidKeyFromPublicKey(resolved.canonicalIdentity);
    }
  }

  throw new Error(
    "Identity file must include valid public key material (e.g. identity.publicKey or identityKey).",
  );
}

function clearCreateForm(): void {
  createIdentityFile.value = null;
  createIdentityFilename.value = "";
}

async function createUser(): Promise<void> {
  createError.value = null;
  createSuccess.value = null;

  if (!createIdentityFile.value) {
    createError.value = "Choose a Concord identity file first.";
    return;
  }

  try {
    const text = await createIdentityFile.value.text();
    const payload = JSON.parse(text) as unknown;
    const identityKey = resolveIdentityKeyFromFilePayload(payload);

    await appApi.users.create({ identityKey });
    clearCreateForm();
    createSuccess.value = "Collaborator add staged.";
    createOpen.value = false;
  } catch (error) {
    createError.value = error instanceof Error ? error.message : String(error);
  }
}

function openEditModal(identityKey: string): void {
  editIdentityKey.value = identityKey;
  editModalOpen.value = true;
}

async function saveProfile(): Promise<void> {
  profileSaved.value = false;
  profileError.value = null;

  if (!editUser.value) {
    return;
  }

  try {
    await appApi.profiles.upsert({
      identityKey: editUser.value.identityKey,
      displayName: profileDisplayName.value || null,
      bio: profileBio.value || null,
      avatarUrl: profileAvatarUrl.value || null,
    });
    profileSaved.value = true;
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : String(error);
  }
}

onMounted(async () => {
  pageError.value = null;

  try {
    await appApi.load();
    await appApi.identity.ensureActiveIdentity();
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : String(error);
  }
});
</script>

<template>
  <section class="mx-auto h-full min-h-0 w-full p-6" data-test="users-v2">
    <p class="sr-only" data-test="users-v2-status">{{ appApi.status.value }}</p>

    <header class="mb-6 space-y-1">
      <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">Users</p>
      <h1 class="m-0 text-2xl font-semibold text-[var(--ui-fg)]">Workspace collaborators</h1>
      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
        Trusted identities available to permissions and encrypted access groups in this workspace.
      </p>
    </header>

    <p
      v-if="pageError"
      class="m-0 mb-3 text-sm text-[var(--ui-critical)]"
      data-test="users-v2-page-error"
    >
      {{ pageError }}
    </p>

    <div class="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section
        class="space-y-4 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4"
      >
        <header class="space-y-3">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div class="space-y-1">
              <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">
                Collaborators
              </p>
              <h2 class="m-0 text-2xl font-semibold text-[var(--ui-fg)]">
                Trusted workspace identities
              </h2>
            </div>
            <div class="flex items-center gap-2">
              <Badge tone="primary" variant="soft" size="sm">
                {{ collaborators.length }}
                {{ collaborators.length === 1 ? "collaborator" : "collaborators" }}
              </Badge>
              <Badge tone="secondary" variant="soft" size="sm"> {{ stagedCount }} staged </Badge>
            </div>
          </div>
          <p class="m-0 max-w-3xl text-sm text-[var(--ui-fg-muted)]">
            Collaborators are imported from Concord identity files and become available to access
            groups and encrypted permissions.
          </p>
          <div class="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-test="user-create-toggle"
              :disabled="!canCollapseCreateForm && showCreateForm"
              @click="createOpen = !createOpen"
            >
              {{ showCreateForm && canCollapseCreateForm ? "Close" : "Add collaborator" }}
            </Button>
            <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
              Manual did:key entry is not supported.
            </p>
          </div>
        </header>

        <form
          v-show="showCreateForm"
          class="space-y-3 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] p-3"
          data-test="user-create-form"
          @submit.prevent="createUser"
        >
          <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">
            Import collaborator identity
          </p>
          <FileInput
            v-model="createIdentityFile"
            v-model:filename="createIdentityFilename"
            accept="application/json,.json"
            variant="default"
            size="sm"
            placeholder="No identity file selected"
            data-test="user-create-identity-file"
          />

          <div class="flex items-center justify-between gap-2">
            <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
              Upload a Concord identity JSON file to add a trusted collaborator.
            </p>
            <Button type="submit" variant="secondary" size="sm" data-test="user-create-submit">
              Add collaborator
            </Button>
          </div>

          <p
            v-if="createError"
            class="m-0 text-sm text-[var(--ui-critical)]"
            data-test="user-create-error"
          >
            {{ createError }}
          </p>

          <p
            v-if="createSuccess && !createError"
            class="m-0 text-sm text-[var(--ui-success)]"
            data-test="user-create-success"
          >
            {{ createSuccess }}
          </p>
        </form>

        <div
          v-if="collaborators.length === 0"
          class="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)]/50 p-5 text-sm text-[var(--ui-fg-muted)]"
          data-test="users-empty"
        >
          No collaborators yet. Add your first trusted identity to start sharing workspace access.
        </div>

        <div v-else data-test="users-list">
          <ul
            class="m-0 list-none divide-y divide-[var(--ui-border)] rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)]/35 p-0"
          >
            <li
              v-for="user in collaborators"
              :key="user.identityKey"
              class="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-[var(--ui-tonal-tertiary)]"
              :data-test="`user-row-${user.identityKey}`"
            >
              <IdentityGlyph
                :identity="user.identityKey"
                size="xs"
                :data-test="`user-row-glyph-${user.identityKey}`"
              />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="m-0 truncate text-sm font-medium text-[var(--ui-fg)]">
                    {{ user.displayName }}
                  </p>
                  <Badge v-if="user.isActive" tone="secondary" variant="soft" size="xs">
                    You
                  </Badge>
                  <Badge tone="success" variant="soft" size="xs"> Verified identity </Badge>
                </div>
                <p class="m-0 truncate text-xs text-[var(--ui-fg-muted)]">
                  {{ user.relationshipLabel }} · Added by {{ user.addedByLabel }} ·
                  {{ user.groupCount }} {{ user.groupCount === 1 ? "group" : "groups" }}
                </p>
                <p class="m-0 truncate font-mono text-xs text-[var(--ui-fg-muted)]">
                  {{ user.shortIdentity }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="tertiary"
                  size="xs"
                  :data-test="`user-edit-open-${user.identityKey}`"
                  @click="openEditModal(user.identityKey)"
                >
                  View identity
                </Button>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <aside
        class="space-y-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3"
      >
        <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">
          Trust context
        </p>
        <Card variant="subtle" padding="md" class="space-y-2">
          <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">Local-first identity registry</p>
          <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
            Collaborators exist in the local ledger projection and are used by access groups and
            encrypted permissions across the workspace.
          </p>
        </Card>
        <Card variant="subtle" padding="md" class="space-y-2">
          <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">Active identity</p>
          <IdentityHandle
            :identity="activeIdentityKey"
            :label="activeIdentity?.label ?? 'Identity locked'"
            :identity-text="shortIdentityKey(activeIdentityKey)"
            size="sm"
          />
        </Card>
      </aside>
    </div>

    <Dialog
      v-model:open="editModalOpen"
      size="md"
      title="Edit profile metadata"
      description="Self-service only. The active identity can edit only its own profile."
    >
      <div v-if="editUser" class="space-y-4" data-test="user-edit-modal">
        <IdentityHandle
          :identity="editUser.identityKey"
          :label="resolveUserDisplayName(editUser.identityKey, editUser.label)"
          :identity-text="shortIdentityKey(editUser.identityKey)"
          size="sm"
          data-test="user-detail-glyph"
        />

        <form class="space-y-3" data-test="profile-upsert-form" @submit.prevent="saveProfile">
          <FormField label="Display name">
            <template #default="{ id, describedBy }">
              <Input
                :id="id"
                v-model="profileDisplayName"
                data-test="profile-display-name"
                type="text"
                :aria-describedby="describedBy"
                :disabled="!canEditSelectedProfile"
                placeholder="Sam Ternent"
              />
            </template>
          </FormField>

          <FormField label="Bio">
            <template #default="{ id, describedBy }">
              <Textarea
                :id="id"
                v-model="profileBio"
                data-test="profile-bio"
                :aria-describedby="describedBy"
                :disabled="!canEditSelectedProfile"
                :rows="4"
                resize="vertical"
                placeholder="Builder of replayable systems."
              />
            </template>
          </FormField>

          <FormField label="Avatar URL">
            <template #default="{ id, describedBy }">
              <Input
                :id="id"
                v-model="profileAvatarUrl"
                data-test="profile-avatar-url"
                type="text"
                :aria-describedby="describedBy"
                :disabled="!canEditSelectedProfile"
                placeholder="https://..."
              />
            </template>
          </FormField>

          <p
            v-if="!canEditSelectedProfile"
            class="m-0 text-sm text-[var(--ui-fg-muted)]"
            data-test="profile-edit-disabled"
          >
            This profile can only be edited by its owner identity.
          </p>

          <p
            v-if="profileError"
            class="m-0 text-sm text-[var(--ui-critical)]"
            data-test="profile-upsert-error"
          >
            {{ profileError }}
          </p>

          <p
            v-if="profileSaved && !profileError"
            class="m-0 text-sm text-[var(--ui-success)]"
            data-test="profile-upsert-success"
          >
            Profile change staged.
          </p>

          <div class="flex items-center justify-between gap-2">
            <Button type="button" variant="tertiary" @click="editModalOpen = false"> Close </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              data-test="profile-upsert-submit"
              :disabled="!canEditSelectedProfile"
            >
              Save profile
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  </section>
</template>

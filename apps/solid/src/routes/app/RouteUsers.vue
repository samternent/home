<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useAppApi } from "@/app/api";
import { shortIdentityKey, toDidKeyFromPublicKey } from "@/app/plugins/identityKey";
import { Button, Dialog, FileInput, Input, Textarea } from "ternent-ui/primitives";
import {
  FormField,
  IdentityGlyph,
  IdentityHandle,
  ListWorkspaceLayout,
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

const profilesByKey = computed(
  () => new Map(profiles.value.map((profile) => [profile.identityKey, profile])),
);
const usersByKey = computed(() => new Map(users.value.map((user) => [user.identityKey, user])));

function resolveUserDisplayName(identityKey: string, label: string | null): string {
  const profile = profilesByKey.value.get(identityKey);
  return profile?.displayName ?? label ?? shortIdentityKey(identityKey);
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
      groupCount,
      isActive,
    };
  }),
);
const filteredCollaborators = computed(() => collaborators.value);
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
  <section class="h-full min-h-0 w-full" data-test="users-v2">
    <p class="sr-only" data-test="users-v2-status">{{ appApi.status.value }}</p>

    <p
      v-if="pageError"
      class="m-0 border-b border-[var(--ui-border)] px-6 py-3 text-sm text-[var(--ui-critical)] md:px-8"
      data-test="users-v2-page-error"
    >
      {{ pageError }}
    </p>

    <ListWorkspaceLayout :show-rail="false" data-test-prefix="users-layout">
      <section class="flex min-h-0 flex-1 flex-col">
        <header class="flex h-20 shrink-0 items-center justify-between border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_92%,transparent)] px-6 md:px-8">
          <div>
            <h2 class="m-0 text-[28px] font-semibold tracking-[-0.035em] text-[var(--ui-fg)]">Users</h2>
            <div class="mt-1 flex items-center gap-2 text-xs font-semibold text-[var(--ui-fg-muted)]">
              <span>{{ filteredCollaborators.length }} collaborator{{ filteredCollaborators.length === 1 ? "" : "s" }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Button type="button" size="sm" variant="secondary" @click="createOpen = true">
              Import
            </Button>
            <Button
              type="button"
              size="sm"
              variant="primary"
              data-test="user-create-toggle"
              :disabled="!canCollapseCreateForm && showCreateForm"
              @click="createOpen = !createOpen"
            >
              {{ showCreateForm && canCollapseCreateForm ? "Close" : "Add user" }}
            </Button>
          </div>
        </header>

        <form
          v-show="showCreateForm"
          class="space-y-3 border-b border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)]/55 px-6 py-3 md:px-8"
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
          class="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--ui-primary-muted)_42%,transparent),transparent_35%)]"
          data-test="users-layout-scroll"
        >
          <div v-if="filteredCollaborators.length > 0" data-test="users-list">
            <div
              class="sticky top-0 grid h-11 grid-cols-[minmax(260px,1fr)_180px_140px] items-center border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] px-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)] backdrop-blur md:px-8"
              data-test="users-layout-table-head"
            >
              <div>User</div>
              <div>Access</div>
              <div class="text-right">Action</div>
            </div>
            <article
              v-for="user in filteredCollaborators"
              :key="user.identityKey"
              class="group grid min-h-[88px] grid-cols-[minmax(260px,1fr)_180px_140px] items-center border-b border-[var(--ui-border)] bg-transparent px-6 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--ui-tonal-tertiary)_78%,transparent)] md:px-8"
              :data-test="`user-row-${user.identityKey}`"
            >
              <div class="flex min-w-0 items-center gap-4">
                <IdentityGlyph
                  :identity="user.identityKey"
                  size="sm"
                  :data-test="`user-row-glyph-${user.identityKey}`"
                />
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ui-fg)]">{{ user.displayName }}</span>
                    <span
                      v-if="user.isActive"
                      class="rounded-full border border-[color-mix(in_srgb,var(--ui-primary)_22%,var(--ui-border))] bg-[var(--ui-primary-muted)] px-2 py-0.5 text-[11px] font-bold text-[var(--ui-primary)]"
                    >
                      You
                    </span>
                    <span class="rounded-full border border-[color-mix(in_srgb,var(--ui-success)_22%,var(--ui-border))] bg-[var(--ui-success-muted)] px-2 py-0.5 text-[11px] font-bold text-[var(--ui-success)]">
                      Verified
                    </span>
                  </div>
                  <div class="mt-1 truncate text-[13px] font-medium text-[var(--ui-fg-muted)]">
                    {{ user.displayName }} · {{ user.shortIdentity }}
                  </div>
                </div>
              </div>
              <div>
                <span class="rounded-full border border-[color-mix(in_srgb,var(--ui-primary)_22%,var(--ui-border))] bg-[var(--ui-primary-muted)] px-2.5 py-1 text-xs font-bold text-[var(--ui-primary)]">
                  {{ user.groupCount > 0 ? `${user.groupCount} group${user.groupCount === 1 ? "" : "s"}` : "No groups" }}
                </span>
              </div>
              <button
                type="button"
                class="justify-self-end rounded-xl px-3 py-2 text-xs font-bold tracking-[0.02em] text-[var(--ui-fg-muted)] opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-[var(--ui-surface)] hover:text-[var(--ui-fg)]"
                :data-test="`user-edit-open-${user.identityKey}`"
                @click="openEditModal(user.identityKey)"
              >
                View
              </button>
            </article>
          </div>

          <p
            v-else-if="collaborators.length === 0"
            class="m-0 border-b border-[var(--ui-border)] px-6 py-8 text-sm text-[var(--ui-fg-muted)] md:px-8"
            data-test="users-empty"
          >
            No collaborators yet. Add your first trusted identity to start sharing workspace access.
          </p>
          <p
            v-else
            class="m-0 border-b border-[var(--ui-border)] px-6 py-8 text-sm text-[var(--ui-fg-muted)] md:px-8"
          >
            No collaborators in this view.
          </p>
        </div>
      </section>
    </ListWorkspaceLayout>

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

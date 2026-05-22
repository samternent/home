<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppApi } from "@/app/api";
import { shortIdentityKey } from "@/app/plugins/identityKey";
import { Button, Input } from "ternent-ui/primitives";
import { IdentityGlyph, ListWorkspaceLayout } from "ternent-ui/patterns";

const appApi = useAppApi();
const route = useRoute();
const router = useRouter();

const createTitle = ref("");
const createOpen = ref(false);
const createError = ref<string | null>(null);
const pageError = ref<string | null>(null);
const memberActionError = ref<string | null>(null);
const showGrantPanel = ref(false);

const permissions = computed(() => appApi.permissions.all());
const users = computed(() => appApi.users.all());
const profiles = computed(() => appApi.profiles.all());
const activeIdentityId = computed(() => appApi.identity.activeIdentity.value?.identityId ?? "");
const activeIdentityKey = computed(() => appApi.identity.activeIdentity.value?.identityKey ?? "");
const activeIdentityLabel = computed(
  () => appApi.identity.activeIdentity.value?.label ?? "Identity locked",
);

type PermissionNavItem = {
  id: string;
  title: string;
  memberCount: number;
  active: boolean;
  dataTest: string;
};

const selectedPermissionKey = computed(() => {
  const raw = route.params.permissionKey;
  return typeof raw === "string" ? raw : null;
});

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "permission"
  );
}

function basePermissionPathKey(permissionId: string, index: number): string {
  const parts = permissionId.split(":");
  const slug = slugify(parts[1] ?? `p${index + 1}`).slice(0, 14) || `p${index + 1}`;
  const fingerprint = (parts[3] ?? "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toLowerCase();
  return fingerprint ? `${slug}-${fingerprint}` : slug;
}

const permissionRouteState = computed(() => {
  const keyToId = new Map<string, string>();
  const navItems: PermissionNavItem[] = [];

  permissions.value.forEach((permission, index) => {
    const baseKey = basePermissionPathKey(permission.id, index);
    let key = baseKey;
    let duplicate = 2;

    while (keyToId.has(key)) {
      key = `${baseKey}-${duplicate}`;
      duplicate += 1;
    }

    keyToId.set(key, permission.id);

    navItems.push({
      id: key,
      title: permission.title,
      memberCount: permission.members.length,
      active: key === selectedPermissionKey.value,
      dataTest: `permission-title-${permission.id}`,
    });
  });

  return {
    keyToId,
    navItems,
  };
});

const selectedPermissionId = computed(() => {
  if (!selectedPermissionKey.value) {
    return null;
  }

  return permissionRouteState.value.keyToId.get(selectedPermissionKey.value) ?? null;
});

const selectedPermission = computed(() => {
  if (!selectedPermissionId.value) {
    return null;
  }

  return appApi.permissions.byId(selectedPermissionId.value);
});
const selectedPermissionHasKey = computed(() => Boolean(selectedPermission.value?.viewerHasKey));
const selectedPermissionGrantCount = computed(() => selectedPermission.value?.grantCount ?? 0);

const usersById = computed(() => new Map(users.value.map((user) => [user.identityKey, user])));
const profilesById = computed(
  () => new Map(profiles.value.map((profile) => [profile.identityKey, profile])),
);

const selectedMemberIds = computed(
  () =>
    new Set(
      (selectedPermission.value?.members ?? []).flatMap((member) => {
        if (member.memberId === activeIdentityId.value) {
          return [member.memberId, activeIdentityKey.value];
        }
        return [member.memberId];
      }),
    ),
);

const members = computed(() => {
  const permission = selectedPermission.value;
  if (!permission) {
    return [];
  }

  return permission.members.map((member) => {
    const projected = usersById.value.get(member.memberId);
    const profile = projected ? profilesById.value.get(projected.identityKey) : undefined;
    const canonicalMemberId =
      projected?.identityKey ??
      (member.memberId === activeIdentityId.value ? activeIdentityKey.value : member.memberId);
    const resolvedLabel =
      profile?.displayName ??
      projected?.label ??
      member.memberLabel ??
      shortIdentityKey(member.memberId);

    return {
      memberId: member.memberId,
      memberLabel: resolvedLabel,
      glyphIdentity: canonicalMemberId,
      displayMemberId: canonicalMemberId,
      isActiveIdentity: member.memberId === activeIdentityId.value,
    };
  });
});

const assignableUsers = computed(() =>
  users.value.filter((user) => !selectedMemberIds.value.has(user.identityKey)),
);

const permissionNavItems = computed<PermissionNavItem[]>(() => permissionRouteState.value.navItems);
const permissionRailEmptyLabel = computed(() => {
  if (permissions.value.length === 0) {
    return "No groups yet. Create one to begin.";
  }
  return "No groups available.";
});

const assignableUserItems = computed(() =>
  assignableUsers.value.map((user) => ({
    id: user.identityKey,
    title:
      profilesById.value.get(user.identityKey)?.displayName ??
      user.label ??
      shortIdentityKey(user.identityKey),
    meta: shortIdentityKey(user.identityKey),
    dataTest: `permission-grant-row-${user.identityKey}`,
  })),
);

const trimmedCreateTitle = computed(() => createTitle.value.trim());
const canCreatePermission = computed(() => trimmedCreateTitle.value.length > 0);
const showCreateForm = computed(() => createOpen.value || permissions.value.length === 0);
const canCollapseCreateForm = computed(() => permissions.value.length > 0);

function clearCreateForm() {
  createTitle.value = "";
}

async function createPermission() {
  createError.value = null;

  try {
    await appApi.permissions.createGroup({
      title: trimmedCreateTitle.value,
    });
    clearCreateForm();
    createOpen.value = false;
  } catch (error) {
    createError.value = error instanceof Error ? error.message : String(error);
  }
}

function selectPermission(permissionKey: string): void {
  void router.push(`/s/permissions/${permissionKey}`);
}

async function grantProjectedUser(identityKey: string): Promise<void> {
  memberActionError.value = null;

  if (!selectedPermission.value) {
    return;
  }

  try {
    await appApi.permissions.grantFromUser({
      permissionId: selectedPermission.value.id,
      identityKey,
    });
  } catch (error) {
    memberActionError.value = error instanceof Error ? error.message : String(error);
  }
}

async function revokePermission(memberId: string): Promise<void> {
  memberActionError.value = null;

  if (!selectedPermission.value) {
    return;
  }

  try {
    await appApi.permissions.revoke({
      permissionId: selectedPermission.value.id,
      memberId,
    });
  } catch (error) {
    memberActionError.value = error instanceof Error ? error.message : String(error);
  }
}

watch(
  [permissionNavItems, selectedPermissionKey],
  ([nextPermissionItems, nextPermissionKey]) => {
    if (nextPermissionItems.length === 0) {
      if (permissions.value.length > 0) {
        return;
      }
      if (nextPermissionKey) {
        void router.replace("/s/permissions");
      }
      return;
    }

    const hasSelection =
      typeof nextPermissionKey === "string" &&
      nextPermissionItems.some((permission) => permission.id === nextPermissionKey);

    if (hasSelection) {
      return;
    }

    const firstPermissionKey = nextPermissionItems[0]?.id;
    if (firstPermissionKey) {
      void router.replace(`/s/permissions/${firstPermissionKey}`);
    }
  },
  {
    immediate: true,
  },
);

watch(selectedPermissionId, () => {
  showGrantPanel.value = false;
});

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
  <section class="h-full min-h-0 w-full" data-test="permissions-v2">
    <p class="sr-only" data-test="permissions-v2-status">
      {{ appApi.status.value }}
    </p>
    <p class="sr-only" data-test="permissions-v2-active-identity">
      {{ activeIdentityLabel }}
    </p>

    <ListWorkspaceLayout data-test-prefix="permissions-layout">
      <template #rail>
        <div class="mb-4 flex items-center justify-between">
          <p class="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]">
            Access groups
          </p>
          <Button
            type="button"
            variant="tertiary"
            size="xs"
            data-test="permission-create-toggle"
            :disabled="!canCollapseCreateForm && showCreateForm"
            @click="createOpen = !createOpen"
          >
            {{ showCreateForm && canCollapseCreateForm ? "Close" : "+" }}
          </Button>
        </div>

        <form
          v-if="showCreateForm"
          data-test="permission-create-form"
          class="mb-3 space-y-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)]/55 p-2"
          @submit.prevent="createPermission"
        >
          <Input
            v-model="createTitle"
            data-test="permission-create-title"
            type="text"
            aria-label="Access group title"
            placeholder="Reviewers"
          />

          <div class="flex items-center justify-between gap-2">
            <Button
              type="submit"
              data-test="permission-create-submit"
              variant="secondary"
              size="xs"
              :disabled="!canCreatePermission"
            >
              Create group
            </Button>
          </div>

          <p
            v-if="createError"
            class="m-0 text-sm text-[var(--ui-critical)]"
            data-test="permission-create-error"
          >
            {{ createError }}
          </p>
        </form>

        <div class="min-h-0 flex-1 overflow-auto" data-test="permissions-list">
          <p
            v-if="permissionNavItems.length === 0"
            class="m-0 rounded-xl bg-[var(--ui-tonal-tertiary)]/55 px-3 py-3 text-sm text-[var(--ui-fg-muted)]"
          >
            {{ permissionRailEmptyLabel }}
          </p>
          <div v-else class="space-y-1">
            <button
              v-for="item in permissionNavItems"
              :key="item.id"
              type="button"
              class="group relative flex w-full items-center justify-between overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition"
              :class="item.active ? 'border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg)] shadow-[var(--ui-shadow-sm)]' : 'text-[var(--ui-fg-muted)] hover:bg-[var(--ui-tonal-secondary)] hover:text-[var(--ui-fg)]'"
              :data-test="item.dataTest"
              @click="selectPermission(item.id)"
            >
              <span class="min-w-0">
                <span class="block truncate">{{ item.title }}</span>
              </span>
              <span class="text-xs text-[var(--ui-fg-muted)]">
                {{ item.memberCount }}
              </span>
            </button>
          </div>
        </div>
      </template>

      <section class="flex min-h-0 flex-1 flex-col">
        <p
          v-if="pageError"
          class="m-0 border-b border-[var(--ui-border)] px-6 py-3 text-sm text-[var(--ui-critical)] md:px-8"
          data-test="permissions-v2-page-error"
        >
          {{ pageError }}
        </p>

        <section
          v-if="selectedPermission"
          class="flex min-h-0 flex-1 flex-col"
          :data-test="`permission-card-${selectedPermission.id}`"
        >
          <div class="flex h-20 shrink-0 items-center justify-between border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_92%,transparent)] px-6 md:px-8">
            <div>
              <h2
                class="m-0 text-[28px] font-semibold tracking-[-0.035em] text-[var(--ui-fg)]"
                :data-test="`permission-selected-title-${selectedPermission.id}`"
              >
                {{ selectedPermission.title }}
              </h2>
              <div class="mt-1 flex items-center gap-2 text-xs font-semibold text-[var(--ui-fg-muted)]">
                <span>{{ members.length }} member{{ members.length === 1 ? "" : "s" }}</span>
                <span class="text-[color-mix(in_srgb,var(--ui-fg-muted)_35%,transparent)]">/</span>
                <span>Permissions group</span>
                <span class="text-[color-mix(in_srgb,var(--ui-fg-muted)_35%,transparent)]">/</span>
                <span>{{ selectedPermissionGrantCount }} grants</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="rounded-full border px-2.5 py-1 text-xs font-bold"
                :class="selectedPermissionHasKey ? 'border-[color-mix(in_srgb,var(--ui-success)_22%,var(--ui-border))] bg-[var(--ui-success-muted)] text-[var(--ui-success)]' : 'border-[color-mix(in_srgb,var(--ui-critical)_22%,var(--ui-border))] bg-[var(--ui-critical-muted)] text-[var(--ui-critical)]'"
                :data-test="`permission-key-state-${selectedPermission.id}`"
              >
                {{ selectedPermissionHasKey ? "key ready" : "no key" }}
              </span>
              <Button type="button" variant="secondary" size="sm" @click="showGrantPanel = !showGrantPanel">
                {{ showGrantPanel ? "Close" : "Add member" }}
              </Button>
            </div>
          </div>

          <div
            class="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--ui-primary-muted)_42%,transparent),transparent_35%)]"
            data-test="permissions-layout-scroll"
          >
            <div
              class="sticky top-0 grid h-11 grid-cols-[minmax(260px,1fr)_180px_140px] items-center border-b border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] px-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)] backdrop-blur md:px-8"
              data-test="permissions-layout-table-head"
            >
              <div>Member</div>
              <div>Role</div>
              <div class="text-right">Action</div>
            </div>

            <div v-if="members.length" :data-test="`permission-members-${selectedPermission.id}`">
              <article
                v-for="member in members"
                :key="member.memberId"
                class="group grid min-h-[88px] grid-cols-[minmax(260px,1fr)_180px_140px] items-center border-b border-[var(--ui-border)] bg-transparent px-6 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--ui-tonal-tertiary)_78%,transparent)] md:px-8"
                :data-test="`permission-member-${selectedPermission.id}-${member.memberId}`"
              >
                <div class="flex min-w-0 items-center gap-4">
                  <IdentityGlyph
                    :identity="member.glyphIdentity"
                    size="sm"
                    :data-test="`permission-member-glyph-${selectedPermission.id}-${member.memberId}`"
                  />
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ui-fg)]">{{ member.memberLabel }}</span>
                      <span
                        v-if="member.isActiveIdentity"
                        class="rounded-full border border-[color-mix(in_srgb,var(--ui-primary)_22%,var(--ui-border))] bg-[var(--ui-primary-muted)] px-2 py-0.5 text-[11px] font-bold text-[var(--ui-primary)]"
                      >
                        You
                      </span>
                    </div>
                    <div class="mt-1 truncate text-[13px] font-medium text-[var(--ui-fg-muted)]">
                      Collaborator · {{ shortIdentityKey(member.displayMemberId) }}
                    </div>
                  </div>
                </div>
                <div>
                  <span class="rounded-full border border-[color-mix(in_srgb,var(--ui-primary)_22%,var(--ui-border))] bg-[var(--ui-primary-muted)] px-2.5 py-1 text-xs font-bold text-[var(--ui-primary)]">admin</span>
                </div>
                <button
                  type="button"
                  class="justify-self-end rounded-xl px-3 py-2 text-xs font-bold tracking-[0.02em] text-[var(--ui-fg-muted)] opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-[var(--ui-surface)] hover:text-[var(--ui-fg)]"
                  :data-test="`permission-revoke-${selectedPermission.id}-${member.memberId}`"
                  @click="revokePermission(member.memberId)"
                >
                  Remove
                </button>
              </article>
            </div>

            <p
              v-else
              class="m-0 border-b border-[var(--ui-border)] px-6 py-8 text-sm text-[var(--ui-fg-muted)] md:px-8"
            >
              No collaborators yet. Add people from workspace users to start sharing access.
            </p>

            <div v-if="showGrantPanel" class="border-t border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)]/45 px-6 py-4 md:px-8">
              <p
                v-if="!selectedPermissionHasKey"
                class="m-0 mb-3 text-sm text-[var(--ui-critical)]"
                :data-test="`permission-no-key-${selectedPermission.id}`"
              >
                This device does not currently hold the group key, so new grants cannot be issued from here.
              </p>

              <div
                v-if="users.length === 0"
                class="space-y-2 rounded-[var(--ui-radius-md)] bg-[var(--ui-tonal-tertiary)] p-3 text-sm text-[var(--ui-fg-muted)]"
                data-test="permissions-users-empty"
              >
                <p class="m-0">
                  No workspace users yet. Add people first, then grant access here.
                </p>
                <Button
                  as="RouterLink"
                  to="/s/users"
                  variant="plain-secondary"
                  size="sm"
                  data-test="permissions-users-empty-cta"
                >
                  Open users area
                </Button>
              </div>

              <p
                v-else-if="assignableUserItems.length === 0"
                class="m-0 rounded-[var(--ui-radius-md)] bg-[var(--ui-tonal-tertiary)] p-3 text-sm text-[var(--ui-fg-muted)]"
                data-test="permission-assignable-empty"
              >
                Everyone in this workspace already has access through this group.
              </p>

              <ul v-else class="m-0 list-none space-y-1 p-0">
                <li
                  v-for="item in assignableUserItems"
                  :key="item.id"
                  class="flex items-center gap-3 rounded-[var(--ui-radius-md)] border border-transparent px-2 py-2 transition-colors hover:border-[var(--ui-border)] hover:bg-[var(--ui-tonal-tertiary)]"
                  :data-test="item.dataTest"
                >
                  <IdentityGlyph
                    :identity="item.id"
                    size="xs"
                    :data-test="`permission-grant-glyph-${selectedPermission.id}-${item.id}`"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="m-0 truncate text-sm font-medium text-[var(--ui-fg)]">
                      {{ item.title }}
                    </p>
                    <p class="m-0 truncate text-xs text-[var(--ui-fg-muted)]">
                      Workspace user · {{ item.meta }}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="xs"
                    :data-test="`permission-grant-submit-${selectedPermission.id}-${item.id}`"
                    :disabled="!selectedPermissionHasKey"
                    @click="grantProjectedUser(item.id)"
                  >
                    Add collaborator
                  </Button>
                </li>
              </ul>
            </div>

            <p
              v-if="memberActionError"
              class="m-0 border-t border-[var(--ui-border)] px-6 py-3 text-sm text-[var(--ui-critical)] md:px-8"
              :data-test="`permission-grant-error-${selectedPermission.id}`"
            >
              {{ memberActionError }}
            </p>
          </div>
        </section>

        <div
          v-else
          class="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--ui-primary-muted)_42%,transparent),transparent_35%)]"
          data-test="permissions-layout-scroll"
        >
          <p
            v-if="permissions.length === 0"
            class="m-0 border-b border-[var(--ui-border)] px-6 py-8 text-sm text-[var(--ui-fg-muted)] md:px-8"
            data-test="permissions-empty"
          >
            No access groups yet. Create one from the left rail.
          </p>
          <p
            v-else
            class="m-0 border-b border-[var(--ui-border)] px-6 py-8 text-sm text-[var(--ui-fg-muted)] md:px-8"
            data-test="permissions-detail-empty"
          >
            Select an access group from the left rail.
          </p>
        </div>
      </section>
    </ListWorkspaceLayout>
  </section>
</template>

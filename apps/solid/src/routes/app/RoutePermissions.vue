<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppApi } from "@/app/api";
import { shortIdentityKey } from "@/app/plugins/identityKey";
import { Badge, Button, Card, Input } from "ternent-ui/primitives";
import { IdentityGlyph, RecordList, SplitView } from "ternent-ui/patterns";
import type { RecordListItem } from "ternent-ui/patterns";

const appApi = useAppApi();
const route = useRoute();
const router = useRouter();

const createTitle = ref("");
const createOpen = ref(false);
const createError = ref<string | null>(null);
const pageError = ref<string | null>(null);
const memberActionError = ref<string | null>(null);

const permissions = computed(() => appApi.permissions.all());
const users = computed(() => appApi.users.all());
const profiles = computed(() => appApi.profiles.all());
const stagedCount = computed(() => appApi.getState().stagedCount);
const activeIdentityId = computed(
  () => appApi.identity.activeIdentity.value?.identityId ?? "",
);
const activeIdentityKey = computed(
  () => appApi.identity.activeIdentity.value?.identityKey ?? "",
);
const activeIdentityLabel = computed(
  () => appApi.identity.activeIdentity.value?.label ?? "Identity locked",
);

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
  const fingerprint = (parts[3] ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 4).toLowerCase();
  return fingerprint ? `${slug}-${fingerprint}` : slug;
}

const permissionRouteState = computed(() => {
  const keyToId = new Map<string, string>();
  const navItems: RecordListItem[] = [];

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
      meta: `${permission.members.length} member${permission.members.length === 1 ? "" : "s"}`,
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
const selectedPermissionMetaId = computed(() => {
  const id = selectedPermission.value?.id ?? "";
  if (!id) {
    return "";
  }
  const fingerprint = id.slice(-12);
  return `grp:${fingerprint}`;
});

const usersById = computed(() =>
  new Map(users.value.map((user) => [user.identityKey, user])),
);
const profilesById = computed(() =>
  new Map(profiles.value.map((profile) => [profile.identityKey, profile])),
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
    const profile = projected
      ? profilesById.value.get(projected.identityKey)
      : undefined;
    const canonicalMemberId =
      projected?.identityKey ??
      (member.memberId === activeIdentityId.value
        ? activeIdentityKey.value
        : member.memberId);
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

const permissionNavItems = computed<RecordListItem[]>(
  () => permissionRouteState.value.navItems,
);

const assignableUserItems = computed<RecordListItem[]>(() =>
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
const showCreateForm = computed(
  () => createOpen.value || permissions.value.length === 0,
);
const canCollapseCreateForm = computed(() => permissions.value.length > 0);

function clearCreateForm() {
  createTitle.value = "";
}

async function createPermission() {
  createError.value = null;

  try {
    await appApi.permissions.create({
      title: trimmedCreateTitle.value,
    });
    clearCreateForm();
    createOpen.value = false;
  } catch (error) {
    createError.value = error instanceof Error ? error.message : String(error);
  }
}

function selectPermission(item: RecordListItem): void {
  void router.push(`/s/permissions/${item.id}`);
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
  <section class="mx-auto h-full min-h-0 w-full p-6" data-test="permissions-v2">
    <p class="sr-only" data-test="permissions-v2-status">
      {{ appApi.status.value }}
    </p>
    <p class="sr-only" data-test="permissions-v2-active-identity">
      {{ activeIdentityLabel }}
    </p>

    <header class="mb-6 space-y-1">
      <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">Permissions</p>
      <h1 class="m-0 text-2xl font-semibold text-[var(--ui-fg)]">Workspace access groups</h1>
      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
        Manage who has access in each group. Membership updates are staged here and committed from
        the tray.
      </p>
    </header>

    <p
      v-if="pageError"
      class="m-0 mb-3 text-sm text-[var(--ui-critical)]"
      data-test="permissions-v2-page-error"
    >
      {{ pageError }}
    </p>

    <SplitView rail-width="md" rail-aria-label="Permissions navigation" :divider="false">
      <template #rail>
        <div class="flex h-full min-h-0 flex-col gap-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3">
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">
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
                {{ showCreateForm && canCollapseCreateForm ? "Close" : "Create group" }}
              </Button>
            </div>

            <form
              v-if="showCreateForm"
              data-test="permission-create-form"
              class="space-y-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)] p-2"
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
                <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
                  Groups organize collaborators by access.
                </p>
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
          </div>

          <div class="min-h-0 flex-1 rounded-[var(--ui-radius-md)] bg-[var(--ui-tonal-tertiary)]/45 px-1 py-1" data-test="permissions-list">
            <RecordList
              title="Groups"
              surface="plain"
              :items="permissionNavItems"
              empty-label="No groups yet. Create one to begin."
              @select="selectPermission"
            >
              <template #item-leading="{ item }">
                <span
                  class="inline-block h-1.5 w-1.5 rounded-full"
                  :class="item.active ? 'bg-[var(--ui-primary)]' : 'bg-[var(--ui-border-strong)]'"
                ></span>
              </template>
            </RecordList>
          </div>
        </div>
      </template>

      <div class="flex h-full min-h-0 flex-col gap-4">
        <Card
          v-if="permissions.length === 0"
          variant="subtle"
          padding="lg"
          class="space-y-2"
          data-test="permissions-empty"
        >
          <h2 class="m-0 text-lg font-semibold text-[var(--ui-fg)]">No access groups yet</h2>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            Create your first group from the left to start organizing collaborators by role.
          </p>
        </Card>

        <Card
          v-else-if="!selectedPermission"
          variant="subtle"
          padding="lg"
          class="space-y-2"
          data-test="permissions-detail-empty"
        >
          <h2 class="m-0 text-lg font-semibold text-[var(--ui-fg)]">Select an access group</h2>
          <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
            Choose a group from the left rail to review membership and stage changes.
          </p>
        </Card>

        <template v-else>
          <section
            class="flex min-h-0 flex-col gap-5"
            :data-test="`permission-card-${selectedPermission.id}`"
          >
            <Card variant="panel" padding="lg" class="space-y-4">
              <header class="space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">
                    Access group
                  </p>
                  <p class="m-0 font-mono text-xs text-[var(--ui-fg-muted)]">
                    {{ selectedPermissionMetaId }}
                  </p>
                </div>

                <div class="flex flex-wrap items-end justify-between gap-3">
                  <h2
                    class="m-0 text-3xl font-semibold leading-tight text-[var(--ui-fg)]"
                    :data-test="`permission-selected-title-${selectedPermission.id}`"
                  >
                    {{ selectedPermission.title }}
                  </h2>
                  <div class="flex items-center gap-2">
                    <Badge tone="primary" variant="soft" size="sm">
                      {{ members.length }} {{ members.length === 1 ? "member" : "members" }}
                    </Badge>
                    <Badge tone="neutral" variant="soft" size="sm">
                      {{ assignableUserItems.length }} available
                    </Badge>
                    <Badge tone="secondary" variant="soft" size="sm">
                      {{ stagedCount }} staged
                    </Badge>
                  </div>
                </div>
                <p class="m-0 max-w-3xl text-sm text-[var(--ui-fg-muted)]">
                  This group controls collaborator access for this workspace. Changes are queued in
                  the commit tray, then committed into signed ledger history.
                </p>
              </header>
            </Card>

            <div class="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <section class="min-h-0 space-y-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3">
                <div class="space-y-1">
                  <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">
                    Collaborators
                  </p>
                  <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                    People currently included in this access group.
                  </p>
                </div>

                <div
                  v-if="members.length"
                  class="min-h-0"
                  :data-test="`permission-members-${selectedPermission.id}`"
                >
                  <ul class="m-0 list-none divide-y divide-[var(--ui-border)] rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-tertiary)]/35 p-0">
                    <li
                      v-for="member in members"
                      :key="member.memberId"
                      class="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-[var(--ui-tonal-tertiary)]"
                      :data-test="`permission-member-${selectedPermission.id}-${member.memberId}`"
                    >
                      <IdentityGlyph
                        :identity="member.glyphIdentity"
                        size="xs"
                        :data-test="`permission-member-glyph-${selectedPermission.id}-${member.memberId}`"
                      />
                      <div class="min-w-0 flex-1">
                        <p class="m-0 truncate text-sm font-medium text-[var(--ui-fg)]">
                          {{ member.memberLabel }}
                        </p>
                        <p class="m-0 truncate text-xs text-[var(--ui-fg-muted)]">
                          {{ member.isActiveIdentity ? "You" : "Collaborator" }} ·
                          {{ shortIdentityKey(member.displayMemberId) }}
                        </p>
                      </div>
                      <Badge
                        v-if="member.isActiveIdentity"
                        tone="secondary"
                        variant="soft"
                        size="xs"
                      >
                        You
                      </Badge>
                      <Button
                        type="button"
                        variant="tertiary"
                        size="xs"
                        :data-test="`permission-revoke-${selectedPermission.id}-${member.memberId}`"
                        @click="revokePermission(member.memberId)"
                      >
                        Remove access
                      </Button>
                    </li>
                  </ul>
                </div>

                <Card v-else variant="subtle" padding="md">
                  <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                    No collaborators yet. Add people from workspace users to start sharing access.
                  </p>
                </Card>
              </section>

              <section class="space-y-3 rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3">
                <div class="space-y-1">
                  <p class="m-0 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]">
                    Available people
                  </p>
                  <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
                    Add collaborators from existing workspace users.
                  </p>
                </div>

                <div
                  v-if="users.length === 0"
                  class="space-y-2 rounded-[var(--ui-radius-md)] bg-[var(--ui-tonal-tertiary)] p-3 text-sm text-[var(--ui-fg-muted)]"
                  data-test="permissions-users-empty"
                >
                  <p class="m-0">No workspace users yet. Add people first, then grant access here.</p>
                  <Button
                    as="RouterLink"
                    to="/users"
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

                <div v-else>
                  <ul class="m-0 list-none space-y-1 p-0">
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
                        @click="grantProjectedUser(item.id)"
                      >
                        Add collaborator
                      </Button>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            <p
              v-if="memberActionError"
              class="m-0 text-sm text-[var(--ui-critical)]"
              :data-test="`permission-grant-error-${selectedPermission.id}`"
            >
              {{ memberActionError }}
            </p>
          </section>
        </template>
      </div>
    </SplitView>
  </section>
</template>

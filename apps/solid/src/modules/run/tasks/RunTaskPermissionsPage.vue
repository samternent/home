<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, Spinner } from "ternent-ui/primitives";
import { useRunIdentityService } from "@/modules/run/identity";
import { useRunTaskActions } from "@/modules/run/services";
import { useAppShellAddDialogModel } from "@/modules/ui/useAppShellAddDialogModel";
import { useAppShellState } from "@/modules/ui/useAppShellState";
import { createTaskPermissionDialogSchema } from "./createTaskPermissionDialogSchema";
import { createTaskPermissionGrantDialogSchema } from "./createTaskPermissionGrantDialogSchema";
import RunTaskCommitBar from "./RunTaskCommitBar.vue";
import RunTasksDocumentNav from "./RunTasksDocumentNav.vue";
import { useRunTasksSurface } from "./useRunTasksSurface";
import type { TaskPermissionRecord } from "./types";

const surface = useRunTasksSurface();
const identity = useRunIdentityService();
const actions = useRunTaskActions();
const shellState = useAppShellState();
const addDialog = useAppShellAddDialogModel();
const errorMessage = ref<string | null>(null);

const localMembers = computed(() =>
  identity.identities.value.map((record) => ({
    userId: `user:${record.identity.keyId}`,
    name: record.profile.label,
  })),
);

const headingBody = computed(() => {
  if (surface.mode.value === "unavailable") {
    return (
      surface.reason.value ??
      "Permissions is not available for the current ledger."
    );
  }

  return surface.mode.value === "interactive"
    ? "Permission groups are local records stored in this ledger. You can always create new groups when interactive, but you only see groups this identity can access."
    : "You’re viewing this task document read-only. Permission records still come from this ledger. Add identity when you want to make changes.";
});

const grantCountByPermissionId = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {};
  for (const grant of surface.permissionGrants.value) {
    counts[grant.permissionId] = (counts[grant.permissionId] ?? 0) + 1;
  }
  return counts;
});

const userNameById = computed<Record<string, string>>(() =>
  Object.fromEntries(localMembers.value.map((member) => [member.userId, member.name])),
);

const runtimeLoading = computed(
  () =>
    surface.status.value === "loading" ||
    surface.transition.value === "loading-ledger" ||
    surface.transition.value === "switching-identity",
);

const grantsByPermissionId = computed<
  Record<string, typeof surface.permissionGrants.value>
>(() => {
  const grouped: Record<string, typeof surface.permissionGrants.value> = {};
  for (const grant of surface.permissionGrants.value) {
    grouped[grant.permissionId] ??= [];
    grouped[grant.permissionId]?.push(grant);
  }
  return grouped;
});

function handleFailure(error: string) {
  if (error.includes("Add identity") || error.includes("read-only")) {
    shellState.openConnect("create");
    return;
  }

  errorMessage.value = error;
}

function openCreatePermissionDialog() {
  errorMessage.value = null;
  addDialog.open({
    schema: createTaskPermissionDialogSchema(),
    submit: async (payload) => {
      const result = await actions.createTaskPermission(payload);
      if (!result.ok) {
        handleFailure(result.error);
        return { ok: false as const, error: result.error };
      }
      return { ok: true as const };
    },
  });
}

function openGrantDialog(permission: TaskPermissionRecord) {
  errorMessage.value = null;
  const eligibleMembers = localMembers.value.filter(
    (member) =>
      !surface.permissionGrants.value.some(
        (grant) =>
          grant.permissionId === permission.permissionId &&
          grant.userId === member.userId,
      ),
  );

  if (eligibleMembers.length === 0) {
    errorMessage.value = "No local identities are available for this grant yet.";
    return;
  }

  addDialog.open({
    schema: createTaskPermissionGrantDialogSchema({
      permission,
      members: eligibleMembers,
    }),
    submit: async (payload) => {
      const result = await actions.grantTaskPermission(payload);
      if (!result.ok) {
        handleFailure(result.error);
        return { ok: false as const, error: result.error };
      }
      return { ok: true as const };
    },
  });
}
</script>

<template>
  <section class="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col py-2">
    <header class="px-5 py-4 sm:px-6">
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="min-w-0 space-y-3">
          <p
            class="m-0 text-[11px] uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
          >
            Permissions
          </p>
          <RunTasksDocumentNav />
          <div class="flex flex-wrap items-center gap-3">
            <h1
              class="m-0 text-[1.75rem] font-medium tracking-[-0.02em] text-[var(--ui-fg)]"
            >
              {{ surface.documentTitle.value }}
            </h1>
            <span
              class="inline-flex items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-2.5 py-1 text-xs text-[var(--ui-fg-muted)]"
            >
              {{ surface.permissions.value.length }}
            </span>
          </div>
          <p
            class="m-0 max-w-2xl text-[13px] leading-6 text-[var(--ui-fg-muted)]"
          >
            {{ headingBody }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-sm">
          <Button
            v-if="surface.canManagePermissions.value"
            size="sm"
            class="rounded-lg"
            @click="openCreatePermissionDialog"
          >
            Add permission
          </Button>
          <Button
            v-else-if="surface.mode.value === 'inspect'"
            size="sm"
            class="rounded-lg"
            @click="shellState.openConnect('create')"
          >
            Add identity
          </Button>
        </div>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-auto px-3 pb-4 pt-3 sm:px-4 sm:pb-5">
      <div class="space-y-3 px-2 sm:px-3">
        <div
          v-if="surface.mode.value === 'unavailable'"
          class="rounded-[0.875rem] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-4 py-4"
        >
          <p class="m-0 text-sm text-[var(--ui-critical)]">
            {{ surface.reason.value }}
          </p>
        </div>

        <div
          v-else-if="surface.mode.value === 'inspect'"
          class="rounded-[0.875rem] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-4 py-4"
        >
          <div
            class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
              You’re viewing this task document. Add identity to make changes.
            </p>
            <Button
              size="sm"
              class="rounded-lg"
              @click="shellState.openConnect('create')"
              >Add identity</Button
            >
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="rounded-[0.875rem] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-4 py-4"
        >
          <p class="m-0 text-sm text-[var(--ui-critical)]">
            {{ errorMessage }}
          </p>
        </div>

        <div
          v-if="runtimeLoading"
          class="rounded-[0.875rem] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-4 py-4"
        >
          <div class="flex items-center gap-3 text-sm text-[var(--ui-fg-muted)]">
            <Spinner size="sm" tone="muted" />
            <span>Refreshing permission access and decrypting protected entries…</span>
          </div>
        </div>

        <div
          v-if="
            surface.canManagePermissions.value &&
            !surface.permissions.value.length
          "
          class="rounded-[1rem] border border-dashed border-[var(--ui-border)]/80 px-5 py-8 text-center"
        >
          <div class="mx-auto flex max-w-xl flex-col items-center gap-3">
            <p class="m-0 text-lg font-medium text-[var(--ui-fg)]">
              No visible permissions yet.
            </p>
            <p class="m-0 text-sm leading-6 text-[var(--ui-fg-muted)]">
              Create a new permission group here, or wait until this identity is
              granted access to an existing one.
            </p>
            <Button
              v-if="surface.canManagePermissions.value"
              class="rounded-lg"
              @click="openCreatePermissionDialog"
            >
              Add first permission
            </Button>
          </div>
        </div>

        <div
          v-else-if="surface.canManagePermissions.value"
          class="overflow-hidden rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-surface)]"
        >
          <div
            class="grid grid-cols-[minmax(0,1fr)_120px_120px_120px] gap-4 border-b border-[var(--ui-border)] px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-[var(--ui-fg-muted)] sm:px-5"
          >
            <span>Permission</span>
            <span>Scope</span>
            <span>Members</span>
            <span class="text-right">Grant</span>
          </div>

          <div class="divide-y divide-[var(--ui-border)]/50">
            <div
              v-for="permission in surface.permissions.value"
              :key="permission.permissionId"
              class="px-4 py-3 sm:px-5"
            >
              <div
                class="grid grid-cols-[minmax(0,1fr)_120px_120px_120px] items-start gap-4"
              >
                <div class="min-w-0 space-y-2">
                  <p class="m-0 truncate text-[15px] text-[var(--ui-fg)]">
                    {{ permission.title }}
                  </p>
                  <div
                    v-if="grantsByPermissionId[permission.permissionId]?.length"
                    class="flex flex-wrap gap-1.5"
                  >
                    <span
                      v-for="grant in grantsByPermissionId[
                        permission.permissionId
                      ]"
                      :key="grant.permissionGrantId"
                      class="inline-flex items-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-2 py-0.5 text-[11px] text-[var(--ui-fg-muted)]"
                    >
                      {{ userNameById[grant.userId] || grant.userId }}
                    </span>
                  </div>
                </div>
                <p class="m-0 text-[12px] text-[var(--ui-fg-muted)]">
                  {{ permission.scope || "document" }}
                </p>
                <p class="m-0 text-[12px] text-[var(--ui-fg-muted)]">
                  {{ grantCountByPermissionId[permission.permissionId] ?? 0 }}
                </p>
                <div class="text-right">
                  <Button
                    size="sm"
                    variant="plain-secondary"
                    class="rounded-lg"
                    :disabled="!surface.canManagePermissions.value"
                    @click="openGrantDialog(permission)"
                  >
                    Grant
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RunTaskCommitBar v-if="surface.mode.value === 'interactive'" />
  </section>
</template>

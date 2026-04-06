<script setup lang="ts">
import { computed, ref } from "vue";
import { Badge, Button, Spinner } from "ternent-ui/primitives";
import { useRunTaskActions } from "@/modules/run/services";
import { useAppShellAddDialogModel } from "@/modules/ui/useAppShellAddDialogModel";
import { useAppShellState } from "@/modules/ui/useAppShellState";
import { createTaskPermissionDialogSchema } from "@/modules/run/tasks/createTaskPermissionDialogSchema";
import { createTaskPermissionGrantDialogSchema } from "@/modules/run/tasks/createTaskPermissionGrantDialogSchema";
import { useRunDemoIdentityModel } from "@/modules/run/tasks/useRunDemoIdentityModel";
import { useRunTasksSurface } from "@/modules/run/tasks/useRunTasksSurface";
import type { TaskPermissionRecord } from "@/modules/run/tasks/types";

const surface = useRunTasksSurface();
const demoIdentity = useRunDemoIdentityModel();
const actions = useRunTaskActions();
const shellState = useAppShellState();
const addDialog = useAppShellAddDialogModel();
const errorMessage = ref<string | null>(null);

const localMembers = computed(() =>
  demoIdentity.identities.value.map((identity) => ({
    userId: `user:${identity.identity.keyId}`,
    name: identity.profile.label,
  })),
);

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

const grantsByPermissionId = computed<Record<string, typeof surface.permissionGrants.value>>(() => {
  const grouped: Record<string, typeof surface.permissionGrants.value> = {};
  for (const grant of surface.permissionGrants.value) {
    grouped[grant.permissionId] ??= [];
    grouped[grant.permissionId]?.push(grant);
  }
  return grouped;
});

const eligibleUserCountByPermissionId = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {};

  for (const permission of surface.permissions.value) {
    counts[permission.permissionId] = localMembers.value.filter((member) =>
      !surface.permissionGrants.value.some((grant) =>
        grant.permissionId === permission.permissionId && grant.userId === member.userId
      )).length;
  }

  return counts;
});

const runtimeLoading = computed(
  () =>
    surface.status.value === "loading" ||
    surface.transition.value === "loading-ledger" ||
    surface.transition.value === "switching-identity",
);

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
  const eligibleMembers = localMembers.value.filter((member) =>
    !surface.permissionGrants.value.some((grant) =>
      grant.permissionId === permission.permissionId && grant.userId === member.userId
    ));

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
  <section class="space-y-4">
    <div class="flex flex-col gap-4 rounded-[1.5rem] border border-white/12 bg-white/[0.04] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <Badge tone="neutral" variant="soft">
          permissions {{ surface.permissions.value.length }}
        </Badge>
        <Badge tone="neutral" variant="soft">
          grants {{ surface.permissionGrants.value.length }}
        </Badge>
        <Badge
          v-if="surface.hasHiddenProtectedEntries.value"
          tone="warning"
          variant="soft"
        >
          hidden {{ surface.hiddenProtectedTaskCount.value }}
        </Badge>
        <Badge
          v-if="surface.mode.value === 'unavailable'"
          tone="critical"
          variant="soft"
        >
          unavailable
        </Badge>
      </div>

      <div class="flex items-center gap-2">
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
          variant="plain-secondary"
          class="rounded-lg border border-white/15 bg-white/8 text-white hover:bg-white/12"
          @click="shellState.openConnect('create')"
        >
          Add identity
        </Button>
      </div>
    </div>

    <div
      v-if="surface.mode.value === 'unavailable'"
      class="rounded-[1.5rem] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-5 py-4 text-sm text-[var(--ui-critical)]"
    >
      {{ surface.reason.value }}
    </div>

    <div
      v-if="runtimeLoading"
      class="flex items-center gap-3 rounded-[1.5rem] border border-white/12 bg-white/[0.04] px-5 py-4 text-sm text-white/70"
    >
      <Spinner size="sm" tone="muted" />
      <span>Refreshing permission access and decrypting protected entries…</span>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-[1.5rem] border border-[var(--ui-critical-muted)] bg-[var(--ui-critical-muted)] px-5 py-4 text-sm text-[var(--ui-critical)]"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="surface.canManagePermissions.value && !surface.permissions.value.length"
      class="rounded-[1.5rem] border border-dashed border-white/14 px-5 py-8 text-center"
    >
      <div class="mx-auto flex max-w-2xl flex-col items-center gap-3">
        <p class="m-0 text-sm text-white/65">
          No visible permissions
        </p>
        <p class="m-0 max-w-xl text-sm leading-6 text-white/50">
          Create a new permission group, or wait until someone grants this
          identity access to an existing one.
        </p>
        <Button class="rounded-lg" @click="openCreatePermissionDialog">
          Add first permission
        </Button>
      </div>
    </div>

    <div
      v-else-if="surface.canManagePermissions.value"
      class="overflow-hidden rounded-[1.5rem] border border-white/12 bg-white/[0.04]"
    >
      <div class="grid grid-cols-[minmax(0,1fr)_120px_120px_120px] gap-4 border-b border-white/10 px-5 py-3 text-[11px] uppercase tracking-[0.1em] text-white/45">
        <span>Permission</span>
        <span>Scope</span>
        <span>Members</span>
        <span class="text-right">Grant</span>
      </div>

      <div class="divide-y divide-white/8">
        <div
          v-for="permission in surface.permissions.value"
          :key="permission.permissionId"
          class="px-5 py-4"
        >
          <div class="grid grid-cols-[minmax(0,1fr)_120px_120px_120px] items-start gap-4">
            <div class="min-w-0 space-y-2">
              <p class="m-0 truncate text-[15px] text-white">
                {{ permission.title }}
              </p>
              <div v-if="grantsByPermissionId[permission.permissionId]?.length" class="flex flex-wrap gap-1.5">
                <Badge
                  v-for="grant in grantsByPermissionId[permission.permissionId]"
                  :key="grant.permissionGrantId"
                  tone="neutral"
                  variant="outline"
                >
                  {{ userNameById[grant.userId] || grant.userId }}
                </Badge>
              </div>
            </div>
            <p class="m-0 text-xs text-white/60">
              {{ permission.scope || "document" }}
            </p>
            <p class="m-0 text-xs text-white/60">
              {{ grantCountByPermissionId[permission.permissionId] ?? 0 }}
            </p>
            <div class="text-right">
              <Button
                size="sm"
                variant="plain-secondary"
                class="rounded-lg border border-white/15 bg-white/8 text-white hover:bg-white/12"
                :disabled="(eligibleUserCountByPermissionId[permission.permissionId] ?? 0) === 0"
                @click="openGrantDialog(permission)"
              >
                Grant
              </Button>
              <p class="m-0 mt-2 text-[11px] text-white/45">
                {{
                  (eligibleUserCountByPermissionId[permission.permissionId] ?? 0) > 0
                    ? `${eligibleUserCountByPermissionId[permission.permissionId]} identities available`
                    : "No eligible identities"
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

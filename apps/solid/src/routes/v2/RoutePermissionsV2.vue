<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAppApi } from "@/app/api";

const appApi = useAppApi();

const createTitle = ref("");
const createScope = ref("");
const createError = ref<string | null>(null);
const pageError = ref<string | null>(null);
const grantErrorByPermission = ref<Record<string, string | null>>({});
const grantMemberIdByPermission = ref<Record<string, string>>({});
const grantMemberLabelByPermission = ref<Record<string, string>>({});

const permissions = computed(() => appApi.permissions.all());

const activeIdentityLabel = computed(
  () => appApi.identity.activeIdentity.value?.label ?? "none",
);

const stagedCount = computed(() => appApi.getState().stagedCount);

function clearCreateForm() {
  createTitle.value = "";
  createScope.value = "";
}

async function createPermission() {
  createError.value = null;

  try {
    await appApi.permissions.create({
      title: createTitle.value,
      scope: createScope.value || null,
    });
    clearCreateForm();
  } catch (error) {
    createError.value = error instanceof Error ? error.message : String(error);
  }
}

async function grantPermission(permissionId: string) {
  grantErrorByPermission.value[permissionId] = null;

  try {
    await appApi.permissions.grant({
      permissionId,
      memberId: grantMemberIdByPermission.value[permissionId] ?? "",
      memberLabel: grantMemberLabelByPermission.value[permissionId] ?? null,
    });

    grantMemberIdByPermission.value[permissionId] = "";
    grantMemberLabelByPermission.value[permissionId] = "";
  } catch (error) {
    grantErrorByPermission.value[permissionId] =
      error instanceof Error ? error.message : String(error);
  }
}

async function revokePermission(permissionId: string, memberId: string) {
  grantErrorByPermission.value[permissionId] = null;

  try {
    await appApi.permissions.revoke({
      permissionId,
      memberId,
    });
  } catch (error) {
    grantErrorByPermission.value[permissionId] =
      error instanceof Error ? error.message : String(error);
  }
}

async function commitStaged() {
  pageError.value = null;

  try {
    await appApi.commit();
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : String(error);
  }
}

async function discardStaged() {
  pageError.value = null;

  try {
    await appApi.discard();
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : String(error);
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
  <section class="space-y-6" data-test="permissions-v2">
    <div>
      <p class="m-0 text-xs uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]">
        Permissions
      </p>
      <h2 class="m-0 mt-2 text-2xl font-semibold text-[var(--ui-fg)]">
        Minimal permissions CRUD
      </h2>
      <p class="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--ui-fg-muted)]">
        Commands stage first. Replay shows staged and committed state together. Commit promotes staged entries; discard removes them.
      </p>
      <p class="m-0 mt-2 text-sm text-[var(--ui-fg)]" data-test="permissions-v2-active-identity">
        Active identity: {{ activeIdentityLabel }}
      </p>
      <p class="m-0 mt-1 text-sm text-[var(--ui-fg)]" data-test="permissions-v2-status">
        Status: {{ appApi.status.value }}
      </p>
      <p class="m-0 mt-1 text-sm text-[var(--ui-fg)]" data-test="permissions-v2-staged-count">
        Staged entries: {{ stagedCount }}
      </p>
      <div class="mt-3 flex gap-2">
        <button
          type="button"
          class="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-fg)] transition hover:bg-[var(--ui-tonal-secondary)]"
          data-test="permissions-v2-commit"
          @click="commitStaged"
        >
          Commit
        </button>
        <button
          type="button"
          class="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-fg)] transition hover:bg-[var(--ui-tonal-secondary)]"
          data-test="permissions-v2-discard"
          @click="discardStaged"
        >
          Discard
        </button>
      </div>
      <p
        v-if="pageError || appApi.lastError.value"
        class="m-0 mt-2 text-sm text-[var(--ui-critical)]"
        data-test="permissions-v2-page-error"
      >
        {{ pageError ?? appApi.lastError.value }}
      </p>
    </div>

    <form
      class="rounded-xl border border-[var(--ui-border)] p-4"
      data-test="permission-create-form"
      @submit.prevent="createPermission"
    >
      <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">Create permission</p>
      <div class="mt-3 grid gap-3 md:grid-cols-2">
        <label class="text-sm text-[var(--ui-fg-muted)]">
          Title
          <input
            v-model="createTitle"
            data-test="permission-create-title"
            type="text"
            class="mt-1 w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-[var(--ui-fg)]"
            placeholder="Document editors"
          >
        </label>
        <label class="text-sm text-[var(--ui-fg-muted)]">
          Scope (optional)
          <input
            v-model="createScope"
            data-test="permission-create-scope"
            type="text"
            class="mt-1 w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-[var(--ui-fg)]"
            placeholder="workspace"
          >
        </label>
      </div>
      <p v-if="createError" class="m-0 mt-2 text-sm text-[var(--ui-critical)]" data-test="permission-create-error">
        {{ createError }}
      </p>
      <button
        type="submit"
        data-test="permission-create-submit"
        class="mt-3 rounded-lg border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-fg)] transition hover:bg-[var(--ui-tonal-secondary)]"
      >
        Stage create
      </button>
    </form>

    <div
      v-if="permissions.length === 0"
      class="rounded-xl border border-dashed border-[var(--ui-border)] p-6 text-sm text-[var(--ui-fg-muted)]"
      data-test="permissions-empty"
    >
      No permissions yet.
    </div>

    <div v-else class="space-y-4" data-test="permissions-list">
      <article
        v-for="permission in permissions"
        :key="permission.id"
        class="rounded-xl border border-[var(--ui-border)] p-4"
        :data-test="`permission-card-${permission.id}`"
      >
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 class="m-0 text-base font-medium text-[var(--ui-fg)]" :data-test="`permission-title-${permission.id}`">
              {{ permission.title }}
            </h3>
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
              Scope: {{ permission.scope ?? "document" }}
            </p>
          </div>
          <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
            Members: {{ permission.members.length }}
          </p>
        </div>

        <ul
          v-if="permission.members.length"
          class="m-0 mt-3 list-none space-y-2 p-0"
          :data-test="`permission-members-${permission.id}`"
        >
          <li
            v-for="member in permission.members"
            :key="member.memberId"
            class="flex items-center justify-between gap-2 rounded-lg border border-[var(--ui-border)] px-3 py-2"
            :data-test="`permission-member-${permission.id}-${member.memberId}`"
          >
            <span class="text-sm text-[var(--ui-fg)]">
              {{ member.memberLabel ?? member.memberId }}
              <span class="text-[var(--ui-fg-muted)]">({{ member.memberId }})</span>
            </span>
            <button
              v-if="member.memberId !== appApi.identity.activeIdentity.value?.identityId"
              type="button"
              class="rounded-lg border border-[var(--ui-border)] px-2 py-1 text-xs text-[var(--ui-fg)] transition hover:bg-[var(--ui-tonal-secondary)]"
              :data-test="`permission-revoke-${permission.id}-${member.memberId}`"
              @click="revokePermission(permission.id, member.memberId)"
            >
              Stage revoke
            </button>
          </li>
        </ul>

        <form
          class="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          :data-test="`permission-grant-form-${permission.id}`"
          @submit.prevent="grantPermission(permission.id)"
        >
          <input
            v-model="grantMemberIdByPermission[permission.id]"
            :data-test="`permission-grant-member-id-${permission.id}`"
            type="text"
            class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-fg)]"
            placeholder="member id"
          >
          <input
            v-model="grantMemberLabelByPermission[permission.id]"
            :data-test="`permission-grant-member-label-${permission.id}`"
            type="text"
            class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-fg)]"
            placeholder="member label (optional)"
          >
          <button
            type="submit"
            class="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-fg)] transition hover:bg-[var(--ui-tonal-secondary)]"
            :data-test="`permission-grant-submit-${permission.id}`"
          >
            Stage grant
          </button>
        </form>

        <p
          v-if="grantErrorByPermission[permission.id]"
          class="m-0 mt-2 text-sm text-[var(--ui-critical)]"
          :data-test="`permission-grant-error-${permission.id}`"
        >
          {{ grantErrorByPermission[permission.id] }}
        </p>
      </article>
    </div>
  </section>
</template>

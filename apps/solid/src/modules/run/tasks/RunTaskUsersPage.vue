<script setup lang="ts">
import { computed, ref } from "vue";
import { Button } from "ternent-ui/primitives";
import { useRunTaskActions } from "@/modules/run/services";
import { useAppShellAddDialogModel } from "@/modules/ui/useAppShellAddDialogModel";
import { useAppShellState } from "@/modules/ui/useAppShellState";
import { createTaskUserDialogSchema } from "./createTaskUserDialogSchema";
import RunTaskCommitBar from "./RunTaskCommitBar.vue";
import RunTasksDocumentNav from "./RunTasksDocumentNav.vue";
import { useRunTasksSurface } from "./useRunTasksSurface";

const surface = useRunTasksSurface();
const actions = useRunTaskActions();
const shellState = useAppShellState();
const addDialog = useAppShellAddDialogModel();
const errorMessage = ref<string | null>(null);

const headingBody = computed(() => {
  if (surface.mode.value === "unavailable") {
    return (
      surface.reason.value ?? "Users is not available for the current ledger."
    );
  }

  return surface.mode.value === "interactive"
    ? "Users are local records stored in this ledger. Add people from identity documents, then commit when you want those task and permission references persisted into signed history."
    : "You’re viewing this task document read-only. User records still come from this ledger. Add identity when you want to make changes.";
});

function handleFailure(error: string) {
  if (error.includes("Add identity") || error.includes("read-only")) {
    shellState.openConnect("create");
    return;
  }

  errorMessage.value = error;
}

function openCreateUserDialog() {
  errorMessage.value = null;
  addDialog.open({
    schema: createTaskUserDialogSchema(),
    submit: async (payload) => {
      const result = await actions.createTaskUser(payload);
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
            Users
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
              {{ surface.users.value.length }}
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
            v-if="surface.mode.value === 'interactive'"
            size="sm"
            class="rounded-lg"
            @click="openCreateUserDialog"
          >
            Add user
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
          v-if="!surface.users.value.length"
          class="rounded-[1rem] border border-dashed border-[var(--ui-border)]/80 px-5 py-8 text-center"
        >
          <div class="mx-auto flex max-w-xl flex-col items-center gap-3">
            <p class="m-0 text-lg font-medium text-[var(--ui-fg)]">
              No users yet.
            </p>
            <p class="m-0 text-sm leading-6 text-[var(--ui-fg-muted)]">
              Add user records here from identity documents so task assignments
              and permission groups can reference them by id inside this ledger.
            </p>
            <Button
              v-if="surface.mode.value === 'interactive'"
              class="rounded-lg"
              @click="openCreateUserDialog"
            >
              Add first user
            </Button>
          </div>
        </div>

        <div
          v-else
          class="overflow-hidden rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-surface)]"
        >
          <div
            class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-[var(--ui-border)] px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-[var(--ui-fg-muted)] sm:px-5"
          >
            <span>Name</span>
            <span>Identity</span>
            <span>Encryption</span>
          </div>

          <div class="divide-y divide-[var(--ui-border)]/50">
            <div
              v-for="user in surface.users.value"
              :key="user.userId"
              class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 px-4 py-3 sm:px-5"
            >
              <p class="m-0 truncate text-[15px] text-[var(--ui-fg)]">
                {{ user.name }}
              </p>
              <p class="m-0 truncate text-[12px] text-[var(--ui-fg-muted)]">
                {{ user.publicIdentityKey || "None" }}
              </p>
              <p class="m-0 truncate text-[12px] text-[var(--ui-fg-muted)]">
                {{ user.publicEncryptionKey || "None" }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RunTaskCommitBar v-if="surface.mode.value === 'interactive'" />
  </section>
</template>

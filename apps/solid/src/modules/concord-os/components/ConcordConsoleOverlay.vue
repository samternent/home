<script setup lang="ts">
import { Badge, Button, Input, Separator } from "ternent-ui/primitives";
import { useConcordOsKernel } from "@/modules/concord-os";

const kernel = useConcordOsKernel();
const todo = kernel.todo;
</script>

<template>
  <div v-if="kernel.showTodoConsole.value" class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <Badge :tone="todo.stagedCount.value ? 'warning' : 'neutral'" variant="soft">
        {{ todo.stagedCount.value }} staged
      </Badge>
      <Badge :tone="todo.saving.value ? 'accent' : 'neutral'" variant="soft">
        {{ todo.saving.value ? "committing" : "local replay" }}
      </Badge>
      <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
        Replay updates instantly. Commit when this change set is ready.
      </p>
    </div>

    <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem_auto] xl:items-end">
      <div class="space-y-1">
        <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">Pending change set</p>
        <div class="max-h-28 space-y-2 overflow-auto">
          <div
            v-for="transaction in todo.pendingTransactions.value.slice(-4).reverse()"
            :key="transaction.id"
            class="border-b border-[color-mix(in_srgb,var(--ui-border)_45%,transparent)] py-2 last:border-b-0"
          >
            <p class="m-0 text-[11px] text-[var(--ui-fg)]">{{ transaction.message }}</p>
            <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
              {{ transaction.stagedCount }} staged entity{{ transaction.stagedCount === 1 ? "" : "ies" }}
            </p>
          </div>
          <p v-if="!todo.pendingTransactions.value.length" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
            No local changes are waiting to be committed.
          </p>
        </div>
      </div>

      <label class="space-y-1">
        <span class="text-[11px] text-[var(--ui-fg-muted)]">Commit message</span>
        <Input
          :model-value="todo.commitMessage.value"
          aria-label="Commit message"
          placeholder="Describe this commit"
          @update:model-value="todo.setCommitMessage(String($event))"
        />
      </label>

      <Button
        size="sm"
        variant="secondary"
        :disabled="todo.saving.value || todo.stagedCount.value === 0"
        @click="todo.commitPending"
      >
        {{ todo.saving.value ? "Committing..." : "Commit" }}
      </Button>
    </div>

    <p
      v-if="todo.error.value"
      class="m-0 text-[11px] text-[color-mix(in_srgb,var(--ui-danger)_88%,white)]"
    >
      {{ todo.error.value }}
    </p>

    <Separator />

    <div class="space-y-2">
      <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">System log</p>
      <div class="space-y-2">
        <div
          v-for="entry in kernel.eventLog.value.slice(0, 6)"
          :key="entry.id"
          class="border-b border-[color-mix(in_srgb,var(--ui-border)_45%,transparent)] py-2 last:border-b-0"
        >
          <p class="m-0 text-[11px] text-[var(--ui-fg)]">{{ entry.message }}</p>
          <p v-if="entry.detail" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">{{ entry.detail }}</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="space-y-3">
    <div class="space-y-1">
      <p v-for="line in kernel.systemSummaryLines.value" :key="line" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
        {{ line }}
      </p>
    </div>
    <Separator />
    <div class="space-y-2">
      <div
        v-for="entry in kernel.eventLog.value.slice(0, 6)"
        :key="entry.id"
        class="border-b border-[color-mix(in_srgb,var(--ui-border)_45%,transparent)] py-2 last:border-b-0"
      >
        <p class="m-0 text-[11px] text-[var(--ui-fg)]">{{ entry.message }}</p>
        <p v-if="entry.detail" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">{{ entry.detail }}</p>
      </div>
      <p v-if="!kernel.eventLog.value.length" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
        System events will appear here as the workspace reacts.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Badge, Button, Checkbox, Input } from "ternent-ui/primitives";
import type { ConcordTodoItem } from "@/modules/concord-os/todo";

const props = defineProps<{
  items: ConcordTodoItem[];
  error: string | null;
  appLabel: string;
  statusLabel: string;
  statusDetail: string;
  lastAction: string | null;
  ledgerTitle: string;
  ledgerUrl: string;
}>();

const emit = defineEmits<{
  (event: "create", title: string): void;
  (event: "toggle", item: ConcordTodoItem): void;
  (event: "delete", itemId: string): void;
}>();

const title = ref("");

const openItems = computed(() => props.items.filter((item) => !item.completed));
const completedItems = computed(() => props.items.filter((item) => item.completed));

function submitCreate() {
  const nextTitle = title.value.trim();
  if (!nextTitle) {
    return;
  }

  emit("create", nextTitle);
  title.value = "";
}
</script>

<template>
  <div class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 p-4">
    <section class="overflow-auto">
      <div class="space-y-3 rounded-xl bg-[color-mix(in_srgb,var(--ui-bg-muted)_6%,transparent)] p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
              {{ appLabel }} workspace
            </p>
            <p class="m-0 text-base font-medium text-[var(--ui-fg)]">
              {{ ledgerTitle }}
            </p>
          </div>
          <Badge :tone="statusLabel === 'Pending' ? 'warning' : statusLabel === 'Committing' ? 'accent' : 'success'" variant="soft">
            {{ statusLabel }}
          </Badge>
        </div>

        <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
          {{ statusDetail }}
        </p>

        <div class="flex gap-2">
          <Input
            v-model="title"
            aria-label="New todo item"
            placeholder="Capture the next task"
            @keydown.enter.prevent="submitCreate"
          />
          <Button size="sm" variant="secondary" @click="submitCreate">
            Add
          </Button>
        </div>

        <p
          v-if="error"
          class="m-0 rounded-xl border border-[color-mix(in_srgb,var(--ui-danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--ui-danger)_10%,transparent)] px-3 py-2 text-[11px] text-[var(--ui-fg)]"
        >
          {{ error }}
        </p>

        <p v-else-if="lastAction" class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
          Last action: {{ lastAction }}
        </p>
      </div>
    </section>

    <section class="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div class="space-y-3 overflow-auto rounded-xl border border-[color-mix(in_srgb,var(--ui-border)_48%,transparent)] p-4">
        <div class="flex items-center justify-between gap-3">
          <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
            Active
          </p>
          <Badge tone="neutral" variant="soft">
            {{ openItems.length }}
          </Badge>
        </div>

        <div v-if="openItems.length" class="space-y-2">
          <div
            v-for="item in openItems"
            :key="item.id"
            class="flex items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--ui-border)_45%,transparent)] py-3 last:border-b-0"
          >
            <label class="flex min-w-0 flex-1 items-center gap-3">
              <Checkbox :model-value="item.completed" @update:model-value="$emit('toggle', item)" />
              <span class="truncate text-sm text-[var(--ui-fg)]">
                {{ item.title }}
              </span>
            </label>
            <Button size="xs" variant="plain-secondary" @click="$emit('delete', item.id)">
              Delete
            </Button>
          </div>
        </div>

        <p v-else class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
          No active tasks in this ledger yet.
        </p>
      </div>

      <div class="space-y-3 overflow-auto rounded-xl border border-[color-mix(in_srgb,var(--ui-border)_48%,transparent)] p-4">
        <div class="flex items-center justify-between gap-3">
          <p class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
            Completed
          </p>
          <Badge tone="neutral" variant="soft">
            {{ completedItems.length }}
          </Badge>
        </div>

        <div v-if="completedItems.length" class="space-y-2">
          <div
            v-for="item in completedItems"
            :key="item.id"
            class="flex items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--ui-border)_45%,transparent)] py-3 opacity-80 last:border-b-0"
          >
            <label class="flex min-w-0 flex-1 items-center gap-3">
              <Checkbox :model-value="item.completed" @update:model-value="$emit('toggle', item)" />
              <span class="truncate text-sm text-[var(--ui-fg-muted)] line-through">
                {{ item.title }}
              </span>
            </label>
            <Button size="xs" variant="plain-secondary" @click="$emit('delete', item.id)">
              Delete
            </Button>
          </div>
        </div>

        <p v-else class="m-0 text-[11px] text-[var(--ui-fg-muted)]">
          Completed work will collect here.
        </p>
      </div>
    </section>
  </div>
</template>

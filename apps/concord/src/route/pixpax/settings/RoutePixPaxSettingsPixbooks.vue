<script setup lang="ts">
import { usePixpaxContextStore } from "../../../module/pixpax/context/usePixpaxContextStore";
import { usePixpaxSwitchContext } from "../../../module/pixpax/context/usePixpaxSwitchContext";

const context = usePixpaxContextStore();
const switchContext = usePixpaxSwitchContext();

function renamePixbook(pixbookId: string, currentName: string) {
  const next = window.prompt("Pixbook name", currentName || "");
  if (!next || next.trim() === currentName) return;
  context.renamePixbook(pixbookId, next.trim());
}

async function switchPixbook(pixbookId: string) {
  await switchContext.switchPixbook(pixbookId);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-lg font-semibold">Pixbooks</h1>
    <p class="text-xs text-[var(--ui-fg-muted)]">
      One user, one pixbook, one collection. Each identity has one pixbook for the active collection.
    </p>

    <section class="rounded-lg border border-[var(--ui-border)] p-3 flex flex-col gap-2">
      <h2 class="text-sm font-semibold">Pixbook</h2>
      <p
        v-if="context.activeIdentityPixbooks.value.length === 0"
        class="text-xs text-[var(--ui-fg-muted)]"
      >
        No pixbook is available for this identity yet.
      </p>
      <div
        v-for="entry in context.activeIdentityPixbooks.value"
        :key="entry.id"
        class="rounded-md border border-[var(--ui-border)] p-2 flex items-center justify-between gap-3"
      >
        <div>
          <p class="text-xs font-semibold">
            {{ entry.name }}
            <span v-if="entry.id === context.currentPixbookId.value" class="text-[11px] text-[var(--ui-fg-muted)]">(current)</span>
          </p>
          <p class="text-[11px] text-[var(--ui-fg-muted)]">
            {{ entry.isDefault ? "default" : "active" }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5"
            @click="renamePixbook(entry.id, entry.name)"
          >
            Rename
          </button>
          <button
            v-if="entry.id !== context.currentPixbookId.value"
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5"
            @click="switchPixbook(entry.id)"
          >
            Switch
          </button>
        </div>
      </div>
    </section>

    <p v-if="switchContext.switchWarning.value" class="text-xs text-amber-600">{{ switchContext.switchWarning.value }}</p>
    <p v-if="switchContext.switchError.value" class="text-xs text-red-600">{{ switchContext.switchError.value }}</p>
    <p v-if="context.errorMessage.value" class="text-xs text-red-600">{{ context.errorMessage.value }}</p>
    <p v-if="context.statusMessage.value" class="text-xs text-green-600">{{ context.statusMessage.value }}</p>
  </div>
</template>

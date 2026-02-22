<script setup lang="ts">
import { usePixpaxContextStore } from "../../../module/pixpax/context/usePixpaxContextStore";

const context = usePixpaxContextStore();

function renamePixbook(pixbookId: string, currentName: string) {
  const next = window.prompt("Pixbook name", currentName || "");
  if (!next || next.trim() === currentName) return;
  context.renamePixbook(pixbookId, next.trim());
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-lg font-semibold">Pixbooks</h1>
    <p class="text-xs text-[var(--ui-fg-muted)]">
      Each identity has exactly one private pixbook per collection.
    </p>

    <section class="rounded-lg border border-[var(--ui-border)] p-3 flex flex-col gap-2">
      <h2 class="text-sm font-semibold">Current Collection Pixbook</h2>
      <p class="text-[11px] text-[var(--ui-fg-muted)]">
        Collection: <code>{{ context.currentCollectionId.value }}</code>
      </p>
      <p
        v-if="!context.activePixbook.value"
        class="text-xs text-[var(--ui-fg-muted)]"
      >
        No pixbook is available for this identity yet.
      </p>
      <div
        v-else
        class="rounded-md border border-[var(--ui-border)] p-2 flex items-center justify-between gap-3"
      >
        <div>
          <p class="text-xs font-semibold">
            {{ context.activePixbook.value.name }}
            <span class="text-[11px] text-[var(--ui-fg-muted)]">(current)</span>
          </p>
          <p class="text-[11px] text-[var(--ui-fg-muted)]">
            {{ context.activePixbook.value.isDefault ? "default" : "active" }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs hover:bg-[var(--ui-fg)]/5"
            @click="renamePixbook(context.activePixbook.value.id, context.activePixbook.value.name)"
          >
            Rename
          </button>
        </div>
      </div>
    </section>

    <p v-if="context.errorMessage.value" class="text-xs text-red-600">{{ context.errorMessage.value }}</p>
    <p v-if="context.statusMessage.value" class="text-xs text-green-600">{{ context.statusMessage.value }}</p>
  </div>
</template>

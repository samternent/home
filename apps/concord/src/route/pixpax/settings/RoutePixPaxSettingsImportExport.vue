<script setup lang="ts">
import { shallowRef } from "vue";
import { usePixpaxContextStore } from "../../../module/pixpax/context/usePixpaxContextStore";

const context = usePixpaxContextStore();
const importBusy = shallowRef(false);

async function onImportFile(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target?.files?.length) return;
  const file = target.files[0];
  target.value = "";

  importBusy.value = true;
  try {
    await context.importPixbookFile(file, { confirm: true });
  } finally {
    importBusy.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-lg font-semibold">Import / Export</h1>
    <p class="text-xs text-[var(--ui-fg-muted)]">
      Export before destructive changes. Private exports contain signing and encryption secrets.
    </p>

    <section class="rounded-lg border border-[var(--ui-border)] p-3 flex flex-col gap-2">
      <button
        type="button"
        class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
        :disabled="context.disabled.value || context.pixbookReadOnly.value"
        @click="context.downloadPixbook('private')"
      >
        Export private pixbook
      </button>
      <button
        type="button"
        class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 disabled:opacity-50"
        :disabled="context.disabled.value"
        @click="context.downloadPixbook('public')"
      >
        Export public pixbook
      </button>
      <label class="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs hover:bg-[var(--ui-fg)]/5 cursor-pointer">
        {{ importBusy ? "Importing..." : "Import pixbook" }}
        <input
          type="file"
          accept="application/json"
          class="hidden"
          :disabled="importBusy"
          @change="onImportFile"
        />
      </label>
    </section>

    <p v-if="context.uploadStatus.value" class="text-xs text-green-600">{{ context.uploadStatus.value }}</p>
    <p v-if="context.uploadError.value" class="text-xs text-red-600">{{ context.uploadError.value }}</p>
  </div>
</template>

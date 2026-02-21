<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { listPixpaxCollectionCatalog } from "../../module/pixpax/api/client";

const loading = ref(false);
const error = ref("");
const collections = ref<
  Array<{
    collectionId: string;
    resolvedVersion: string;
    name: string;
    description?: string;
    issuer?: { name?: string };
  }>
>([]);

async function loadCatalog() {
  loading.value = true;
  error.value = "";
  try {
    const response = await listPixpaxCollectionCatalog();
    collections.value = Array.isArray(response.collections)
      ? response.collections
      : [];
  } catch (nextError: any) {
    error.value = String(nextError?.message || "Failed to load collection catalog.");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadCatalog();
});
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
    <header class="flex flex-col gap-1">
      <h1 class="text-3xl font-semibold tracking-tight text-[var(--ui-fg)]">Collections</h1>
      <p class="text-sm text-[var(--ui-fg-muted)]">
        Browse public PixPax collections.
      </p>
    </header>

    <p v-if="loading" class="text-sm text-[var(--ui-fg-muted)]">Loading collections...</p>
    <p v-else-if="error" class="text-sm text-red-700">{{ error }}</p>
    <p v-else-if="!collections.length" class="text-sm text-[var(--ui-fg-muted)]">
      No public collections yet.
    </p>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <RouterLink
        v-for="row in collections"
        :key="`${row.collectionId}:${row.resolvedVersion}`"
        :to="`/pixpax/collections/${encodeURIComponent(row.collectionId)}`"
        class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/70 p-4 transition hover:border-[var(--ui-fg)]/30"
      >
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold text-[var(--ui-fg)]">{{ row.name || row.collectionId }}</h2>
          <p class="text-xs text-[var(--ui-fg-muted)]">Issued by {{ row.issuer?.name || "PixPax" }}</p>
          <p v-if="row.description" class="text-sm text-[var(--ui-fg-muted)]">{{ row.description }}</p>
          <p class="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]">
            {{ row.collectionId }} · {{ row.resolvedVersion }}
          </p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import {
  getPixpaxCollectionBundle,
  resolvePixpaxCollection,
} from "../../module/pixpax/api/client";
import { usePixbook } from "../../module/pixpax/state/usePixbook";
import {
  deriveOwnedCardIdsForCollectionVersion,
  deriveOwnedCollectionIdsFromPacks,
} from "../../module/pixpax/domain/collection-discovery";

type OwnedCollectionRow = {
  collectionId: string;
  resolvedVersion: string;
  name: string;
  issuerName: string;
  collected: number;
  total: number;
};

const { receivedPacks } = usePixbook();
const loading = ref(false);
const error = ref("");
const rows = ref<OwnedCollectionRow[]>([]);

const ownedCollectionIds = computed(() =>
  deriveOwnedCollectionIdsFromPacks(receivedPacks.value as any[])
);

async function loadOwnedCollections() {
  loading.value = true;
  error.value = "";

  try {
    const nextRows: OwnedCollectionRow[] = [];
    for (const collectionId of ownedCollectionIds.value) {
      const resolved = await resolvePixpaxCollection(collectionId);
      const bundle = await getPixpaxCollectionBundle(
        collectionId,
        resolved.resolvedVersion
      );
      const cardIds = Array.isArray(bundle?.index?.cards)
        ? bundle.index.cards.map((value) => String(value || "").trim()).filter(Boolean)
        : [];
      const owned = deriveOwnedCardIdsForCollectionVersion(
        receivedPacks.value as any[],
        collectionId,
        resolved.resolvedVersion
      );
      nextRows.push({
        collectionId,
        resolvedVersion: resolved.resolvedVersion,
        name: String((bundle.collection as any)?.name || collectionId),
        issuerName: String(resolved.issuer?.name || "").trim() || "PixPax",
        collected: cardIds.filter((cardId) => owned.has(cardId)).length,
        total: cardIds.length,
      });
    }

    rows.value = nextRows.sort((a, b) => a.collectionId.localeCompare(b.collectionId));
  } catch (nextError: any) {
    error.value = String(nextError?.message || "Failed to load My Collections.");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadOwnedCollections();
});

watch(
  () => ownedCollectionIds.value.join("|"),
  () => {
    void loadOwnedCollections();
  }
);
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
    <header class="flex flex-col gap-1">
      <h1 class="text-3xl font-semibold tracking-tight text-[var(--ui-fg)]">My Collections</h1>
      <p class="text-sm text-[var(--ui-fg-muted)]">
        Collections where this identity owns at least one card.
      </p>
    </header>

    <p v-if="loading" class="text-sm text-[var(--ui-fg-muted)]">Loading your collections...</p>
    <p v-else-if="error" class="text-sm text-red-700">{{ error }}</p>
    <p v-else-if="!rows.length" class="text-sm text-[var(--ui-fg-muted)]">
      You have not collected any cards yet.
    </p>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <RouterLink
        v-for="row in rows"
        :key="`${row.collectionId}:${row.resolvedVersion}`"
        :to="{
          name: 'pixpax-collection',
          params: { collectionId: row.collectionId },
        }"
        class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/70 p-4 transition hover:border-[var(--ui-fg)]/30"
      >
        <h2 class="text-lg font-semibold text-[var(--ui-fg)]">{{ row.name }}</h2>
        <p class="text-xs text-[var(--ui-fg-muted)]">Issued by {{ row.issuerName }}</p>
        <p class="mt-2 text-sm text-[var(--ui-fg-muted)]">{{ row.collected }} / {{ row.total }} collected</p>
        <div class="mt-2 h-1.5 w-full rounded-full bg-[var(--ui-fg)]/12">
          <div
            class="h-full rounded-full bg-[var(--ui-fg)]/70"
            :style="{ width: `${row.total ? Math.round((row.collected / row.total) * 100) : 0}%` }"
          />
        </div>
      </RouterLink>
    </div>
  </div>
</template>

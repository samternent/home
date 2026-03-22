<script setup lang="ts">
import { computed, onMounted } from "vue";
import { Badge, Button, Card } from "ternent-ui/primitives";
import { usePixpaxCollections } from "@/modules/collections/usePixpaxCollections";
import StickerCard from "@/modules/stickerbook/components/StickerCard.vue";

const collections = usePixpaxCollections();
const collectionCards = computed(() =>
  collections.collections.value.map((entry) => {
    const bundle =
      collections.bundlesByKey.value[`${entry.collectionId}::${entry.resolvedVersion}`] || null;
    return {
      entry,
      bundle,
      previewCards: bundle?.cards.slice(0, 3) || [],
    };
  }),
);

onMounted(async () => {
  const catalog = await collections.loadCatalog().catch(() => []);
  await Promise.all(
    (catalog || []).slice(0, 4).map((entry) => collections.loadBundle(entry.collectionId).catch(() => null)),
  );
});
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-3">
      <p class="m-0 text-xs uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Collections</p>
      <h1 class="m-0 font-mono text-[clamp(2.2rem,6vw,4rem)] uppercase tracking-[-0.08em]">Sticker shelves</h1>
      <p class="m-0 max-w-3xl text-sm text-[var(--ui-fg-muted)]">
        This is the archive shelf for public collections. The beta collecting flow starts from a printed card or redeem link.
      </p>
      <div class="flex flex-wrap gap-2">
        <Button as="RouterLink" :to="'/app/pixbook'" size="sm" variant="plain-secondary">
          Back to my Pixbook
        </Button>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <Card
        v-for="row in collectionCards"
        :key="row.entry.collectionId"
        variant="showcase"
        padding="sm"
        class="space-y-5 overflow-hidden"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-2">
            <h2 class="m-0 font-mono text-2xl uppercase tracking-[-0.06em]">
              {{ row.entry.name }}
            </h2>
            <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
              {{ row.entry.description || "No public description yet." }}
            </p>
          </div>
          <Badge tone="primary" variant="soft">{{ row.entry.resolvedVersion }}</Badge>
        </div>

        <div class="flex flex-wrap justify-center gap-4 sm:justify-start">
          <StickerCard
            v-for="card in row.previewCards"
            :key="card.cardId"
            :bundle="row.bundle!"
            :card="card"
            compact
          />
          <div
            v-if="!row.previewCards.length"
            class="flex h-44 w-full items-center justify-center rounded-[1.2rem] border border-[var(--ui-border)] text-sm text-[var(--ui-fg-muted)]"
          >
            Preview loading…
          </div>
        </div>

          <div class="flex flex-wrap items-center gap-2">
          <Button
            as="RouterLink"
            :to="`/app/collections/${row.entry.collectionId}`"
            size="sm"
            variant="secondary"
            class="!rounded-full !font-mono !uppercase !tracking-[0.14em]"
          >
            Open stickerbook
          </Button>
        </div>
      </Card>
    </div>
  </section>
</template>

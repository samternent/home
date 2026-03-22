<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { Button, Card } from "ternent-ui/primitives";
import { usePixbookSession } from "@/modules/pixbook/usePixbookSession";
import { usePixpaxCollections } from "@/modules/collections/usePixpaxCollections";
import StickerbookCollectionScene from "@/modules/stickerbook/components/StickerbookCollectionScene.vue";

const route = useRoute();
const collections = usePixpaxCollections();
const pixbook = usePixbookSession();
const bundle = ref<Awaited<ReturnType<typeof collections.loadBundle>> | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const collectionId = computed(() => String(route.params.collectionId || ""));

async function load() {
  if (!collectionId.value) return;

  loading.value = true;
  error.value = null;
  try {
    bundle.value = await collections.loadBundle(collectionId.value);
    await pixbook.ensureReady();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Failed to load collection.";
  } finally {
    loading.value = false;
  }
}

watch(collectionId, async () => {
  await load();
});

onMounted(async () => {
  await load();
});
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Button as="RouterLink" :to="'/app/collections'" size="sm" variant="plain-secondary">
        Back to collections
      </Button>
    </div>

    <Card v-if="error" variant="subtle" padding="sm">
      <p class="m-0 text-sm text-[var(--ui-danger)]">{{ error }}</p>
    </Card>
    <Card v-else-if="loading" variant="subtle" padding="sm">
      <p class="m-0 text-sm text-[var(--ui-fg-muted)]">Loading collection…</p>
    </Card>

    <StickerbookCollectionScene
      v-if="bundle"
      :bundle="bundle"
      :replay-state="pixbook.replayState.value"
    />
  </section>
</template>

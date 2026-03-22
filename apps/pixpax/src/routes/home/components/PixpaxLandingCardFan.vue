<script setup lang="ts">
import type {
  PixpaxPublicCollectionBundle,
  PixpaxPublicCollectionCard,
} from "@/modules/api/client";
import StickerCard from "@/modules/stickerbook/components/StickerCard.vue";

defineProps<{
  bundle: PixpaxPublicCollectionBundle;
  cards: readonly PixpaxPublicCollectionCard[];
  mode?: "fan" | "row";
  compact?: boolean;
}>();
</script>

<template>
  <div :class="mode === 'row' ? 'pixpax-card-row' : 'pixpax-card-fan'">
    <div
      v-for="card in cards"
      :key="card.cardId"
      :class="mode === 'row' ? 'pixpax-card-row__item' : 'pixpax-card-fan__item'"
      data-testid="sample-card"
    >
      <StickerCard :bundle="bundle" :card="card" :compact="compact" />
    </div>
  </div>
</template>

<style scoped>
.pixpax-card-fan {
  position: relative;
  min-height: 25.5rem;
}

.pixpax-card-fan__item {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
}

.pixpax-card-fan__item:nth-child(1) {
  transform: translate(-96%, -50%) rotate(-20deg) scale(0.92);
}

.pixpax-card-fan__item:nth-child(2) {
  z-index: 2;
  transform: translate(-52%, -52%) scale(1.05);
}

.pixpax-card-fan__item:nth-child(3) {
  transform: translate(0, -50%) rotate(20deg) scale(0.92);
}

.pixpax-card-fan__item :deep(.sticker-frame-card) {
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.65),
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 44px rgba(250, 204, 21, 0.18);
}

.pixpax-card-row {
  display: grid;
  gap: 1.5rem;
}

.pixpax-card-row__item {
  display: flex;
  justify-content: center;
  padding: 0.25rem;
}

@media (min-width: 640px) {
  .pixpax-card-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .pixpax-card-fan {
    min-height: 20.5rem;
  }

  .pixpax-card-fan__item:nth-child(1) {
    transform: translate(-90%, -50%) rotate(-14deg) scale(0.76);
  }

  .pixpax-card-fan__item:nth-child(2) {
    transform: translate(-50%, -51%) scale(0.86);
  }

  .pixpax-card-fan__item:nth-child(3) {
    transform: translate(-4%, -50%) rotate(14deg) scale(0.76);
  }
}
</style>

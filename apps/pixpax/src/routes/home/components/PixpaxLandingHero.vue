<script setup lang="ts">
import { Button } from "ternent-ui/primitives";
import type {
  PixpaxPublicCollectionBundle,
  PixpaxPublicCollectionCard,
} from "@/modules/api/client";
import PixpaxLandingCardFan from "./PixpaxLandingCardFan.vue";

defineProps<{
  headline: string;
  supporting: string;
  ctaLabel: string;
  bundle: PixpaxPublicCollectionBundle;
  cards: readonly PixpaxPublicCollectionCard[];
}>();
</script>

<template>
  <section class="pixpax-hero">
    <div class="pixpax-hero__layout">
      <div class="pixpax-hero__content">
        <h1 class="pixpax-hero__headline">{{ headline }}</h1>
        <p class="pixpax-hero__supporting">{{ supporting }}</p>
        <Button
          as="RouterLink"
          to="/app/pixbook"
          size="lg"
        >
          {{ ctaLabel }}
        </Button>
      </div>

      <div class="pixpax-hero__cards">
        <PixpaxLandingCardFan
          :bundle="bundle"
          :cards="cards"
          mode="fan"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.pixpax-hero {
  padding: 6.25rem 0 6.75rem;
}

.pixpax-hero__layout {
  display: grid;
  align-items: center;
  gap: 1.75rem;
}

.pixpax-hero__content {
  display: flex;
  max-width: 32rem;
  flex-direction: column;
  align-items: flex-start;
  align-self: center;
  gap: 0.9rem;
}

.pixpax-hero__headline {
  margin: 0;
  max-width: 7ch;
  color: var(--ui-fg);
  font-size: clamp(4.5rem, 8vw, 5.5rem);
  font-weight: 600;
  letter-spacing: -0.06em;
  line-height: 0.9;
  text-wrap: balance;
}

.pixpax-hero__supporting {
  margin: 0;
  max-width: 28rem;
  color: var(--ui-fg-muted);
  font-size: 0.96rem;
  line-height: 1.6;
  text-wrap: pretty;
}

.pixpax-hero__cards {
  min-width: 0;
  display: flex;
  width: 100%;
  max-width: 29rem;
  align-self: center;
  align-items: center;
  justify-content: center;
}

@media (min-width: 1024px) {
  .pixpax-hero__layout {
    grid-template-columns: minmax(0, 32rem) minmax(20rem, 29rem);
    justify-content: space-between;
    gap: 1.5rem;
  }
}

@media (max-width: 1023px) {
  .pixpax-hero {
    padding: 5rem 0 4.75rem;
  }

  .pixpax-hero__content {
    align-items: center;
    margin: 0 auto;
    text-align: center;
  }

  .pixpax-hero__cards {
    max-width: 100%;
  }
}
</style>

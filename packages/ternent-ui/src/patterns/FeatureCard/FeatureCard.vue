<script setup lang="ts">
import { computed } from "vue";
import Card from "../../primitives/Card/Card.vue";
import type {
  FeatureCardSize,
  FeatureCardSurface,
  FeatureCardTone,
} from "./FeatureCard.types";

const props = withDefaults(
  defineProps<{
    description?: string;
    size?: FeatureCardSize;
    surface?: FeatureCardSurface;
    title: string;
    tone?: FeatureCardTone;
  }>(),
  {
    description: undefined,
    size: "md",
    surface: "elevated",
    tone: "primary",
  },
);

const rootClass = computed(() => [
  "ui-feature-card",
  `ui-feature-card--${props.size}`,
  `ui-feature-card--${props.surface}`,
]);
const iconClass = computed(() => [
  "ui-feature-card__icon",
  `ui-feature-card__icon--${props.tone}`,
]);
const cardVariant = computed(() => {
  if (props.surface === "panel") {
    return "panel";
  }

  if (props.surface === "subtle") {
    return "subtle";
  }

  return "elevated";
});
</script>

<template>
  <Card
    :padding="props.size === 'sm' ? 'sm' : 'md'"
    :variant="cardVariant"
    :class="rootClass"
  >
    <div v-if="$slots.icon" :class="iconClass" aria-hidden="true">
      <slot name="icon" />
    </div>
    <div class="ui-feature-card__body">
      <h3 class="ui-feature-card__title">{{ props.title }}</h3>
      <p v-if="props.description" class="ui-feature-card__description">
        {{ props.description }}
      </p>
      <div v-if="$slots.default" class="ui-feature-card__content">
        <slot />
      </div>
    </div>
  </Card>
</template>

<style scoped>
.ui-feature-card {
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 1.25rem;
  overflow: hidden;
}

.ui-feature-card::after {
  position: absolute;
  inset: auto 0 0 0;
  height: 1px;
  content: "";
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--ui-primary-muted) 64%, transparent),
    transparent
  );
}

.ui-feature-card--panel::after {
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--ui-accent-muted) 54%, transparent),
    transparent
  );
}

.ui-feature-card--subtle::after {
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--ui-border) 92%, transparent),
    transparent
  );
}

.ui-feature-card--sm {
  gap: 1rem;
}

.ui-feature-card__icon {
  display: inline-flex;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  border-radius: var(--ui-radius-md);
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.ui-feature-card__icon--primary {
  color: var(--ui-primary);
}

.ui-feature-card__icon--secondary {
  color: var(--ui-secondary);
}

.ui-feature-card__icon--accent {
  color: var(--ui-accent);
}

.ui-feature-card__icon--success {
  color: var(--ui-success);
}

.ui-feature-card__icon--info {
  color: var(--ui-info);
}

.ui-feature-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.75rem;
}

.ui-feature-card--subtle .ui-feature-card__body {
  gap: 0.625rem;
}

.ui-feature-card__title {
  margin: 0;
  color: var(--ui-fg);
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.ui-feature-card--sm .ui-feature-card__title {
  font-size: 1.1rem;
}

.ui-feature-card__description,
.ui-feature-card__content {
  margin: 0;
  color: var(--ui-fg-muted);
  font-size: 1rem;
  line-height: 1.65;
}

.ui-feature-card--subtle .ui-feature-card__description,
.ui-feature-card--subtle .ui-feature-card__content {
  color: color-mix(in srgb, var(--ui-fg-muted) 88%, var(--ui-fg) 12%);
}

.ui-feature-card--sm .ui-feature-card__description,
.ui-feature-card--sm .ui-feature-card__content {
  font-size: 0.95rem;
}
</style>

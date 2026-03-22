<script setup lang="ts">
import { Card } from "ternent-ui/primitives";

withDefaults(
  defineProps<{
    title: string;
    description: string;
    iconLabel: string;
    tone?: "primary" | "secondary" | "accent" | "success";
    surface?: "panel" | "subtle" | "outline";
    compact?: boolean;
    theme?: "dark" | "light";
  }>(),
  {
    tone: "primary",
    surface: "panel",
    compact: false,
    theme: "dark",
  },
);
</script>

<template>
  <Card
    :variant="surface"
    :padding="compact ? 'sm' : 'md'"
    class="pixpax-info-card"
    :class="[
      compact ? 'pixpax-info-card--compact' : '',
      theme === 'light' ? 'pixpax-info-card--light' : '',
    ]"
  >
    <h3 class="pixpax-info-card__title">{{ title }}</h3>
    <p class="pixpax-info-card__description">{{ description }}</p>
  </Card>
</template>

<style scoped>
.pixpax-info-card {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 0.7rem;
  border-color: rgba(255, 255, 255, 0.03);
  border-radius: 0.9rem;
  background: linear-gradient(180deg, #181329, #110d1d);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.65),
    0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.pixpax-info-card--compact {
  gap: 0.6rem;
}

.pixpax-info-card--light {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.pixpax-info-card__title {
  margin: 0;
  color: var(--ui-fg);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.pixpax-info-card--compact .pixpax-info-card__title {
  font-size: 1rem;
}

.pixpax-info-card__description {
  margin: 0;
  color: var(--ui-fg-muted);
  font-size: 0.94rem;
  line-height: 1.6;
}

.pixpax-info-card--light .pixpax-info-card__title {
  color: #0f172a;
}

.pixpax-info-card--light .pixpax-info-card__description {
  color: #475569;
}
</style>

<script setup lang="ts">
import type { StepListItem } from "./StepList.types";

defineProps<{
  items: readonly StepListItem[];
}>();
</script>

<template>
  <ol class="ui-step-list">
    <li v-for="(item, index) in items" :key="item.title" class="ui-step-list__item">
      <div class="ui-step-list__marker" aria-hidden="true">
        {{ index + 1 }}
      </div>
      <div class="ui-step-list__body">
        <h3 class="ui-step-list__title">{{ item.title }}</h3>
        <p class="ui-step-list__description">{{ item.description }}</p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.ui-step-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ui-step-list__item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: start;
}

.ui-step-list__marker {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--ui-primary) 40%, var(--ui-border));
  border-radius: 999px;
  background: color-mix(in srgb, var(--ui-primary-muted) 72%, transparent);
  color: var(--ui-fg);
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: var(--ui-shadow-sm);
}

.ui-step-list__body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1.5rem;
}

.ui-step-list__item:not(:last-child) .ui-step-list__body::after {
  position: absolute;
  top: 2rem;
  left: -1.5rem;
  width: 1px;
  height: calc(100% - 0.25rem);
  content: "";
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ui-primary-muted) 80%, transparent),
    transparent
  );
}

.ui-step-list__title {
  margin: 0;
  color: var(--ui-fg);
  font-size: 1.375rem;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.ui-step-list__description {
  margin: 0;
  color: var(--ui-fg-muted);
  font-size: 1rem;
  line-height: 1.7;
}
</style>

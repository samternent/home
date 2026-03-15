<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string;
    title: string;
    titleTag?: "h2" | "h3";
  }>(),
  {
    eyebrow: undefined,
    titleTag: "h2",
  },
);
</script>

<template>
  <section class="ui-section-clarifier">
    <div class="ui-section-clarifier__header">
      <p v-if="eyebrow" class="ui-section-clarifier__eyebrow">
        {{ eyebrow }}
      </p>
      <component :is="titleTag" class="ui-section-clarifier__title">
        {{ title }}
      </component>
    </div>

    <div class="ui-section-clarifier__frame">
      <div class="ui-section-clarifier__content">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.ui-section-clarifier {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  margin-inline: auto;
}

.ui-section-clarifier__header {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.ui-section-clarifier__eyebrow {
  margin: 0;
  color: var(--ui-fg-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.ui-section-clarifier__title {
  margin: 0;
  max-width: 30rem;
  color: var(--ui-fg);
  font-size: clamp(1.25rem, 1.8vw, 1.5rem);
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.16;
  text-wrap: balance;
}

.ui-section-clarifier__frame {
  border-top: 1px solid color-mix(in srgb, var(--ui-border) 82%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ui-border) 82%, transparent);
  background-color: color-mix(
    in srgb,
    var(--ui-bg) 84%,
    var(--ui-tonal-secondary) 16%
  );
}

.ui-section-clarifier__content {
  min-width: 0;
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .ui-section-clarifier__content {
    padding: 1.75rem 2rem;
  }
}
</style>

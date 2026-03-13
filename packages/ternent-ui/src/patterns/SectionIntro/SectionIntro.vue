<script setup lang="ts">
import { computed } from "vue";
import type {
  SectionIntroAlign,
  SectionIntroSize,
  SectionIntroTitleTag,
} from "./SectionIntro.types";

const props = withDefaults(
  defineProps<{
    align?: SectionIntroAlign;
    description?: string;
    eyebrow?: string;
    size?: SectionIntroSize;
    title: string;
    titleTag?: SectionIntroTitleTag;
  }>(),
  {
    align: "start",
    description: undefined,
    eyebrow: undefined,
    size: "section",
    titleTag: "h2",
  },
);

const rootClass = computed(() => [
  "ui-section-intro",
  `ui-section-intro--${props.align}`,
  `ui-section-intro--${props.size}`,
]);

const titleClass = computed(() => [
  "ui-section-intro__title",
  `ui-section-intro__title--${props.size}`,
]);
</script>

<template>
  <div :class="rootClass">
    <p v-if="props.eyebrow" class="ui-section-intro__eyebrow">
      {{ props.eyebrow }}
    </p>
    <component :is="props.titleTag" :class="titleClass">
      {{ props.title }}
    </component>
    <p v-if="props.description" class="ui-section-intro__description">
      {{ props.description }}
    </p>
    <div v-if="$slots.actions" class="ui-section-intro__actions">
      <slot name="actions" />
    </div>
    <div v-if="$slots.default" class="ui-section-intro__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ui-section-intro {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--ui-fg);
}

.ui-section-intro--center {
  align-items: center;
  text-align: center;
}

.ui-section-intro__eyebrow {
  margin: 0;
  color: var(--ui-fg-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.ui-section-intro__title {
  margin: 0;
  color: var(--ui-fg);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1.05;
  text-wrap: balance;
}

.ui-section-intro__title--hero {
  max-width: 12ch;
  font-size: clamp(3.25rem, 6.4vw, 5.65rem);
  letter-spacing: -0.05em;
  line-height: 0.98;
}

.ui-section-intro__title--section {
  font-size: clamp(2.25rem, 4vw, 3.25rem);
}

.ui-section-intro__title--compact {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
}

.ui-section-intro__description {
  margin: 0;
  max-width: 42rem;
  color: var(--ui-fg-muted);
  font-size: 1.125rem;
  line-height: 1.7;
  text-wrap: pretty;
}

.ui-section-intro--hero .ui-section-intro__description {
  max-width: 34rem;
  font-size: 1.03rem;
  line-height: 1.75;
  color: color-mix(in srgb, var(--ui-fg-muted) 92%, var(--ui-bg) 8%);
}

.ui-section-intro--compact .ui-section-intro__description {
  font-size: 1rem;
}

.ui-section-intro__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.ui-section-intro--center .ui-section-intro__actions {
  justify-content: center;
}

.ui-section-intro__content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>

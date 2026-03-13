<script setup lang="ts">
import { computed } from "vue";
import Badge from "../../primitives/Badge/Badge.vue";
import Card from "../../primitives/Card/Card.vue";
import type {
  PreviewPanelBadgeMode,
  PreviewPanelEmphasis,
  PreviewPanelRow,
  PreviewPanelTone,
} from "./PreviewPanel.types";

const props = withDefaults(
  defineProps<{
    activeTab?: string;
    badgeMode?: PreviewPanelBadgeMode;
    code?: string;
    emphasis?: PreviewPanelEmphasis;
    footerLabel?: string;
    footerText?: string;
    footerTone?: PreviewPanelTone;
    meta?: string;
    rows?: readonly PreviewPanelRow[];
    statusLabel?: string;
    statusTone?: PreviewPanelTone;
    tabs?: readonly string[];
    title?: string;
  }>(),
  {
    activeTab: undefined,
    badgeMode: "default",
    code: undefined,
    emphasis: "default",
    footerLabel: undefined,
    footerText: undefined,
    footerTone: "neutral",
    meta: undefined,
    rows: undefined,
    statusLabel: undefined,
    statusTone: "neutral",
    tabs: undefined,
    title: undefined,
  },
);

const hasFooter = computed(() => Boolean(props.footerLabel || props.footerText));
const toneClass = (tone?: PreviewPanelTone) =>
  tone ? `ui-preview-panel__value--${tone}` : undefined;
const rootClass = computed(() => [
  "ui-preview-panel",
  `ui-preview-panel--${props.emphasis}`,
]);
const badgeVariant = computed(() =>
  props.badgeMode === "quiet" ? "outline" : "soft",
);
const badgeTone = (tone?: PreviewPanelTone) =>
  tone === "info" ? "primary" : tone;
</script>

<template>
  <Card :class="rootClass" variant="panel" padding="md">
    <div v-if="props.tabs?.length" class="ui-preview-panel__tabs" aria-hidden="true">
      <span
        v-for="tab in props.tabs"
        :key="tab"
        class="ui-preview-panel__tab"
        :data-active="tab === props.activeTab"
      >
        {{ tab }}
      </span>
    </div>

    <div v-if="props.title || props.statusLabel || props.meta" class="ui-preview-panel__header">
      <div class="ui-preview-panel__heading">
        <h3 v-if="props.title" class="ui-preview-panel__title">{{ props.title }}</h3>
      </div>
      <Badge
        v-if="props.statusLabel"
        :tone="badgeTone(props.statusTone)"
        :variant="badgeVariant"
        size="sm"
      >
        {{ props.statusLabel }}
      </Badge>
      <span v-else-if="props.meta" class="ui-preview-panel__meta">{{ props.meta }}</span>
    </div>

    <div class="ui-preview-panel__body">
      <dl v-if="props.rows?.length" class="ui-preview-panel__rows">
        <div v-for="row in props.rows" :key="row.label" class="ui-preview-panel__row">
          <dt class="ui-preview-panel__label">{{ row.label }}</dt>
          <dd class="ui-preview-panel__value" :class="toneClass(row.valueTone)">
            {{ row.value }}
          </dd>
        </div>
      </dl>

      <pre v-else-if="props.code" class="ui-preview-panel__code"><code>{{ props.code }}</code></pre>

      <div v-else class="ui-preview-panel__slot">
        <slot />
      </div>
    </div>

    <div v-if="hasFooter" class="ui-preview-panel__footer">
      <Badge
        v-if="props.footerLabel"
        :tone="badgeTone(props.footerTone)"
        :variant="badgeVariant"
        size="sm"
      >
        {{ props.footerLabel }}
      </Badge>
      <p v-if="props.footerText" class="ui-preview-panel__footer-text">
        {{ props.footerText }}
      </p>
    </div>
  </Card>
</template>

<style scoped>
.ui-preview-panel {
  position: relative;
  overflow: hidden;
}

.ui-preview-panel::before {
  position: absolute;
  inset: 0;
  content: "";
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--ui-tonal-tertiary) 78%, transparent), transparent 28%),
    radial-gradient(circle at top right, color-mix(in srgb, var(--ui-primary-muted) 38%, transparent), transparent 38%);
  opacity: 0.42;
  pointer-events: none;
}

.ui-preview-panel--subtle::before {
  opacity: 0.22;
}

.ui-preview-panel--strong::before {
  opacity: 0.34;
}

.ui-preview-panel::after {
  position: absolute;
  inset: 0;
  content: "";
  border-radius: inherit;
  background-image:
    linear-gradient(color-mix(in srgb, var(--ui-border) 72%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--ui-border) 72%, transparent) 1px, transparent 1px);
  background-position: center;
  background-size: 2.25rem 2.25rem;
  mask-image: radial-gradient(circle at center, black, transparent 78%);
  opacity: 0.12;
  pointer-events: none;
}

.ui-preview-panel--subtle::after {
  opacity: 0.12;
}

.ui-preview-panel--strong::after {
  opacity: 0.18;
}

.ui-preview-panel--strong {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--ui-border) 84%, transparent),
    0 14px 30px color-mix(in srgb, var(--ui-bg) 55%, transparent);
}

.ui-preview-panel > * {
  position: relative;
  z-index: 1;
}

.ui-preview-panel__tabs {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 1rem;
  padding: 0.25rem;
  border: 1px solid var(--ui-border);
  border-radius: calc(var(--ui-radius-md) + 4px);
  background: color-mix(in srgb, var(--ui-surface) 72%, transparent);
}

.ui-preview-panel--strong .ui-preview-panel__tabs {
  background: color-mix(in srgb, var(--ui-surface) 86%, transparent);
}

.ui-preview-panel__tab {
  padding: 0.375rem 0.75rem;
  border-radius: calc(var(--ui-radius-sm) + 2px);
  color: var(--ui-fg-muted);
  font-size: 0.875rem;
  font-weight: 500;
}

.ui-preview-panel__tab[data-active="true"] {
  background: var(--ui-surface);
  color: var(--ui-fg);
  box-shadow: var(--ui-shadow-sm);
}

.ui-preview-panel--strong .ui-preview-panel__tab[data-active="true"] {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--ui-border) 86%, transparent),
    var(--ui-shadow-sm);
}

.ui-preview-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.ui-preview-panel__title {
  margin: 0;
  color: var(--ui-fg);
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.ui-preview-panel--strong .ui-preview-panel__title {
  font-size: 1.2rem;
}

.ui-preview-panel__meta {
  color: var(--ui-fg-muted);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ui-preview-panel__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ui-preview-panel__rows {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin: 0;
}

.ui-preview-panel__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ui-border) 72%, transparent);
}

.ui-preview-panel--strong .ui-preview-panel__row {
  border-bottom-color: color-mix(in srgb, var(--ui-border) 88%, transparent);
}

.ui-preview-panel__row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.ui-preview-panel__label {
  color: var(--ui-fg-muted);
  font-size: 0.875rem;
}

.ui-preview-panel__value {
  margin: 0;
  color: var(--ui-fg);
  font-size: 0.95rem;
  font-weight: 500;
  text-align: right;
}

.ui-preview-panel__value--primary,
.ui-preview-panel__value--info {
  color: var(--ui-primary);
}

.ui-preview-panel__value--secondary {
  color: var(--ui-secondary);
}

.ui-preview-panel__value--accent,
.ui-preview-panel__value--warning {
  color: var(--ui-accent);
}

.ui-preview-panel__value--success {
  color: var(--ui-success);
}

.ui-preview-panel__value--critical {
  color: var(--ui-critical);
}

.ui-preview-panel__code {
  margin: 0;
  padding: 1rem 1.125rem;
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, var(--ui-border) 72%, transparent);
  border-radius: var(--ui-radius-md);
  background: color-mix(in srgb, var(--ui-bg) 55%, var(--ui-surface));
  color: var(--ui-fg);
  font-size: 0.92rem;
  line-height: 1.8;
}

.ui-preview-panel--subtle .ui-preview-panel__code {
  background: color-mix(in srgb, var(--ui-surface) 88%, var(--ui-bg));
}

.ui-preview-panel__slot {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ui-preview-panel__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.ui-preview-panel__footer-text {
  margin: 0;
  color: var(--ui-fg-muted);
  font-size: 0.95rem;
}
</style>

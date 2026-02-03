<script setup lang="ts">
import { computed } from "vue";

type BadgeTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "critical";

type BadgeVariant = "soft" | "solid" | "outline";
type BadgeSize = "xs" | "sm" | "md";

const props = withDefaults(
  defineProps<{
    tone?: BadgeTone;
    variant?: BadgeVariant;
    size?: BadgeSize;
  }>(),
  {
    tone: "neutral",
    variant: "soft",
    size: "sm",
  }
);

const toneStyles = computed(() => {
  const tones: Record<BadgeTone, { color: string; on: string }> = {
    neutral: { color: "var(--ui-fg)", on: "var(--ui-bg)" },
    primary: { color: "var(--ui-primary)", on: "var(--ui-on-primary)" },
    secondary: { color: "var(--ui-secondary)", on: "var(--ui-on-secondary)" },
    accent: { color: "var(--ui-accent)", on: "var(--ui-on-accent)" },
    success: { color: "var(--ui-success)", on: "var(--ui-on-success)" },
    warning: { color: "var(--ui-warning)", on: "var(--ui-on-warning)" },
    critical: { color: "var(--ui-critical)", on: "var(--ui-on-critical)" },
  };

  return {
    "--badge-color": tones[props.tone].color,
    "--badge-on": tones[props.tone].on,
  } as Record<string, string>;
});
</script>

<template>
  <span
    class="s-badge"
    :data-variant="variant"
    :data-size="size"
    :style="toneStyles"
  >
    <slot />
  </span>
</template>

<style scoped>
.s-badge {
  --badge-color: var(--ui-fg);
  --badge-on: var(--ui-bg);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.s-badge[data-size="xs"] {
  font-size: 11px;
  padding: 2px 6px;
}

.s-badge[data-size="sm"] {
  font-size: 12px;
  padding: 2px 8px;
}

.s-badge[data-size="md"] {
  font-size: 13px;
  padding: 4px 10px;
}

.s-badge[data-variant="soft"] {
  background: color-mix(in srgb, var(--badge-color) 14%, transparent);
  color: var(--badge-color);
  border-color: color-mix(in srgb, var(--badge-color) 18%, transparent);
}

.s-badge[data-variant="solid"] {
  background: var(--badge-color);
  color: var(--badge-on);
}

.s-badge[data-variant="outline"] {
  background: transparent;
  color: var(--badge-color);
  border-color: color-mix(in srgb, var(--badge-color) 40%, transparent);
}
</style>

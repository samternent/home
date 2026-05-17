<script setup lang="ts">
import { computed } from "vue";
import Card from "../../primitives/Card/Card.vue";
import Separator from "../../primitives/Separator/Separator.vue";
import type { KeyValueListItem, KeyValueListValue } from "./KeyValueList.types";

const props = withDefaults(
  defineProps<{
    items: KeyValueListItem[];
    padding?: "sm" | "md" | "lg";
    variant?: "default" | "subtle" | "outline" | "elevated" | "panel" | "showcase";
  }>(),
  {
    padding: "md",
    variant: "outline",
  },
);

const normalizedItems = computed(() => props.items ?? []);

function formatValue(value: KeyValueListValue): string {
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}
</script>

<template>
  <Card :variant="props.variant" :padding="props.padding">
    <dl class="m-0 flex flex-col gap-2" data-test="key-value-list">
      <template v-for="(item, index) in normalizedItems" :key="item.id ?? item.label">
        <div class="flex items-center justify-between gap-4">
          <dt class="text-sm text-[var(--ui-fg-muted)]">
            {{ item.label }}
          </dt>
          <dd class="m-0 text-sm text-[var(--ui-fg)]" :data-test="item.dataTest">
            <slot name="value" :item="item">
              {{ formatValue(item.value) }}
            </slot>
          </dd>
        </div>
        <Separator v-if="index < normalizedItems.length - 1" orientation="horizontal" />
      </template>
    </dl>
  </Card>
</template>

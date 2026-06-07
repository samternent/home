<script setup lang="ts">
import { computed } from "vue";
import Button from "../../primitives/Button/Button.vue";
import Card from "../../primitives/Card/Card.vue";
import Separator from "../../primitives/Separator/Separator.vue";
import type { RecordListItem } from "./RecordList.types";
import { resolveRecordListSecondaryText } from "./RecordList.utils";

const emit = defineEmits<{
  action: [item: RecordListItem, event: MouseEvent];
  select: [item: RecordListItem, event: MouseEvent];
}>();

const props = withDefaults(
  defineProps<{
    defaultActionLabel?: string;
    emptyLabel?: string;
    items: RecordListItem[];
    surface?: "card" | "plain";
    title?: string;
  }>(),
  {
    defaultActionLabel: undefined,
    emptyLabel: "No records yet.",
    surface: "card",
    title: undefined,
  },
);

const normalizedItems = computed(() => props.items);

function handleSelect(item: RecordListItem, event: MouseEvent): void {
  if (item.disabled) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  emit("select", item, event);
}

function handleAction(item: RecordListItem, event: MouseEvent): void {
  if (item.disabled) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  emit("action", item, event);
}

const wrapperClass = computed(() =>
  props.surface === "card"
    ? "flex h-full min-h-0 flex-col gap-2"
    : "flex h-full min-h-0 flex-col gap-2 px-1",
);
</script>

<template>
  <component
    :is="props.surface === 'card' ? Card : 'div'"
    :variant="props.surface === 'card' ? 'outline' : undefined"
    :padding="props.surface === 'card' ? 'sm' : undefined"
    :class="wrapperClass"
  >
    <p
      v-if="props.title"
      class="m-0 px-1 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]"
    >
      {{ props.title }}
    </p>

    <div
      v-if="normalizedItems.length === 0"
      class="px-2 py-3 text-sm text-[var(--ui-fg-muted)]"
      data-test="record-list-empty"
    >
      {{ props.emptyLabel }}
    </div>

    <ul
      v-else
      class="m-0 flex min-h-0 list-none flex-col gap-1 overflow-auto p-0"
      data-test="record-list-items"
    >
      <li v-for="(item, index) in normalizedItems" :key="item.id" :data-test="item.dataTest">
        <div class="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            :variant="item.active ? 'secondary' : 'plain-secondary'"
            class="min-w-0 flex-1 justify-start"
            :disabled="Boolean(item.disabled)"
            :aria-current="item.active ? 'true' : undefined"
            @click="handleSelect(item, $event)"
          >
            <span class="flex min-w-0 items-center gap-2 text-left">
              <slot name="item-leading" :item="item" />
              <span class="min-w-0">
                <span class="block truncate text-sm">{{ item.title }}</span>
                <span
                  v-if="resolveRecordListSecondaryText(item)"
                  class="block truncate text-xs text-[var(--ui-fg-muted)]"
                >
                  {{ resolveRecordListSecondaryText(item) }}
                </span>
              </span>
            </span>
          </Button>

          <slot name="item-action" :item="item">
            <Button
              v-if="props.defaultActionLabel"
              type="button"
              variant="plain-secondary"
              size="xs"
              :disabled="Boolean(item.disabled)"
              aria-label="Row action"
              @click="handleAction(item, $event)"
            >
              {{ props.defaultActionLabel }}
            </Button>
          </slot>
        </div>

        <Separator
          v-if="index < normalizedItems.length - 1"
          orientation="horizontal"
          class="my-2"
        />
      </li>
    </ul>
  </component>
</template>

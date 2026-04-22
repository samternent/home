<script setup lang="ts">
import { computed, useSlots } from "vue";
import Button from "../../primitives/Button/Button.vue";
import Separator from "../../primitives/Separator/Separator.vue";
import type { SidebarNavItem, SidebarNavSection } from "./SidebarNav.types";

const emit = defineEmits<{
  select: [item: SidebarNavItem, event: MouseEvent];
}>();

const props = withDefaults(
  defineProps<{
    sections: SidebarNavSection[];
    title?: string;
  }>(),
  {
    title: undefined,
  },
);

const slots = useSlots();

const normalizedSections = computed(() =>
  props.sections.filter((section) => section.items.length > 0),
);

const hasHeader = computed(() => Boolean(props.title || slots.header));

function handleSelect(item: SidebarNavItem, event: MouseEvent): void {
  if (item.disabled) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  emit("select", item, event);
}
</script>

<template>
  <aside class="flex h-full min-h-0 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-bg)]">
    <div
      v-if="hasHeader"
      class="flex items-center justify-between gap-2 border-b border-[var(--ui-border)] px-3 py-2"
    >
      <slot name="header">
        <p class="m-0 text-sm font-medium tracking-[0.08em] text-[var(--ui-fg)]">
          {{ props.title }}
        </p>
      </slot>
    </div>

    <nav class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3" aria-label="Sidebar navigation">
      <template
        v-for="(section, sectionIndex) in normalizedSections"
        :key="section.id ?? `sidebar-section-${sectionIndex}`"
      >
        <div class="flex flex-col gap-1">
          <p
            v-if="section.label"
            class="m-0 px-1 text-xs uppercase tracking-[0.12em] text-[var(--ui-fg-muted)]"
          >
            {{ section.label }}
          </p>

          <Button
            v-for="item in section.items"
            :key="item.id ?? item.to ?? item.href ?? item.label"
            :as="item.to ? 'RouterLink' : item.href ? 'a' : 'button'"
            :to="item.to"
            :href="item.href"
            :target="item.href ? '_blank' : undefined"
            :rel="item.href ? 'noreferrer noopener' : undefined"
            :disabled="Boolean(item.disabled)"
            :variant="item.active ? 'secondary' : 'plain-secondary'"
            size="sm"
            class="w-full justify-start"
            :data-test="item.dataTest"
            @click="handleSelect(item, $event)"
          >
            {{ item.label }}
          </Button>
        </div>

        <Separator
          v-if="sectionIndex < normalizedSections.length - 1"
          orientation="horizontal"
        />
      </template>
    </nav>

    <footer
      v-if="$slots.footer"
      class="border-t border-[var(--ui-border)] p-3"
    >
      <slot name="footer" />
    </footer>
  </aside>
</template>

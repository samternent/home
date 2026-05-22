<script setup lang="ts">
import { computed, useSlots } from "vue";
import Button from "../../primitives/Button/Button.vue";
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
  <aside class="flex h-full min-h-0 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-surface)]">
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

    <nav class="flex min-h-0 flex-1 flex-col gap-7 overflow-auto px-3 py-5" aria-label="Sidebar navigation">
      <template
        v-for="(section, sectionIndex) in normalizedSections"
        :key="section.id ?? `sidebar-section-${sectionIndex}`"
      >
        <div class="flex flex-col gap-1">
          <p
            v-if="section.label"
            class="m-0 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ui-fg-muted)]/80"
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
            :class="[
              'w-full justify-between rounded-xl px-3 py-2.5 !text-sm',
              item.active ? '!border-transparent !bg-[var(--ui-tonal-secondary)] !font-semibold !shadow-none hover:!bg-[var(--ui-tonal-secondary-hover)]' : '!font-medium',
            ]"
            :data-test="item.dataTest"
            @click="handleSelect(item, $event)"
          >
            <span class="inline-flex min-w-0 items-center gap-2">
              <span
                v-if="item.active && item.showActiveDot"
                class="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ui-primary)]"
              ></span>
              <span class="truncate">{{ item.label }}</span>
            </span>
            <span
              v-if="item.count !== undefined"
              class="ml-2 inline-flex min-w-5 shrink-0 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--ui-fg-muted)]"
            >
              {{ item.count }}
            </span>
          </Button>
        </div>
      </template>
    </nav>

    <footer v-if="$slots.footer" class="border-t border-[var(--ui-border)] p-3">
      <slot name="footer" />
    </footer>
  </aside>
</template>

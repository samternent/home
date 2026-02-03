<script setup lang="ts">
import { computed, useSlots } from "vue";
import { Dialog } from "@ark-ui/vue/dialog";

const open = defineModel("open", {
  type: Boolean,
  default: false,
});

const props = defineProps({
  title: {
    type: String,
    default: undefined,
  },
  size: {
    type: String,
    default: "md",
    validator: (value: string) => ["sm", "md", "lg", "xl"].includes(value),
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  bodyClass: {
    type: String,
    default: "p-4",
  },
  contentClass: {
    type: String,
    default: "",
  },
});

const slots = useSlots();

const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-xl",
    xl: "max-w-2xl",
  };
  return sizes[props.size];
});

const hasHeader = computed(
  () => !!props.title || !!slots.header || !!slots.icon || props.showClose
);
</script>

<template>
  <Dialog.Root
    v-model:open="open"
    :close-on-interact-outside="closeOnBackdrop"
    :close-on-escape="closeOnEscape"
    lazy-mount
    unmount-on-exit
  >
    <Dialog.Backdrop class="fixed inset-0 z-40 bg-black/40" />
    <Dialog.Positioner
      class="fixed inset-0 z-50 grid place-items-center p-4"
    >
      <Dialog.Content
        class="w-full overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-md)]"
        :class="[sizeClasses, contentClass]"
      >
        <Dialog.Title v-if="title && slots.header" class="sr-only">
          {{ title }}
        </Dialog.Title>

        <div
          v-if="hasHeader"
          class="flex items-center justify-between gap-3 border-b border-[var(--ui-border)] px-4 py-3"
        >
          <slot name="header">
            <div class="flex items-center gap-2">
              <span
                v-if="$slots.icon"
                class="flex size-8 items-center justify-center rounded-full border border-[var(--ui-border)]"
              >
                <slot name="icon" />
              </span>
              <Dialog.Title v-if="title" class="text-sm font-semibold">
                {{ title }}
              </Dialog.Title>
            </div>
            <Dialog.CloseTrigger
              v-if="showClose"
              class="inline-flex items-center justify-center rounded-full border border-[var(--ui-border)] p-2 text-xs transition hover:border-[var(--ui-secondary)]/70"
              aria-label="Close dialog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </Dialog.CloseTrigger>
          </slot>
        </div>

        <div :class="bodyClass">
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="border-t border-[var(--ui-border)] px-4 py-3"
        >
          <slot name="footer" />
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Root>
</template>

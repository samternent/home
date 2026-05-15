<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Button from "../../primitives/Button/Button.vue";
import Separator from "../../primitives/Separator/Separator.vue";
import type { PanelChromeContainer } from "./PanelChrome.types";

const props = withDefaults(
  defineProps<{
    collapsedHeight?: number;
    container?: PanelChromeContainer;
    maxHeight?: number;
    minHeight?: number;
    resizable?: boolean;
    title?: string;
  }>(),
  {
    collapsedHeight: 32,
    container: null,
    maxHeight: undefined,
    minHeight: 200,
    resizable: true,
    title: undefined,
  },
);

const open = defineModel<boolean>("open", { default: false });
const height = defineModel<number>("height", { default: 320 });
const dragging = defineModel<boolean>("dragging", { default: false });

const draggingPointerId = ref<number | null>(null);

const clampedHeight = computed(() =>
  clamp(height.value, props.minHeight, resolveMaxHeight()),
);

watch(clampedHeight, (nextHeight) => {
  if (nextHeight !== height.value) {
    height.value = nextHeight;
  }
});

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveContainerBottom(): number {
  if (props.container) {
    return props.container.getBoundingClientRect().bottom;
  }

  if (typeof window !== "undefined") {
    return window.innerHeight;
  }

  return clampedHeight.value;
}

function resolveMaxHeight(): number {
  if (typeof props.maxHeight === "number") {
    return Math.max(props.maxHeight, props.minHeight);
  }

  const containerBottom = resolveContainerBottom();
  return Math.max(props.minHeight, containerBottom - props.collapsedHeight);
}

function computeHeightFromPointer(clientY: number): number {
  const nextHeight = resolveContainerBottom() - clientY;
  return clamp(nextHeight, props.minHeight, resolveMaxHeight());
}

function stopDragging(): void {
  if (!dragging.value) {
    return;
  }

  dragging.value = false;
  draggingPointerId.value = null;

  if (typeof window !== "undefined") {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
  }
}

function handlePointerMove(event: PointerEvent): void {
  if (!dragging.value) {
    return;
  }

  height.value = computeHeightFromPointer(event.clientY);
}

function handlePointerUp(): void {
  stopDragging();
}

function startResize(event: PointerEvent): void {
  if (!open.value || !props.resizable) {
    return;
  }

  event.preventDefault();
  dragging.value = true;
  draggingPointerId.value = event.pointerId;

  if (typeof window !== "undefined") {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }
}

function toggleOpen(): void {
  open.value = !open.value;
}

onBeforeUnmount(() => {
  stopDragging();
});
</script>

<template>
  <section
    class="relative z-40 flex min-h-0 flex-col"
    :class="{
      'h-9': !open,
      'transition-[height] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)]':
        !dragging,
    }"
    :style="open ? { height: `${clampedHeight}px` } : undefined"
  >
    <div
      v-if="open && props.resizable"
      role="separator"
      aria-orientation="horizontal"
      class="cursor-row-resize px-2 py-1 bg-[var(--ui-border)]"
      @pointerdown="startResize"
    >
      <Separator orientation="horizontal" />
    </div>

    <div
      class="relative z-10 flex items-center justify-between border-y border-[var(--ui-border)] bg-[var(--ui-bg)] px-2 py-1"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <slot name="header">
          <p v-if="props.title" class="m-0 text-xs text-[var(--ui-fg-muted)]">
            {{ props.title }}
          </p>
        </slot>
      </div>

      <div class="flex items-center gap-2">
        <slot name="actions" />
        <Button
          aria-label="Toggle panel"
          :aria-pressed="open"
          variant="plain-secondary"
          size="micro"
          @click="toggleOpen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 transition-transform duration-[var(--ui-duration-normal)]"
            :class="open ? 'rotate-0' : 'rotate-180'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </Button>
      </div>
    </div>

    <div
      v-show="open"
      class="flex min-h-0 flex-1 overflow-auto bg-[var(--ui-surface)]"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { onClickOutside } from "@vueuse/core";

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  menuWidth: {
    type: String,
    default: "w-48",
  },
  menuAlign: {
    type: String,
    default: "right", // right, left
  },
  menuOffset: {
    type: String,
    default: "mt-2",
  },
  menuClass: {
    type: String,
    default: "",
  },
  containerClass: {
    type: String,
    default: "",
  },
  toggleClass: {
    type: String,
    default: "",
  },
});

const wrapperRef = shallowRef<HTMLElement | null>(null);
const menuRef = shallowRef<HTMLElement | null>(null);
const isOpen = shallowRef(false);

const horizontalClass = shallowRef(props.menuAlign === "left" ? "left-0" : "right-0");
const verticalClass = shallowRef("top-full");
const offsetClass = shallowRef(props.menuOffset || "mt-2");

const placementClasses = computed(() => [horizontalClass.value, verticalClass.value, offsetClass.value]);

function updateMenuPlacement(): void {
  if (typeof window === "undefined" || !wrapperRef.value || !menuRef.value) {
    return;
  }

  const viewportPadding = 8;
  const gap = 8;
  const wrapperRect = wrapperRef.value.getBoundingClientRect();
  const menuRect = menuRef.value.getBoundingClientRect();

  const hasRoomBelow = wrapperRect.bottom + gap + menuRect.height <= window.innerHeight - viewportPadding;
  const hasRoomAbove = wrapperRect.top - gap - menuRect.height >= viewportPadding;
  const shouldOpenUp = !hasRoomBelow && hasRoomAbove;

  verticalClass.value = shouldOpenUp ? "bottom-full" : "top-full";
  offsetClass.value = shouldOpenUp ? "mb-2" : props.menuOffset || "mt-2";

  const leftOverflowIfRightAligned = wrapperRect.right - menuRect.width < viewportPadding;
  const rightOverflowIfLeftAligned = wrapperRect.left + menuRect.width > window.innerWidth - viewportPadding;

  if (props.menuAlign === "left") {
    horizontalClass.value = rightOverflowIfLeftAligned && !leftOverflowIfRightAligned ? "right-0" : "left-0";
    return;
  }

  horizontalClass.value = leftOverflowIfRightAligned && !rightOverflowIfLeftAligned ? "left-0" : "right-0";
}

function toggleMenu() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function closeMenu() {
  isOpen.value = false;
}

onClickOutside(wrapperRef, () => {
  isOpen.value = false;
});

watch(isOpen, async (open) => {
  if (!open) {
    return;
  }
  await nextTick();
  updateMenuPlacement();
});

function handleWindowChange(): void {
  if (!isOpen.value) {
    return;
  }
  updateMenuPlacement();
}

onMounted(() => {
  if (typeof window === "undefined") {
    return;
  }
  window.addEventListener("resize", handleWindowChange);
  window.addEventListener("scroll", handleWindowChange, true);
});

onBeforeUnmount(() => {
  if (typeof window === "undefined") {
    return;
  }
  window.removeEventListener("resize", handleWindowChange);
  window.removeEventListener("scroll", handleWindowChange, true);
});
</script>

<template>
  <div ref="wrapperRef" class="relative w-full" :class="containerClass">
    <div
      class="flex w-full items-center overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-sm)]"
    >
      <slot name="primary" :closeMenu="closeMenu" :isOpen="isOpen" />
      <button
        type="button"
        class="border-l border-[var(--ui-border)] px-3 py-2.5 text-[var(--ui-fg-muted)] transition-colors hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-fg)]"
        :class="toggleClass"
        :disabled="disabled"
        :aria-expanded="isOpen"
        aria-haspopup="menu"
        @click="toggleMenu"
      >
        <slot name="toggle" :isOpen="isOpen">
          <svg
            class="h-4 w-4 transition-transform"
            :class="{ 'rotate-180': isOpen }"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.25 8.29a.75.75 0 0 1-.02-1.08Z"
              clip-rule="evenodd"
            />
          </svg>
        </slot>
      </button>
    </div>
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        ref="menuRef"
        :class="[
          'absolute z-50 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-1 shadow-[var(--ui-shadow-md)]',
          placementClasses,
          menuWidth,
          menuClass,
        ]"
      >
        <slot name="menu" :closeMenu="closeMenu" :isOpen="isOpen" />
      </div>
    </Transition>
  </div>
</template>

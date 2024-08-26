<script setup>
import { shallowRef, computed, watch } from "vue";
import { useDraggable, useElementBounding } from "@vueuse/core";

const props = defineProps({
  /**
   * The container element within which the resizer can move. This should be a reference to a DOM element.
   * @type {PropType<HTMLElement>}
   */
  container: {
    type: HTMLElement,
    default: () => document.body,
  },
  /**
   * The size of the drag handler.
   * @type {PropType<'default'>}
   */
  size: {
    type: String,
    default: "default",
    validator: (value) => ["default"].includes(value),
  },
  /**
   * The direction of the resizer.
   * @type {PropType<'vertical'>}
   */
  direction: {
    type: String,
    default: "vertical",
    validator: (value) => ["vertical"].includes(value),
  },
});

const emit = defineEmits(["dragStart", "dragEnd"]);

/**
 * The relative position of the resizer to its container.
 * @type {ModelRef<Number>}
 */
const position = defineModel("position", { type: Number, default: 0 });
/**
 * A Boolean indicating whether the resizer is currently being dragged.
 * @type {ModelRef<Boolean>}
 */
const dragging = defineModel("dragging", { type: Boolean, default: false });

const resizeHandle = shallowRef(null);
const resizeHandleBtn = shallowRef(null);

const { width: handleWidth } = useElementBounding(resizeHandle);
const { width: handleBtnWidth } = useElementBounding(resizeHandleBtn);
const { left: containerLeft, right: containerRight } = useElementBounding(
  computed(() => props.container)
);

const padding = computed(() => (handleWidth.value - handleBtnWidth.value) / 2);

const { isDragging } = useDraggable(resizeHandle, {
  onStart: () => emit("dragStart"),
  onEnd: () => emit("dragEnd"),
  onMove({ x: pos }) {
    if (!props.container) {
      return;
    }

    // When dragging, offset the handle padding and container and update with drag position.
    // When dragging reaches right bounds, offset the handle padding and container and fix to the right side.
    // When dragging reaches left bounds, offset the handle padding and container and fix to the left side.
    if (pos > containerRight.value - (padding.value + handleBtnWidth.value)) {
      position.value =
        containerRight.value - containerLeft.value - handleBtnWidth.value;
    } else if (pos < containerLeft.value - padding.value) {
      position.value = handleBtnWidth.value * -1;
    } else {
      position.value = pos - containerLeft.value + padding.value;
    }
  },
});

watch(isDragging, (value) => {
  dragging.value = value;
});
</script>
<template>
  <div
    ref="resizeHandle"
    class="absolute -left-4 top-0 z-50 h-full cursor-ew-resize px-4 group"
    :class="{ 'opacity-100': isDragging }"
  >
    <button
      ref="resizeHandleBtn"
      type="button"
      aria-label="Drag to resize"
      :class="{
        'bg-secondary opacity-100': isDragging,
        'w-1': size === 'default',
      }"
      class="h-full cursor-ew-resize opacity-0 transition-all group-hover:bg-secondary group-hover:opacity-40 duration-300"
    />
  </div>
</template>

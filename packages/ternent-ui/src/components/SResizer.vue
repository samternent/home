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
    validator: (value) => ["vertical", "horizontal"].includes(value),
  },

  type: {
    type: String,
    default: "primary",
    validator: (value) => ["primary", "secondary", "accent"].includes(value),
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

const { width: handleWidth, height: handleHeight } =
  useElementBounding(resizeHandle);
const { width: handleBtnWidth, height: handleBtnHeight } =
  useElementBounding(resizeHandleBtn);
const {
  left: containerLeft,
  right: containerRight,
  top: containerTop,
  height: containerHeight,
} = useElementBounding(computed(() => props.container));

const paddingX = computed(() => (handleWidth.value - handleBtnWidth.value) / 2);
const paddingY = computed(
  () => (handleHeight.value - handleBtnHeight.value) / 2
);

const { isDragging } = useDraggable(resizeHandle, {
  onStart: () => emit("dragStart"),
  onEnd: () => emit("dragEnd"),
  onMove({ x: posX, y: posY }) {
    if (!props.container) {
      return;
    }

    if (props.direction === "vertical") {
      // When dragging, offset the handle padding and container and update with drag position.
      // When dragging reaches right bounds, offset the handle padding and container and fix to the right side.
      // When dragging reaches left bounds, offset the handle padding and container and fix to the left side.
      if (
        posX >
        containerRight.value - (paddingX.value + handleBtnWidth.value)
      ) {
        position.value =
          containerRight.value - containerLeft.value - handleBtnWidth.value;
      } else if (posX < containerLeft.value - paddingX.value) {
        position.value = handleBtnWidth.value * -1;
      } else {
        position.value = posX - containerLeft.value + paddingX.value;
      }
    }

    if (props.direction === "horizontal") {
      const height = containerHeight.value - (posY - containerTop.value);

      if (height < 0) {
        position.value = 0;
        return;
      }
      if (height > containerHeight.value) {
        position.value = containerHeight.value - paddingY.value / 2;
        return;
      }

      position.value =
        containerHeight.value - (posY - containerTop.value + paddingY.value);
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
    class="absolute z-[9999999] group h-8 translate-y-1/2"
    :class="{
      'opacity-100': isDragging,
      '-left-4 top-0 cursor-ew-resize px-4 h-full': direction === 'vertical',
      'left-0 -top-8 cursor-ns-resize w-full': direction === 'horizontal',
    }"
  >
    <button
      ref="resizeHandleBtn"
      type="button"
      aria-label="Drag to resize"
      :class="{
        'opacity-100': isDragging,
        '!w-1': isDragging && direction === 'vertical',
        '!h-1': isDragging && direction === 'horizontal',
        'w-0.5': size === 'default' && direction === 'vertical',
        'h-0.5': size === 'default' && direction === 'horizontal',
        'group-hover:w-1 cursor-ew-resize h-full': direction === 'vertical',
        'group-hover:h-1 cursor-ns-resize w-full': direction === 'horizontal',
        'group-hover:bg-blue-400': type === 'primary',
        'bg-blue-200': type === 'primary' && isDragging,
        'bg-green-200': type === 'secondary' && isDragging,
        'bg-indigo-200': type === 'accent' && isDragging,
      }"
      class="z-50 opacity-100 transition-all group-hover:opacity-50 duration-300"
    />
  </div>
</template>

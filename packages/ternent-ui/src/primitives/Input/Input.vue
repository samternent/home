<script setup lang="ts">
import { computed, normalizeClass, useAttrs, useSlots } from "vue";
import { twMerge } from "tailwind-merge";
import { inputProps } from "./Input.props";
import {
  inputAdornmentBaseClass,
  inputAdornmentPositionClasses,
  inputBaseClass,
  inputPaddingWithLeading,
  inputPaddingWithTrailing,
  inputSizeClasses,
  inputStateClasses,
  inputWrapperClass,
} from "./Input.variants";

defineOptions({ inheritAttrs: false });

const emit = defineEmits<{
  "update:modelValue": [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const attrs = useAttrs();
const props = defineProps(inputProps);
const slots = useSlots();

const hasLeading = computed(() => Boolean(slots.leading));
const hasTrailing = computed(() => Boolean(slots.trailing));

const classes = computed(() =>
  twMerge(
    inputBaseClass,
    inputSizeClasses[props.size],
    props.invalid ? inputStateClasses.invalid : inputStateClasses.default,
    hasLeading.value ? inputPaddingWithLeading[props.size] : "",
    hasTrailing.value ? inputPaddingWithTrailing[props.size] : "",
    normalizeClass(attrs.class),
  ),
);

const inputAttrs = computed(() => {
  const {
    class: _class,
    value: _value,
    modelValue: _modelValue,
    type: _type,
    disabled: _disabled,
    readonly: _readonly,
    ...rest
  } = attrs;

  return rest;
});

function handleInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}

function handleFocus(event: FocusEvent) {
  emit("focus", event);
}

function handleBlur(event: FocusEvent) {
  emit("blur", event);
}
</script>

<template>
  <div :class="inputWrapperClass">
    <span
      v-if="$slots.leading"
      :class="[inputAdornmentBaseClass, inputAdornmentPositionClasses.leading[props.size]]"
      aria-hidden="true"
    >
      <slot name="leading" />
    </span>
    <input
      :value="props.modelValue"
      :type="props.type"
      :class="classes"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :aria-invalid="props.invalid ? 'true' : undefined"
      :data-invalid="props.invalid ? 'true' : 'false'"
      v-bind="inputAttrs"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <span
      v-if="$slots.trailing"
      :class="[inputAdornmentBaseClass, inputAdornmentPositionClasses.trailing[props.size]]"
      aria-hidden="true"
    >
      <slot name="trailing" />
    </span>
  </div>
</template>

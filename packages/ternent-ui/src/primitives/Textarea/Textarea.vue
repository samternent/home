<script setup lang="ts">
import { computed, normalizeClass, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";
import { textareaProps } from "./Textarea.props";
import {
  textareaBaseClass,
  textareaResizeClasses,
  textareaSizeClasses,
  textareaStateClasses,
} from "./Textarea.variants";

defineOptions({ inheritAttrs: false });

const emit = defineEmits<{
  "update:modelValue": [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const attrs = useAttrs();
const props = defineProps(textareaProps);

const classes = computed(() =>
  twMerge(
    textareaBaseClass,
    textareaSizeClasses[props.size],
    textareaResizeClasses[props.resize],
    props.invalid ? textareaStateClasses.invalid : textareaStateClasses.default,
    normalizeClass(attrs.class),
  ),
);

const textareaAttrs = computed(() => {
  const {
    class: _class,
    value: _value,
    modelValue: _modelValue,
    disabled: _disabled,
    readonly: _readonly,
    rows: _rows,
    ...rest
  } = attrs;

  return rest;
});

function handleInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
}

function handleFocus(event: FocusEvent) {
  emit("focus", event);
}

function handleBlur(event: FocusEvent) {
  emit("blur", event);
}
</script>

<template>
  <textarea
    :value="props.modelValue"
    :rows="props.rows"
    :class="classes"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :aria-invalid="props.invalid ? 'true' : undefined"
    :data-invalid="props.invalid ? 'true' : 'false'"
    v-bind="textareaAttrs"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

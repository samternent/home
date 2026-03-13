<script setup lang="ts">
import { computed, normalizeClass, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";
import { buttonProps } from "./Button.props";
import {
  buttonAdornmentClass,
  buttonBaseClass,
  buttonLabelClass,
  buttonSizeClasses,
  buttonSpinnerClass,
  buttonStateClasses,
  buttonVariantClasses,
} from "./Button.variants";

defineOptions({ inheritAttrs: false });

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const attrs = useAttrs();
const props = defineProps(buttonProps);

const isButtonElement = computed(() => props.as === "button");
const isInactive = computed(() => props.disabled || props.loading);

const stateClass = computed(() => {
  if (props.loading) {
    return buttonStateClasses.loading;
  }

  if (props.disabled) {
    return buttonStateClasses.disabled;
  }

  return buttonStateClasses.interactive;
});

const classes = computed(() =>
  twMerge(
    buttonBaseClass,
    stateClass.value,
    buttonVariantClasses[props.variant],
    buttonSizeClasses[props.size],
    normalizeClass(attrs.class),
  ),
);

const forwardedAttrs = computed(() => {
  const {
    class: _class,
    disabled: _disabled,
    type: _type,
    ...rest
  } = attrs;

  return rest;
});

const componentAttrs = computed(() => ({
  ...forwardedAttrs.value,
  type: isButtonElement.value ? props.type : undefined,
  disabled: isButtonElement.value ? isInactive.value : undefined,
  "aria-busy": props.loading ? "true" : undefined,
  "aria-disabled":
    !isButtonElement.value && isInactive.value ? "true" : undefined,
  tabindex:
    !isButtonElement.value && isInactive.value
      ? -1
      : attrs.tabindex,
  "data-loading": props.loading ? "true" : "false",
  "data-disabled": isInactive.value ? "true" : "false",
}));

function handleClick(event: MouseEvent) {
  if (isInactive.value) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  emit("click", event);
}
</script>

<template>
  <component
    :is="props.as"
    :class="classes"
    v-bind="componentAttrs"
    @click="handleClick"
  >
    <span v-if="props.loading" :class="buttonSpinnerClass" aria-hidden="true" />
    <span v-else-if="$slots.leading" :class="buttonAdornmentClass">
      <slot name="leading" />
    </span>
    <span :class="buttonLabelClass">
      <slot />
    </span>
    <span v-if="$slots.trailing" :class="buttonAdornmentClass">
      <slot name="trailing" />
    </span>
  </component>
</template>

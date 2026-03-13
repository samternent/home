<script setup lang="ts">
import { Checkbox } from "@ark-ui/vue/checkbox";
import { computed, normalizeClass, useAttrs, useSlots } from "vue";
import { twMerge } from "tailwind-merge";
import { checkboxProps } from "./Checkbox.props";
import {
  checkboxControlBaseClass,
  checkboxControlSizeClasses,
  checkboxControlStateClasses,
  checkboxDescriptionClass,
  checkboxIndicatorSizeClasses,
  checkboxLabelClass,
  checkboxRootClass,
} from "./Checkbox.variants";
import type { CheckboxCheckedValue } from "./Checkbox.types";

defineOptions({ inheritAttrs: false });

const emit = defineEmits<{
  "update:modelValue": [value: CheckboxCheckedValue];
}>();

const attrs = useAttrs();
const slots = useSlots();
const props = defineProps(checkboxProps);

const rootClass = computed(() => twMerge(checkboxRootClass, normalizeClass(attrs.class)));

const controlClass = computed(() =>
  twMerge(
    checkboxControlBaseClass,
    checkboxControlSizeClasses[props.size],
    props.invalid ? checkboxControlStateClasses.invalid : checkboxControlStateClasses.default,
    props.disabled ? checkboxControlStateClasses.disabled : "",
  ),
);

const rootAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

function handleCheckedChange(value: CheckboxCheckedValue) {
  emit("update:modelValue", value);
}
</script>

<template>
  <Checkbox.Root
    :checked="props.modelValue"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :class="rootClass"
    v-bind="rootAttrs"
    @update:checked="handleCheckedChange"
  >
    <Checkbox.HiddenInput />
    <Checkbox.Control :class="controlClass">
      <Checkbox.Context v-slot="checkboxApi">
        <Checkbox.Indicator :class="checkboxIndicatorSizeClasses[props.size]">
          <svg
            v-if="checkboxApi.checked === 'indeterminate'"
            viewBox="0 0 16 16"
            fill="none"
            class="size-full"
            aria-hidden="true"
          >
            <path d="M3.5 8h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <svg
            v-else
            viewBox="0 0 16 16"
            fill="none"
            class="size-full"
            aria-hidden="true"
          >
            <path
              d="M3.5 8.5 6.5 11.5 12.5 4.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Context>
    </Checkbox.Control>

    <div v-if="slots.default || slots.description" class="flex flex-col gap-1">
      <Checkbox.Label v-if="slots.default" :class="checkboxLabelClass">
        <slot />
      </Checkbox.Label>
      <div v-if="slots.description" :class="checkboxDescriptionClass">
        <slot name="description" />
      </div>
    </div>
  </Checkbox.Root>
</template>

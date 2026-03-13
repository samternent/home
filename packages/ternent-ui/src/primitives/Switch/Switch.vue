<script setup lang="ts">
import { Switch } from "@ark-ui/vue/switch";
import { computed, normalizeClass, useAttrs, useSlots } from "vue";
import { twMerge } from "tailwind-merge";
import { switchProps } from "./Switch.props";
import {
  switchControlBaseClass,
  switchControlSizeClasses,
  switchControlStateClasses,
  switchDescriptionClass,
  switchLabelClass,
  switchRootClass,
  switchThumbBaseClass,
  switchThumbSizeClasses,
} from "./Switch.variants";

defineOptions({ inheritAttrs: false });

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const attrs = useAttrs();
const slots = useSlots();
const props = defineProps(switchProps);

const rootClass = computed(() => twMerge(switchRootClass, normalizeClass(attrs.class)));

const controlClass = computed(() =>
  twMerge(
    switchControlBaseClass,
    switchControlSizeClasses[props.size],
    props.invalid ? switchControlStateClasses.invalid : switchControlStateClasses.default,
    props.disabled ? switchControlStateClasses.disabled : "",
  ),
);

const thumbClass = computed(() =>
  twMerge(switchThumbBaseClass, switchThumbSizeClasses[props.size]),
);

const rootAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <Switch.Root
    :checked="props.modelValue"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :class="rootClass"
    v-bind="rootAttrs"
    @update:checked="emit('update:modelValue', $event)"
  >
    <Switch.HiddenInput />
    <Switch.Control :class="controlClass">
      <Switch.Thumb :class="thumbClass" />
    </Switch.Control>

    <div v-if="slots.default || slots.description" class="flex flex-col gap-1">
      <Switch.Label v-if="slots.default" :class="switchLabelClass">
        <slot />
      </Switch.Label>
      <div v-if="slots.description" :class="switchDescriptionClass">
        <slot name="description" />
      </div>
    </div>
  </Switch.Root>
</template>

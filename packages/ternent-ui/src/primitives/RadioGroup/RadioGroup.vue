<script setup lang="ts">
import { RadioGroup } from "@ark-ui/vue/radio-group";
import { computed, normalizeClass, useAttrs } from "vue";
import { twMerge } from "tailwind-merge";
import { radioGroupProps } from "./RadioGroup.props";
import {
  radioGroupControlBaseClass,
  radioGroupControlSizeClasses,
  radioGroupDescriptionClass,
  radioGroupIndicatorBaseClass,
  radioGroupIndicatorSizeClasses,
  radioGroupItemBaseClass,
  radioGroupItemSizeClasses,
  radioGroupItemStateClasses,
  radioGroupLabelClass,
  radioGroupListOrientationClasses,
  radioGroupRootClass,
} from "./RadioGroup.variants";

defineOptions({ inheritAttrs: false });

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const attrs = useAttrs();
const props = defineProps(radioGroupProps);

const model = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value),
});

const rootClass = computed(() => twMerge(radioGroupRootClass, normalizeClass(attrs.class)));

const rootAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

function itemClass(disabled?: boolean) {
  return twMerge(
    radioGroupItemBaseClass,
    radioGroupItemSizeClasses[props.size],
    props.invalid ? radioGroupItemStateClasses.invalid : radioGroupItemStateClasses.default,
    props.disabled || disabled ? radioGroupItemStateClasses.disabled : "",
  );
}
</script>

<template>
  <RadioGroup.Root
    v-model="model"
    :orientation="props.orientation"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :class="rootClass"
    v-bind="rootAttrs"
  >
    <div :class="radioGroupListOrientationClasses[props.orientation]">
      <RadioGroup.Item
        v-for="option in props.options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        :class="itemClass(option.disabled)"
      >
        <RadioGroup.ItemHiddenInput />
        <RadioGroup.ItemControl
          :class="[radioGroupControlBaseClass, radioGroupControlSizeClasses[props.size]]"
        >
          <RadioGroup.Indicator
            :class="[radioGroupIndicatorBaseClass, radioGroupIndicatorSizeClasses[props.size]]"
          />
        </RadioGroup.ItemControl>
        <div class="flex flex-col gap-1">
          <RadioGroup.ItemText :class="radioGroupLabelClass">
            {{ option.label }}
          </RadioGroup.ItemText>
          <div v-if="option.description" :class="radioGroupDescriptionClass">
            {{ option.description }}
          </div>
        </div>
      </RadioGroup.Item>
    </div>
  </RadioGroup.Root>
</template>

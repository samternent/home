<script setup lang="ts">
import { computed, getCurrentInstance, useSlots } from "vue";
import FieldMessage from "../../primitives/FieldMessage/FieldMessage.vue";
import Label from "../../primitives/Label/Label.vue";
import type { FormFieldSlotProps } from "./FormField.types";

const props = withDefaults(
  defineProps<{
    description?: string;
    disabled?: boolean;
    id?: string;
    invalid?: boolean;
    label?: string;
    message?: string;
    required?: boolean;
    size?: "sm" | "md" | "lg";
  }>(),
  {
    description: undefined,
    disabled: false,
    id: undefined,
    invalid: false,
    label: undefined,
    message: undefined,
    required: false,
    size: "md",
  },
);

const slots = useSlots();
const instance = getCurrentInstance();

const fieldId = computed(() => props.id ?? `ui-field-${instance?.uid ?? "x"}`);

const hasDescription = computed(() => Boolean(props.description || slots.description));
const hasMessage = computed(() => Boolean(props.message || slots.message));

const descriptionId = computed(() =>
  hasDescription.value ? `${fieldId.value}-description` : undefined,
);
const messageId = computed(() =>
  hasMessage.value ? `${fieldId.value}-message` : undefined,
);
const describedBy = computed(() =>
  [descriptionId.value, messageId.value].filter(Boolean).join(" ") || undefined,
);

const slotProps = computed<FormFieldSlotProps>(() => ({
  describedBy: describedBy.value,
  disabled: props.disabled,
  id: fieldId.value,
  invalid: props.invalid,
  required: props.required,
}));
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <Label
      v-if="props.label || $slots.label"
      :for="fieldId"
      :size="props.size"
      :required="props.required"
      :disabled="props.disabled"
      :invalid="props.invalid"
    >
      <slot name="label">{{ props.label }}</slot>
    </Label>

    <slot v-bind="slotProps" />

    <FieldMessage
      v-if="props.description || $slots.description"
      :id="descriptionId"
      :size="props.size"
    >
      <slot name="description">{{ props.description }}</slot>
    </FieldMessage>

    <FieldMessage
      v-if="props.message || $slots.message"
      :id="messageId"
      :size="props.size"
      :tone="props.invalid ? 'critical' : 'muted'"
    >
      <slot name="message">{{ props.message }}</slot>
    </FieldMessage>
  </div>
</template>

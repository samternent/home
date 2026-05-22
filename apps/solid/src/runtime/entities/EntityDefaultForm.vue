<script setup lang="ts">
import { computed } from "vue";
import { Button, Checkbox, Input, RadioGroup, Textarea } from "ternent-ui/primitives";
import { FormField } from "ternent-ui/patterns";
import type {
  EntityFieldDefinition,
  EntityFormSchema,
  EntityFormValues,
} from "./entityFormContract";

const props = defineProps<{
  schema: EntityFormSchema;
  values: EntityFormValues;
  fieldErrors: Record<string, string | null>;
  submitting: boolean;
  panelError: string | null;
}>();

const emit = defineEmits<{
  submit: [];
  cancel: [];
  updateField: [fieldId: string, value: unknown];
}>();

const submitLabel = computed(() => props.schema.submitLabel ?? "Stage changes");
const cancelLabel = computed(() => props.schema.cancelLabel ?? "Cancel");

function readStringValue(fieldId: string): string {
  const value = props.values[fieldId];
  return typeof value === "string" ? value : "";
}

function readBooleanValue(fieldId: string): boolean {
  return props.values[fieldId] === true;
}

function updateValue(field: EntityFieldDefinition, value: unknown): void {
  if (field.kind === "checkbox") {
    emit("updateField", field.id, value === true);
    return;
  }

  emit("updateField", field.id, value);
}

function submit(): void {
  emit("submit");
}

function cancel(): void {
  emit("cancel");
}
</script>

<template>
  <form class="flex h-full min-h-0 flex-col" @submit.prevent="submit">
    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <FormField
        v-for="field in props.schema.fields"
        :key="field.id"
        :label="field.label"
        :required="Boolean(field.required)"
        :description="field.description"
        :message="props.fieldErrors[field.id] ?? undefined"
        :invalid="Boolean(props.fieldErrors[field.id])"
      >
        <template #default="slotProps">
          <Input
            v-if="field.kind === 'text'"
            :id="slotProps.id"
            :model-value="readStringValue(field.id)"
            :placeholder="field.placeholder"
            :disabled="props.submitting || Boolean(field.disabled)"
            :invalid="slotProps.invalid"
            :aria-describedby="slotProps.describedBy"
            :data-test="`entity-form-field-${field.id}`"
            @update:model-value="(nextValue) => updateValue(field, nextValue)"
          />

          <Textarea
            v-else-if="field.kind === 'textarea'"
            :id="slotProps.id"
            :model-value="readStringValue(field.id)"
            :placeholder="field.placeholder"
            :disabled="props.submitting || Boolean(field.disabled)"
            :invalid="slotProps.invalid"
            :aria-describedby="slotProps.describedBy"
            :data-test="`entity-form-field-${field.id}`"
            @update:model-value="(nextValue) => updateValue(field, nextValue)"
          />

          <Checkbox
            v-else-if="field.kind === 'checkbox'"
            :model-value="readBooleanValue(field.id)"
            :disabled="props.submitting || Boolean(field.disabled)"
            :invalid="slotProps.invalid"
            :aria-describedby="slotProps.describedBy"
            :data-test="`entity-form-field-${field.id}`"
            @update:model-value="(nextValue) => updateValue(field, nextValue)"
          >
            {{ field.placeholder || field.label }}
          </Checkbox>

          <RadioGroup
            v-else-if="field.kind === 'radio'"
            :model-value="readStringValue(field.id)"
            :options="field.options ?? []"
            :disabled="props.submitting || Boolean(field.disabled)"
            :invalid="slotProps.invalid"
            :aria-describedby="slotProps.describedBy"
            :data-test="`entity-form-field-${field.id}`"
            @update:model-value="(nextValue) => updateValue(field, nextValue)"
          />

          <select
            v-else-if="field.kind === 'select'"
            :id="slotProps.id"
            :value="readStringValue(field.id)"
            class="w-full rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-fg)] shadow-[var(--ui-shadow-sm)] transition-[border-color,box-shadow] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)]"
            :disabled="props.submitting || Boolean(field.disabled)"
            :aria-describedby="slotProps.describedBy"
            :data-test="`entity-form-field-${field.id}`"
            @change="
              (event) =>
                updateValue(field, (event.target as HTMLSelectElement).value)
            "
          >
            <option
              v-for="option in field.options ?? []"
              :key="option.value"
              :value="option.value"
              :disabled="Boolean(option.disabled)"
            >
              {{ option.label }}
            </option>
          </select>
        </template>
      </FormField>

      <p
        v-if="props.panelError"
        class="rounded-[var(--ui-radius-sm)] border border-[var(--ui-critical)]/30 bg-[var(--ui-critical)]/10 px-3 py-2 text-sm text-[var(--ui-critical)]"
        data-test="entity-details-form-error"
      >
        {{ props.panelError }}
      </p>
    </div>

    <div class="mt-4 flex items-center justify-end gap-2 border-t border-[var(--ui-border)] pt-3">
      <Button variant="ghost" type="button" :disabled="props.submitting" @click="cancel">
        {{ cancelLabel }}
      </Button>
      <Button type="submit" :loading="props.submitting">
        {{ submitLabel }}
      </Button>
    </div>
  </form>
</template>

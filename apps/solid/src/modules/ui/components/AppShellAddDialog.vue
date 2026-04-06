<script setup lang="ts">
import { computed } from "vue";
import {
  Button,
  Dialog,
  FieldMessage,
  Input,
  Textarea,
} from "ternent-ui/primitives";
import { useAppShellAddDialogModel } from "@/modules/ui/useAppShellAddDialogModel";
import { useAppShellState } from "@/modules/ui/useAppShellState";

const shellState = useAppShellState();
const addDialog = useAppShellAddDialogModel();

const open = computed({
  get: () =>
    shellState.activePanel.value === "add" &&
    Boolean(addDialog.activeSchema.value),
  set: (value: boolean) => {
    if (!value) {
      addDialog.close();
    }
  },
});

const selectClass =
  "h-10 w-full rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 text-sm text-[var(--ui-fg)]/80 " +
  "transition-[box-shadow,border-color,background-color,color] duration-[var(--ui-duration-normal)] ease-[var(--ui-ease-out)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] focus-visible:border-[var(--ui-primary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

function updateValue(key: string, event: Event) {
  addDialog.setValue(
    key,
    (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)
      .value,
  );
}
</script>

<template>
  <Dialog
    v-if="addDialog.activeSchema.value"
    v-model:open="open"
    size="lg"
    :title="addDialog.activeSchema.value.title"
    :description="addDialog.activeSchema.value.description"
  >
    <form
      id="app-shell-add-dialog-form"
      class="grid gap-4 md:grid-cols-2"
      @submit.prevent="addDialog.submit"
    >
      <div
        v-for="field in addDialog.activeSchema.value.fields"
        :key="field.key"
        :class="field.width === 'half' ? 'md:col-span-1' : 'md:col-span-2'"
      >
        <label
          class="mb-2 block text-[11px] uppercase tracking-[0.08em] text-[var(--ui-fg-muted)]"
        >
          {{ field.label }}
          <span v-if="field.required" class="text-[var(--ui-critical)]">*</span>
        </label>

        <Textarea
          v-if="field.component === 'textarea'"
          :model-value="addDialog.values.value[field.key] ?? ''"
          :rows="field.rows ?? 4"
          :placeholder="field.placeholder"
          :disabled="addDialog.pending.value"
          class="font-mono"
          @update:model-value="addDialog.setValue(field.key, $event)"
        />

        <select
          v-else-if="field.component === 'select'"
          :value="addDialog.values.value[field.key] ?? ''"
          :disabled="addDialog.pending.value"
          :class="selectClass"
          @change="updateValue(field.key, $event)"
        >
          <option
            v-for="option in field.options ?? []"
            :key="`${field.key}:${option.value}`"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <Input
          v-else
          :model-value="addDialog.values.value[field.key] ?? ''"
          :type="field.component === 'date' ? 'date' : 'text'"
          :placeholder="field.placeholder"
          :disabled="addDialog.pending.value"
          class="font-mono"
          @update:model-value="addDialog.setValue(field.key, $event)"
        />

        <p
          v-if="field.description"
          class="mt-2 m-0 text-[11px] text-[var(--ui-fg-muted)]"
        >
          {{ field.description }}
        </p>
      </div>

      <FieldMessage
        v-if="addDialog.error.value"
        tone="critical"
        class="md:col-span-2"
      >
        {{ addDialog.error.value }}
      </FieldMessage>
    </form>

    <template #footer>
      <Button
        type="button"
        variant="plain-secondary"
        :disabled="addDialog.pending.value"
        class="rounded-lg"
        @click="addDialog.close()"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="app-shell-add-dialog-form"
        :loading="addDialog.pending.value"
        class="rounded-lg"
      >
        {{ addDialog.activeSchema.value.submitLabel }}
      </Button>
    </template>
  </Dialog>
</template>

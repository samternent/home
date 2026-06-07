<script setup lang="ts">
import { computed } from "vue";
import { Drawer } from "ternent-ui/primitives";
import EntityDefaultForm from "./EntityDefaultForm.vue";
import { useEntityDetailsPanel } from "./useEntityDetailsPanel";

const panel = useEntityDetailsPanel();
const isOpen = panel.isOpen;
const values = panel.values;
const fieldErrors = panel.fieldErrors;
const submitting = panel.submitting;
const panelError = panel.panelError;

const title = computed(() => panel.activeConfig.value?.title ?? "Entity details");
const description = computed(() => panel.activeConfig.value?.description);
const schema = computed(() => panel.activeConfig.value?.schema);
const mode = computed(() => panel.activeConfig.value?.mode ?? "create");
const customFormComponent = computed(
  () => panel.activeConfig.value?.customFormComponent ?? null,
);
</script>

<template>
  <Drawer
    v-model:open="isOpen"
    side="right"
    size="lg"
    :title="title"
    :description="description"
    data-test="entity-details-drawer"
    @update:open="(nextOpen) => (!nextOpen ? panel.close() : null)"
  >
    <component
      :is="customFormComponent"
      v-if="customFormComponent && schema"
      :mode="mode"
      :schema="schema"
      :values="values"
      :field-errors="fieldErrors"
      :submitting="submitting"
      :panel-error="panelError"
      @submit="panel.submit"
      @cancel="panel.close"
      @update-field="(fieldId: string, value: unknown) => panel.setFieldValue(fieldId, value)"
      @update-values="panel.setValues"
    />

    <EntityDefaultForm
      v-else-if="schema"
      :schema="schema"
      :values="values"
      :field-errors="fieldErrors"
      :submitting="submitting"
      :panel-error="panelError"
      @submit="panel.submit"
      @cancel="panel.close"
      @update-field="(fieldId: string, value: unknown) => panel.setFieldValue(fieldId, value)"
    />
  </Drawer>
</template>

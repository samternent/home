import { computed, ref, shallowRef } from "vue";
import type {
  EntityDetailsPanelConfig,
  EntityFieldDefinition,
  EntityFormValues,
} from "./entityFormContract";

const isOpen = ref(false);
const submitting = ref(false);
const panelError = ref<string | null>(null);
const activeConfig = shallowRef<EntityDetailsPanelConfig | null>(null);
const values = ref<EntityFormValues>({});
const fieldErrors = ref<Record<string, string | null>>({});

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isBlankValue(value: unknown, field: EntityFieldDefinition): boolean {
  if (field.kind === "checkbox") {
    return value !== true;
  }

  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  return false;
}

function buildInitialValues(config: EntityDetailsPanelConfig): EntityFormValues {
  const seeded: EntityFormValues = {};

  for (const field of config.schema.fields) {
    if (field.defaultValue !== undefined) {
      seeded[field.id] = field.defaultValue;
      continue;
    }

    if (field.kind === "checkbox") {
      seeded[field.id] = false;
      continue;
    }

    if (field.kind === "radio") {
      seeded[field.id] = field.options?.[0]?.value ?? "";
      continue;
    }

    seeded[field.id] = "";
  }

  return {
    ...seeded,
    ...(config.initialValues ?? {}),
  };
}

async function validateField(fieldId: string): Promise<boolean> {
  const config = activeConfig.value;
  if (!config) {
    return false;
  }

  const field = config.schema.fields.find((candidate) => candidate.id === fieldId);
  if (!field) {
    return true;
  }

  const value = values.value[field.id];

  if (field.required && isBlankValue(value, field)) {
    fieldErrors.value = {
      ...fieldErrors.value,
      [field.id]: "This field is required.",
    };
    return false;
  }

  if (field.validate) {
    const message = await field.validate({
      value,
      values: values.value,
      mode: config.mode,
    });

    if (message) {
      fieldErrors.value = {
        ...fieldErrors.value,
        [field.id]: message,
      };
      return false;
    }
  }

  fieldErrors.value = {
    ...fieldErrors.value,
    [field.id]: null,
  };

  return true;
}

async function validateAllFields(): Promise<boolean> {
  const config = activeConfig.value;
  if (!config) {
    return false;
  }

  let valid = true;
  for (const field of config.schema.fields) {
    const next = await validateField(field.id);
    if (!next) {
      valid = false;
    }
  }

  return valid;
}

function close(): void {
  isOpen.value = false;
  submitting.value = false;
  panelError.value = null;
  activeConfig.value = null;
  values.value = {};
  fieldErrors.value = {};
}

function open(config: EntityDetailsPanelConfig): void {
  activeConfig.value = config;
  values.value = buildInitialValues(config);
  fieldErrors.value = Object.fromEntries(
    config.schema.fields.map((field) => [field.id, null]),
  );
  panelError.value = null;
  submitting.value = false;
  isOpen.value = true;
}

function setFieldValue(fieldId: string, value: unknown): void {
  values.value = {
    ...values.value,
    [fieldId]: value,
  };
}

function setValues(nextValues: EntityFormValues): void {
  values.value = {
    ...nextValues,
  };
}

async function submit(): Promise<boolean> {
  const config = activeConfig.value;
  if (!config) {
    return false;
  }

  if (submitting.value) {
    return false;
  }

  submitting.value = true;
  panelError.value = null;

  try {
    const valid = await validateAllFields();
    if (!valid) {
      return false;
    }

    // Submit handlers must only stage commands; commit is managed elsewhere.
    await config.onSubmit({ ...values.value });
    close();
    return true;
  } catch (error) {
    panelError.value = toErrorMessage(error);
    return false;
  } finally {
    submitting.value = false;
  }
}

export function useEntityDetailsPanel() {
  return {
    isOpen,
    submitting,
    panelError,
    activeConfig,
    values,
    fieldErrors,
    hasActivePanel: computed(() => Boolean(activeConfig.value)),
    open,
    close,
    setValues,
    setFieldValue,
    validateField,
    submit,
  };
}

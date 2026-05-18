import type { Component } from "vue";

export type EntityFormMode = "create" | "edit";

export type EntityFieldKind = "text" | "textarea" | "checkbox" | "radio" | "select";

export type EntityFieldOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type EntityFormValues = Record<string, unknown>;

export type EntityFieldValidator = (input: {
  value: unknown;
  values: EntityFormValues;
  mode: EntityFormMode;
}) => Promise<string | null> | string | null;

export type EntityFieldDefinition = {
  id: string;
  label: string;
  kind: EntityFieldKind;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
  options?: EntityFieldOption[];
  validate?: EntityFieldValidator;
};

export type EntityFormSchema = {
  fields: EntityFieldDefinition[];
  submitLabel?: string;
  cancelLabel?: string;
};

export type EntityCustomFormProps = {
  mode: EntityFormMode;
  schema: EntityFormSchema;
  values: EntityFormValues;
  fieldErrors: Record<string, string | null>;
  submitting: boolean;
  panelError: string | null;
};

export type EntityDetailsPanelConfig = {
  appId: string;
  entityType: string;
  title: string;
  description?: string;
  mode: EntityFormMode;
  schema: EntityFormSchema;
  initialValues?: EntityFormValues;
  customFormComponent?: Component;
  onSubmit(values: EntityFormValues): Promise<void> | void;
};

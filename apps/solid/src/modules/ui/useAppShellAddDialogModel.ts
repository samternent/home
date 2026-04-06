import { computed, ref, watch, type ComputedRef } from "vue";
import { useAppShellState } from "@/modules/ui/useAppShellState";

export type AppShellAddDialogFieldOption = {
  label: string;
  value: string;
};

export type AppShellAddDialogField = {
  key: string;
  label: string;
  component: "text" | "textarea" | "date" | "select";
  placeholder?: string;
  description?: string;
  required?: boolean;
  rows?: number;
  width?: "full" | "half";
  defaultValue?: string;
  options?: AppShellAddDialogFieldOption[];
};

export type AppShellAddDialogSchema<TPayload = unknown> = {
  id: string;
  title: string;
  description?: string;
  submitLabel: string;
  fields: AppShellAddDialogField[];
  map(values: Record<string, string>): TPayload;
};

export type AppShellAddDialogResult =
  | { ok: true }
  | { ok: false; error: string };

export type AppShellAddDialogRequest<TPayload = unknown> = {
  schema: AppShellAddDialogSchema<TPayload>;
  initialValues?: Record<string, string>;
  submit(payload: TPayload): Promise<AppShellAddDialogResult>;
};

type AppShellAddDialogModel = {
  activeSchema: ComputedRef<AppShellAddDialogSchema | null>;
  values: ComputedRef<Record<string, string>>;
  pending: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  open<TPayload>(request: AppShellAddDialogRequest<TPayload>): void;
  close(): void;
  setValue(key: string, value: string): void;
  submit(): Promise<void>;
};

let singleton: AppShellAddDialogModel | null = null;

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unable to submit this form.");
}

function createAppShellAddDialogModel(): AppShellAddDialogModel {
  const shellState = useAppShellState();
  const requestState = ref<AppShellAddDialogRequest | null>(null);
  const valuesState = ref<Record<string, string>>({});
  const pendingState = ref(false);
  const errorState = ref<string | null>(null);

  function initializeValues(
    schema: AppShellAddDialogSchema,
    initialValues?: Record<string, string>,
  ) {
    valuesState.value = Object.fromEntries(
      schema.fields.map((field) => [
        field.key,
        initialValues?.[field.key] ?? field.defaultValue ?? "",
      ]),
    );
  }

  function reset() {
    requestState.value = null;
    valuesState.value = {};
    pendingState.value = false;
    errorState.value = null;
  }

  watch(
    () => shellState.activePanel.value,
    (panel) => {
      if (panel !== "add") {
        reset();
      }
    },
  );

  function close() {
    reset();
    if (shellState.activePanel.value === "add") {
      shellState.closePanel();
    }
  }

  return {
    activeSchema: computed(() => requestState.value?.schema ?? null),
    values: computed(() => valuesState.value),
    pending: computed(() => pendingState.value),
    error: computed(() => errorState.value),
    open(request) {
      requestState.value = request as AppShellAddDialogRequest;
      initializeValues(request.schema, request.initialValues);
      pendingState.value = false;
      errorState.value = null;
      shellState.openPanel("add");
    },
    close,
    setValue(key, value) {
      valuesState.value = {
        ...valuesState.value,
        [key]: value,
      };
    },
    async submit() {
      const request = requestState.value;
      if (!request) {
        return;
      }

      pendingState.value = true;
      errorState.value = null;

      try {
        const payload = request.schema.map(valuesState.value);
        const result = await request.submit(payload);
        if (!result.ok) {
          errorState.value = result.error;
          return;
        }

        close();
      } catch (error) {
        errorState.value = normalizeMessage(error);
      } finally {
        pendingState.value = false;
      }
    },
  };
}

export function useAppShellAddDialogModel(): AppShellAddDialogModel {
  if (!singleton) {
    singleton = createAppShellAddDialogModel();
  }

  return singleton;
}

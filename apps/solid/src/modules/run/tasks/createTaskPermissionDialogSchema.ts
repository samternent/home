import type { RunTaskPermissionCreateInput } from "@/modules/run/services/useRunTaskActions";
import type { AppShellAddDialogSchema } from "@/modules/ui/useAppShellAddDialogModel";

function normalizeNullable(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function createTaskPermissionDialogSchema(): AppShellAddDialogSchema<RunTaskPermissionCreateInput> {
  return {
    id: "tasks.permission.create",
    title: "Add permission",
    description: "Create a local permission group inside this ledger. Membership can be granted separately and remains self-contained here.",
    submitLabel: "Add permission",
    fields: [
      {
        key: "title",
        label: "Title",
        component: "text",
        placeholder: "Core team",
        required: true,
        width: "full",
      },
      {
        key: "scope",
        label: "Scope",
        component: "text",
        placeholder: "tasks",
        width: "full",
      },
    ],
    map(values) {
      const title = values.title?.trim() ?? "";
      if (!title) {
        throw new Error("Permission title is required.");
      }

      return {
        title,
        scope: normalizeNullable(values.scope),
      };
    },
  };
}

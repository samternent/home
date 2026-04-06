import type { RunTaskListCreateInput } from "@/modules/run/services/useRunTaskActions";
import type { AppShellAddDialogSchema } from "@/modules/ui/useAppShellAddDialogModel";

function normalizeNullable(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function createTaskListDialogSchema(): AppShellAddDialogSchema<RunTaskListCreateInput> {
  return {
    id: "tasks.list.create",
    title: "Add task list",
    description: "Create another task list inside this ledger document.",
    submitLabel: "Add list",
    fields: [
      {
        key: "title",
        label: "Title",
        component: "text",
        placeholder: "Sprint backlog",
        required: true,
        width: "full",
      },
      {
        key: "description",
        label: "Description",
        component: "textarea",
        placeholder: "Optional context for this list.",
        rows: 3,
        width: "full",
      },
    ],
    map(values) {
      const title = values.title?.trim() ?? "";
      if (!title) {
        throw new Error("Task list title is required.");
      }

      return {
        title,
        description: normalizeNullable(values.description),
      };
    },
  };
}

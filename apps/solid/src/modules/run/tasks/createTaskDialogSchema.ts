import type { RunTaskCreateInput } from "@/modules/run/services/useRunTaskActions";
import type { AppShellAddDialogSchema } from "@/modules/ui/useAppShellAddDialogModel";
import type {
  TaskListRecord,
  TaskPermissionRecord,
  TaskPriority,
} from "./types";

export type TaskAssigneeOption = {
  userId: string;
  name: string;
};

type TaskDialogMode = "create" | "edit";
type CreateTaskDialogSchemaOptions = {
  mode?: TaskDialogMode;
  taskLists?: TaskListRecord[];
  assignees?: TaskAssigneeOption[];
  permissions?: TaskPermissionRecord[];
};

function normalizeNullable(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTags(value: string | undefined): string[] {
  return Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );
}

function normalizePriority(value: string | undefined): TaskPriority {
  if (value === "low" || value === "normal" || value === "high") {
    return value;
  }

  return "normal";
}

export function createTaskDialogSchema(
  options: CreateTaskDialogSchemaOptions = {},
): AppShellAddDialogSchema<RunTaskCreateInput> {
  const mode = options.mode ?? "create";
  const taskLists = options.taskLists ?? [];
  const assignees = options.assignees ?? [];
  const permissions = options.permissions ?? [];
  const fields: AppShellAddDialogSchema<RunTaskCreateInput>["fields"] = [
    ...(taskLists.length
      ? [
          {
            key: "taskListId",
            label: "Task list",
            component: "select" as const,
            width: "full" as const,
            defaultValue: "",
            options: [
              { label: "Document root", value: "" },
              ...taskLists.map((taskList) => ({
                label: taskList.title,
                value: taskList.taskListId,
              })),
            ],
          },
        ]
      : []),
    {
      key: "title",
      label: "Title",
      component: "text",
      placeholder: "Polish command palette interactions",
      required: true,
      width: "full",
    },
    {
      key: "assigneeId",
        label: "Assignee",
        component: "select",
        defaultValue: "",
        options: [
          { label: "Unassigned", value: "" },
          ...assignees.map((assignee) => ({
            label: assignee.name,
            value: assignee.userId,
          })),
        ],
        width: "half",
    },
    {
      key: "permissionId",
      label: "Permission",
      component: "select",
      defaultValue: "",
      options: [
        { label: "No permission group", value: "" },
        ...permissions.map((permission) => ({
          label: permission.title,
          value: permission.permissionId,
        })),
      ],
      width: "half",
    },
    {
      key: "area",
      label: "Area",
      component: "text",
      placeholder: "Core",
      width: "half",
    },
    {
      key: "priority",
      label: "Priority",
      component: "select",
      width: "half",
      defaultValue: "normal",
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "normal" },
        { label: "High", value: "high" },
      ],
    },
    {
      key: "dueAt",
      label: "Due date",
      component: "date",
      width: "half",
    },
    {
      key: "tags",
      label: "Tags",
      component: "text",
      placeholder: "Keyboard, UX, Polish",
      description: "Separate multiple tags with commas.",
      width: "full",
    },
    {
      key: "notes",
      label: "Notes",
      component: "textarea",
      placeholder: "Add any supporting context for the task.",
      rows: 4,
      width: "full",
    },
  ];

  return {
    id: `tasks.${mode}`,
    title: mode === "create" ? "Add task" : "Edit task",
    description:
      mode === "create"
        ? "Capture a new task for this ledger document using the shared add flow. The task is staged immediately, then committed into signed history when you are ready."
        : "Update the task details for this ledger document using the shared dialog flow while changes stay staged until you commit them.",
    submitLabel: mode === "create" ? "Add task" : "Save changes",
    fields,
    map(values) {
      const title = values.title?.trim() ?? "";
      if (!title) {
        throw new Error("Task title is required.");
      }

      return {
        taskListId: normalizeNullable(values.taskListId),
        title,
        notes: normalizeNullable(values.notes),
        assigneeId: normalizeNullable(values.assigneeId),
        assignee:
          assignees.find((assignee) => assignee.userId === normalizeNullable(values.assigneeId))?.name ?? null,
        permissionId: normalizeNullable(values.permissionId),
        area: normalizeNullable(values.area),
        priority: normalizePriority(values.priority),
        dueAt: normalizeNullable(values.dueAt),
        tags: normalizeTags(values.tags),
      };
    },
  };
}

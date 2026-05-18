import type { EntityFieldOption, EntityFormValues } from "@/runtime/entities";
import type { TaskRecord } from "@/app/plugins";
import type {
  RuntimeEntryEditorContext,
  RuntimeEntryEditorDefinition,
} from "@/runtime/apps/entryEditor";
import { resolveSurfaceEditorCustomFormComponent } from "@/runtime/apps/entryEditor";

type TaskEditorStatus = "active" | "archived";

type TaskScopeOption = {
  value: string;
  label: string;
  audienceType: "everyone" | "permission";
  taskListId: string | null;
  permissionId: string | null;
};

function readString(values: EntityFormValues, key: string): string {
  const value = values[key];
  return typeof value === "string" ? value : "";
}

function normalizeRequiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }
  return normalized;
}

function normalizeScopeOptions(context: RuntimeEntryEditorContext): TaskScopeOption[] {
  const permissionLists = context.appApi.tasks.permissionLists();
  const publicLists = context.appApi.tasks.publicLists();

  return [
    {
      value: "everyone",
      label: "Public",
      audienceType: "everyone",
      taskListId: null,
      permissionId: null,
    },
    ...publicLists.map((list) => ({
      value: `public-list:${list.id}`,
      label: `List · ${list.title}`,
      audienceType: "everyone" as const,
      taskListId: list.id,
      permissionId: null,
    })),
    ...permissionLists.map((permission) => ({
      value: `permission:${permission.id}`,
      label: `Private · ${permission.title}`,
      audienceType: "permission" as const,
      taskListId: null,
      permissionId: permission.id,
    })),
  ];
}

function createScopeFieldOptions(context: RuntimeEntryEditorContext): EntityFieldOption[] {
  return normalizeScopeOptions(context).map((option) => ({
    value: option.value,
    label: option.label,
  }));
}

function resolveScopeFromValue(
  context: RuntimeEntryEditorContext,
  value: string,
): TaskScopeOption {
  const scopeOptions = normalizeScopeOptions(context);
  return scopeOptions.find((option) => option.value === value) ?? scopeOptions[0]!;
}

function resolveScopeFromTask(context: RuntimeEntryEditorContext, task: TaskRecord): string {
  const scopeOptions = normalizeScopeOptions(context);

  if (task.permissionId) {
    const permissionValue = `permission:${task.permissionId}`;
    if (scopeOptions.some((option) => option.value === permissionValue)) {
      return permissionValue;
    }
  }

  if (task.taskListId) {
    const listValue = `public-list:${task.taskListId}`;
    if (scopeOptions.some((option) => option.value === listValue)) {
      return listValue;
    }
  }

  return "everyone";
}

function createUserFieldOptions(context: RuntimeEntryEditorContext): EntityFieldOption[] {
  return [
    { value: "", label: "Unassigned" },
    ...context.appApi.users.all().map((user) => {
      const profile = context.appApi.profiles.byIdentityKey(user.identityKey);
      return {
        value: user.identityKey,
        label: profile?.displayName ?? user.label ?? user.identityKey.slice(0, 20),
      };
    }),
  ];
}

function createColumnFieldOptions(context: RuntimeEntryEditorContext): EntityFieldOption[] {
  const boardId = context.appApi.tasks.defaultBoardId();
  return context.appApi.tasks.boardColumns(boardId).map((column) => ({
    value: column.id,
    label: column.title,
  }));
}

async function createSubmit(
  values: EntityFormValues,
  context: RuntimeEntryEditorContext,
): Promise<void> {
  const title = normalizeRequiredText(readString(values, "title"), "Task title");
  const scopeValue = readString(values, "scope") || "everyone";
  const assigneeIdentityKey = readString(values, "assigneeIdentityKey") || null;

  const scope = resolveScopeFromValue(context, scopeValue);

  await context.appApi.tasks.create({
    title,
    taskListId: scope.taskListId,
    permissionId: scope.permissionId,
    audienceType: scope.audienceType,
    audienceId: scope.permissionId,
    assigneeIdentityKey,
  });
}

async function editSubmit(
  task: TaskRecord,
  values: EntityFormValues,
  context: RuntimeEntryEditorContext,
): Promise<void> {
  const nextTitle = normalizeRequiredText(readString(values, "title"), "Task title");
  const nextColumnId = readString(values, "columnId") || task.columnId;
  const nextAssigneeIdentityKey = readString(values, "assigneeIdentityKey") || null;
  const nextStatus = (readString(values, "status") || "active") as TaskEditorStatus;

  if (nextTitle !== task.title) {
    await context.appApi.tasks.rename({
      taskId: task.id,
      title: nextTitle,
    });
  }

  if (nextColumnId !== task.columnId) {
    await context.appApi.tasks.move({
      taskId: task.id,
      columnId: nextColumnId,
    });
  }

  if (nextAssigneeIdentityKey !== (task.assigneeIdentityKey ?? null)) {
    await context.appApi.tasks.assign({
      taskId: task.id,
      assigneeIdentityKey: nextAssigneeIdentityKey,
    });
  }

  if (nextStatus === "archived") {
    await context.appApi.tasks.archive({
      taskId: task.id,
    });
  }
}

export function createRuntimeTaskEntryEditor(): RuntimeEntryEditorDefinition<TaskRecord> {
  return {
    appId: "tasks",
    entityType: "task",
    buildCreatePanelConfig(context) {
      return {
        appId: "tasks",
        entityType: "task",
        title: "Create task",
        description: "Stage a task ledger entry.",
        mode: "create",
        schema: {
          submitLabel: "Stage task",
          fields: [
            {
              id: "title",
              label: "Task title",
              kind: "text",
              placeholder: "Task title",
              required: true,
            },
            {
              id: "scope",
              label: "Visibility",
              kind: "select",
              required: true,
              options: createScopeFieldOptions(context),
            },
            {
              id: "assigneeIdentityKey",
              label: "Assignee",
              kind: "select",
              options: createUserFieldOptions(context),
            },
          ],
        },
        initialValues: {
          scope: "everyone",
          assigneeIdentityKey: "",
        },
        customFormComponent: resolveSurfaceEditorCustomFormComponent(
          context.surfaceEditor,
        ),
        onSubmit(values) {
          return createSubmit(values, context);
        },
      };
    },
    buildEditPanelConfig(task, context) {
      return {
        appId: "tasks",
        entityType: "task",
        title: "Edit task",
        description: "Stage task updates for this ledger entry.",
        mode: "edit",
        schema: {
          submitLabel: "Stage updates",
          fields: [
            {
              id: "title",
              label: "Task title",
              kind: "text",
              required: true,
            },
            {
              id: "scope",
              label: "Visibility",
              kind: "select",
              required: true,
              disabled: true,
              options: createScopeFieldOptions(context),
              description: "Visibility is fixed after creation in v1.",
            },
            {
              id: "assigneeIdentityKey",
              label: "Assignee",
              kind: "select",
              options: createUserFieldOptions(context),
            },
            {
              id: "columnId",
              label: "Column",
              kind: "select",
              required: true,
              options: createColumnFieldOptions(context),
            },
            {
              id: "status",
              label: "Status",
              kind: "select",
              options: [
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
              ],
              description: "Set to archived to stage a task.archive entry.",
            },
          ],
        },
        initialValues: {
          title: task.title,
          scope: resolveScopeFromTask(context, task),
          assigneeIdentityKey: task.assigneeIdentityKey ?? "",
          columnId: task.columnId,
          status: "active",
        },
        customFormComponent: resolveSurfaceEditorCustomFormComponent(
          context.surfaceEditor,
        ),
        onSubmit(values) {
          return editSubmit(task, values, context);
        },
      };
    },
  };
}

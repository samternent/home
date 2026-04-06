import type {
  TaskCreateInput,
  TaskEditInput,
  TaskListCreateInput,
  TaskListEditInput,
  TaskPermissionCreateInput,
  TaskPermissionEditInput,
  TaskPermissionGrantInput,
  TaskPriority,
  TaskSetStatusInput,
  TaskStatus,
  TaskUserUpsertInput,
} from "./types";

const TASK_STATUSES: TaskStatus[] = [
  "backlog",
  "active",
  "blocked",
  "done",
];

const TASK_PRIORITIES: TaskPriority[] = [
  "low",
  "normal",
  "high",
];

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  return value;
}

function optionalNullableString(value: unknown, label: string): string | null | undefined {
  if (value === undefined || value === null) {
    return value as null | undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} must be a string, null, or undefined.`);
  }

  return value;
}

function optionalStringArray(value: unknown, label: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array of strings or undefined.`);
  }

  return value.map((entry, index) =>
    requireString(entry, `${label}[${index}]`).trim(),
  );
}

function optionalPriority(value: unknown): TaskPriority | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !TASK_PRIORITIES.includes(value as TaskPriority)) {
    throw new Error("priority must be one of low, normal, or high.");
  }

  return value as TaskPriority;
}

function requireStatus(value: unknown): TaskStatus {
  if (typeof value !== "string" || !TASK_STATUSES.includes(value as TaskStatus)) {
    throw new Error("status must be one of backlog, active, blocked, or done.");
  }

  return value as TaskStatus;
}

export function parseTaskCreateInput(input: unknown): TaskCreateInput {
  const value = requireObject(input, "task create input");
  const taskId = requireString(value.taskId, "taskId");
  const title = requireString(value.title, "title").trim();

  if (!title) {
    throw new Error("title is required.");
  }

  return {
    taskId,
    taskListId: optionalNullableString(value.taskListId, "taskListId"),
    title,
    notes: optionalNullableString(value.notes, "notes"),
    priority: optionalPriority(value.priority),
    area: optionalNullableString(value.area, "area"),
    assignee: optionalNullableString(value.assignee, "assignee"),
    assigneeId: optionalNullableString(value.assigneeId, "assigneeId"),
    permissionId: optionalNullableString(value.permissionId, "permissionId"),
    tags: optionalStringArray(value.tags, "tags"),
    dueAt: optionalNullableString(value.dueAt, "dueAt"),
  };
}

export function parseTaskEditInput(input: unknown): TaskEditInput {
  const value = requireObject(input, "task edit input");
  const taskId = requireString(value.taskId, "taskId");
  const next: TaskEditInput = { taskId };

  if (value.taskListId !== undefined) {
    next.taskListId = optionalNullableString(value.taskListId, "taskListId") ?? null;
  }

  if (value.title !== undefined) {
    const title = requireString(value.title, "title").trim();
    if (!title) {
      throw new Error("title is required.");
    }
    next.title = title;
  }

  if (value.notes !== undefined) {
    next.notes = optionalNullableString(value.notes, "notes") ?? null;
  }

  if (value.priority !== undefined) {
    next.priority = optionalPriority(value.priority);
  }

  if (value.area !== undefined) {
    next.area = optionalNullableString(value.area, "area") ?? null;
  }

  if (value.assignee !== undefined) {
    next.assignee = optionalNullableString(value.assignee, "assignee") ?? null;
  }

  if (value.assigneeId !== undefined) {
    next.assigneeId = optionalNullableString(value.assigneeId, "assigneeId") ?? null;
  }

  if (value.permissionId !== undefined) {
    next.permissionId = optionalNullableString(value.permissionId, "permissionId") ?? null;
  }

  if (value.tags !== undefined) {
    next.tags = optionalStringArray(value.tags, "tags") ?? [];
  }

  if (value.dueAt !== undefined) {
    next.dueAt = optionalNullableString(value.dueAt, "dueAt") ?? null;
  }

  if (
    next.taskListId === undefined &&
    next.title === undefined &&
    next.notes === undefined &&
    next.priority === undefined &&
    next.area === undefined &&
    next.assignee === undefined &&
    next.assigneeId === undefined &&
    next.permissionId === undefined &&
    next.tags === undefined &&
    next.dueAt === undefined
  ) {
    throw new Error("task edit requires at least one field to change");
  }

  return next;
}

export function parseTaskSetStatusInput(input: unknown): TaskSetStatusInput {
  const value = requireObject(input, "task status input");
  return {
    taskId: requireString(value.taskId, "taskId"),
    status: requireStatus(value.status),
  };
}

export function parseTaskListCreateInput(input: unknown): TaskListCreateInput {
  const value = requireObject(input, "task list create input");
  const taskListId = requireString(value.taskListId, "taskListId");
  const title = requireString(value.title, "title").trim();
  if (!title) {
    throw new Error("title is required.");
  }

  return {
    taskListId,
    title,
    description: optionalNullableString(value.description, "description"),
  };
}

export function parseTaskListEditInput(input: unknown): TaskListEditInput {
  const value = requireObject(input, "task list edit input");
  const taskListId = requireString(value.taskListId, "taskListId");
  const next: TaskListEditInput = { taskListId };

  if (value.title !== undefined) {
    const title = requireString(value.title, "title").trim();
    if (!title) {
      throw new Error("title is required.");
    }
    next.title = title;
  }

  if (value.description !== undefined) {
    next.description = optionalNullableString(value.description, "description") ?? null;
  }

  if (next.title === undefined && next.description === undefined) {
    throw new Error("task list edit requires at least one field to change");
  }

  return next;
}

export function parseTaskUserUpsertInput(input: unknown): TaskUserUpsertInput {
  const value = requireObject(input, "task user input");
  const userId = requireString(value.userId, "userId");
  const name = requireString(value.name, "name").trim();
  if (!name) {
    throw new Error("name is required.");
  }

  return {
    userId,
    name,
    publicIdentityKey: optionalNullableString(value.publicIdentityKey, "publicIdentityKey"),
    publicEncryptionKey: optionalNullableString(value.publicEncryptionKey, "publicEncryptionKey"),
  };
}

export function parseTaskPermissionCreateInput(input: unknown): TaskPermissionCreateInput {
  const value = requireObject(input, "task permission create input");
  const permissionId = requireString(value.permissionId, "permissionId");
  const title = requireString(value.title, "title").trim();
  if (!title) {
    throw new Error("title is required.");
  }

  return {
    permissionId,
    title,
    scope: optionalNullableString(value.scope, "scope"),
  };
}

export function parseTaskPermissionEditInput(input: unknown): TaskPermissionEditInput {
  const value = requireObject(input, "task permission edit input");
  const permissionId = requireString(value.permissionId, "permissionId");
  const next: TaskPermissionEditInput = { permissionId };

  if (value.title !== undefined) {
    const title = requireString(value.title, "title").trim();
    if (!title) {
      throw new Error("title is required.");
    }
    next.title = title;
  }

  if (value.scope !== undefined) {
    next.scope = optionalNullableString(value.scope, "scope") ?? null;
  }

  if (next.title === undefined && next.scope === undefined) {
    throw new Error("task permission edit requires at least one field to change");
  }

  return next;
}

export function parseTaskPermissionGrantInput(input: unknown): TaskPermissionGrantInput {
  const value = requireObject(input, "task permission grant input");
  return {
    permissionGrantId: requireString(value.permissionGrantId, "permissionGrantId"),
    permissionId: requireString(value.permissionId, "permissionId"),
    userId: requireString(value.userId, "userId"),
    recipient: optionalNullableString(value.recipient, "recipient"),
  };
}

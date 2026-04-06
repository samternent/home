export type TaskId = string;
export type TaskListId = string;
export type TaskUserId = string;
export type TaskPermissionId = string;
export type TaskPermissionGrantId = string;

export type TaskStatus = "backlog" | "active" | "blocked" | "done";

export type TaskPriority = "low" | "normal" | "high";

export type TaskRecord = {
  taskId: TaskId;
  taskListId: TaskListId | null;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  area: string | null;
  assignee: string | null;
  assigneeId: TaskUserId | null;
  permissionId: TaskPermissionId | null;
  tags: string[];
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskListRecord = {
  taskListId: TaskListId;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskUserRecord = {
  userId: TaskUserId;
  name: string;
  publicIdentityKey: string | null;
  publicEncryptionKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskPermissionRecord = {
  permissionId: TaskPermissionId;
  title: string;
  scope: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskPermissionGrantRecord = {
  permissionGrantId: TaskPermissionGrantId;
  permissionId: TaskPermissionId;
  userId: TaskUserId;
  wrappedPermissionKey: string;
  keyEncoding: "armor";
  createdAt: string;
  updatedAt: string;
};

export type TaskHiddenProtectedSummary = {
  taskCount: number;
  updateCount: number;
};

export type TaskProjection = {
  tasksById: Record<TaskId, TaskRecord>;
  orderedTaskIds: TaskId[];
  taskListsById: Record<TaskListId, TaskListRecord>;
  orderedTaskListIds: TaskListId[];
  usersById: Record<TaskUserId, TaskUserRecord>;
  orderedUserIds: TaskUserId[];
  permissionsById: Record<TaskPermissionId, TaskPermissionRecord>;
  orderedPermissionIds: TaskPermissionId[];
  permissionGrantsById: Record<TaskPermissionGrantId, TaskPermissionGrantRecord>;
  orderedPermissionGrantIds: TaskPermissionGrantId[];
  permissionKeysById: Record<TaskPermissionId, string>;
  accessiblePermissionIds: TaskPermissionId[];
  listsByStatus: Record<TaskStatus, TaskId[]>;
  countsByStatus: Record<TaskStatus, number>;
  hiddenProtectedByPermissionId: Record<
    TaskPermissionId,
    TaskHiddenProtectedSummary
  >;
  hiddenProtectedTaskCount: number;
  hiddenProtectedUpdateCount: number;
};

export type TaskCreateInput = {
  taskId: TaskId;
  taskListId?: TaskListId | null;
  title: string;
  notes?: string | null;
  priority?: TaskPriority;
  area?: string | null;
  assignee?: string | null;
  assigneeId?: TaskUserId | null;
  permissionId?: TaskPermissionId | null;
  tags?: string[];
  dueAt?: string | null;
};

export type TaskEditInput = {
  taskId: TaskId;
  taskListId?: TaskListId | null;
  title?: string;
  notes?: string | null;
  priority?: TaskPriority;
  area?: string | null;
  assignee?: string | null;
  assigneeId?: TaskUserId | null;
  permissionId?: TaskPermissionId | null;
  tags?: string[];
  dueAt?: string | null;
};

export type TaskSetStatusInput = {
  taskId: TaskId;
  status: TaskStatus;
};

export type TaskListCreateInput = {
  taskListId: TaskListId;
  title: string;
  description?: string | null;
};

export type TaskListEditInput = {
  taskListId: TaskListId;
  title?: string;
  description?: string | null;
};

export type TaskUserUpsertInput = {
  userId: TaskUserId;
  name: string;
  publicIdentityKey?: string | null;
  publicEncryptionKey?: string | null;
};

export type TaskPermissionCreateInput = {
  permissionId: TaskPermissionId;
  title: string;
  scope?: string | null;
};

export type TaskPermissionEditInput = {
  permissionId: TaskPermissionId;
  title?: string;
  scope?: string | null;
};

export type TaskPermissionGrantInput = {
  permissionGrantId: TaskPermissionGrantId;
  permissionId: TaskPermissionId;
  userId: TaskUserId;
  recipient?: string | null;
};

export type TaskCompatibilityResult = {
  supported: boolean;
  reason: string | null;
  classification: "empty" | "task-document" | "mixed" | "unsupported";
};

export type RunTasksMode = "unavailable" | "inspect" | "interactive";

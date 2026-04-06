export type TaskId = string;

export type TaskStatus = "backlog" | "active" | "blocked" | "done";

export type TaskPriority = "low" | "normal" | "high";

export type TaskRecord = {
  taskId: TaskId;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskProjection = {
  tasksById: Record<TaskId, TaskRecord>;
  orderedTaskIds: TaskId[];
  listsByStatus: Record<TaskStatus, TaskId[]>;
  countsByStatus: Record<TaskStatus, number>;
};

export type TaskCreateInput = {
  taskId: TaskId;
  title: string;
  notes?: string | null;
  priority?: TaskPriority;
  dueAt?: string | null;
};

export type TaskEditInput = {
  taskId: TaskId;
  title?: string;
  notes?: string | null;
  priority?: TaskPriority;
  dueAt?: string | null;
};

export type TaskSetStatusInput = {
  taskId: TaskId;
  status: TaskStatus;
};

export type TaskCompatibilityResult = {
  supported: boolean;
  reason: string | null;
  classification: "empty" | "task-only" | "mixed" | "unsupported";
};

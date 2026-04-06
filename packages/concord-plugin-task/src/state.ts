import type {
  TaskId,
  TaskProjection,
  TaskRecord,
  TaskStatus,
} from "./types";

export const TASK_STATUSES: TaskStatus[] = [
  "backlog",
  "active",
  "blocked",
  "done",
];

export function createEmptyTaskProjection(): TaskProjection {
  return {
    tasksById: {},
    orderedTaskIds: [],
    listsByStatus: {
      backlog: [],
      active: [],
      blocked: [],
      done: [],
    },
    countsByStatus: {
      backlog: 0,
      active: 0,
      blocked: 0,
      done: 0,
    },
  };
}

export function normalizeTaskProjection(
  tasksById: Record<TaskId, TaskRecord>,
  orderedTaskIds: TaskId[],
): TaskProjection {
  const next = createEmptyTaskProjection();
  next.tasksById = tasksById;
  next.orderedTaskIds = orderedTaskIds;

  for (const taskId of orderedTaskIds) {
    const task = tasksById[taskId];
    if (!task) {
      continue;
    }

    next.listsByStatus[task.status].push(taskId);
    next.countsByStatus[task.status] += 1;
  }

  return next;
}

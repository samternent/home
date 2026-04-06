import type { TaskProjection, TaskStatus } from "./types";

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
    taskListsById: {},
    orderedTaskListIds: [],
    usersById: {},
    orderedUserIds: [],
    permissionsById: {},
    orderedPermissionIds: [],
    permissionGrantsById: {},
    orderedPermissionGrantIds: [],
    permissionKeysById: {},
    accessiblePermissionIds: [],
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
    hiddenProtectedByPermissionId: {},
    hiddenProtectedTaskCount: 0,
    hiddenProtectedUpdateCount: 0,
  };
}

export function normalizeTaskProjection(projection: TaskProjection): TaskProjection {
  const listsByStatus: Record<TaskStatus, string[]> = {
    backlog: [],
    active: [],
    blocked: [],
    done: [],
  };
  const countsByStatus: Record<TaskStatus, number> = {
    backlog: 0,
    active: 0,
    blocked: 0,
    done: 0,
  };

  const next = {
    ...projection,
    accessiblePermissionIds: Object.keys(projection.permissionKeysById).sort((left, right) =>
      left.localeCompare(right),
    ),
    listsByStatus,
    countsByStatus,
  } satisfies TaskProjection;

  for (const taskId of projection.orderedTaskIds) {
    const task = projection.tasksById[taskId];
    if (!task) {
      continue;
    }

    next.listsByStatus[task.status].push(taskId);
    next.countsByStatus[task.status] += 1;
  }

  return next;
}

import { computed, type ComputedRef } from "vue";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunStorageCatalog } from "@/modules/run/storage";
import { TASK_STATUSES } from "./state";
import { useRunTasksRuntime } from "./useRunTasksRuntime";
import type {
  RunTasksMode,
  TaskListRecord,
  TaskHiddenProtectedSummary,
  TaskPermissionGrantRecord,
  TaskPermissionRecord,
  TaskRecord,
  TaskStatus,
  TaskUserRecord,
} from "./types";

export type RunTasksSurfaceGroup = {
  status: TaskStatus;
  tasks: TaskRecord[];
};

export type RunTasksSurface = {
  mode: ComputedRef<RunTasksMode>;
  status: ComputedRef<"idle" | "loading" | "ready" | "error">;
  transition: ComputedRef<"idle" | "loading-ledger" | "switching-identity">;
  error: ComputedRef<string | null>;
  reason: ComputedRef<string | null>;
  available: ComputedRef<boolean>;
  verified: ComputedRef<boolean>;
  empty: ComputedRef<boolean>;
  documentTitle: ComputedRef<string>;
  taskLists: ComputedRef<TaskListRecord[]>;
  users: ComputedRef<TaskUserRecord[]>;
  permissions: ComputedRef<TaskPermissionRecord[]>;
  accessiblePermissions: ComputedRef<TaskPermissionRecord[]>;
  permissionGrants: ComputedRef<TaskPermissionGrantRecord[]>;
  canManagePermissions: ComputedRef<boolean>;
  hiddenProtectedByPermissionId: ComputedRef<
    Record<string, TaskHiddenProtectedSummary>
  >;
  hiddenProtectedTaskCount: ComputedRef<number>;
  hiddenProtectedUpdateCount: ComputedRef<number>;
  hasHiddenProtectedEntries: ComputedRef<boolean>;
  accessSummary: ComputedRef<string>;
  tasks: ComputedRef<TaskRecord[]>;
  groups: ComputedRef<RunTasksSurfaceGroup[]>;
  countsByStatus: ComputedRef<Record<TaskStatus, number>>;
  totalTasks: ComputedRef<number>;
  openTasks: ComputedRef<number>;
  doneTasks: ComputedRef<number>;
  headingSummary: ComputedRef<string>;
  emptyStateBody: ComputedRef<string>;
  formatRelativeTime(value: string): string;
};

let singleton: RunTasksSurface | null = null;

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

function formatRelativeTime(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return "recently";
  }

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, unitSeconds] of units) {
    if (Math.abs(diffSeconds) >= unitSeconds || unit === "second") {
      return relativeTimeFormatter.format(
        Math.round(diffSeconds / unitSeconds),
        unit,
      );
    }
  }

  return "just now";
}

function createRunTasksSurface(): RunTasksSurface {
  const runtime = useRunTasksRuntime();
  const projection = useRunProjectionState();
  const storage = useRunStorageCatalog();

  const activeLedgerTitle = computed(() => {
    const ledgerId = projection.activeProjection.value.ledgerId;
    if (!ledgerId) {
      return "No document open";
    }

    const ledger = storage.ledgers.value.find((entry) => entry.id === ledgerId);
    if (ledger?.title) {
      return ledger.title;
    }

    const resourceUrl = projection.activeProjection.value.openContext?.resourceUrl
      ?? projection.activeProjection.value.candidate?.resourceUrl
      ?? "";
    const resourceName = resourceUrl.split("/").filter(Boolean).pop() ?? ledgerId;
    return resourceName.replace(/\.json$/i, "");
  });

  const groups = computed<RunTasksSurfaceGroup[]>(() =>
    TASK_STATUSES.map((status) => ({
      status,
      tasks: runtime.projection.value.listsByStatus[status].map(
        (taskId) => runtime.projection.value.tasksById[taskId],
      ),
    })),
  );

  const tasks = computed<TaskRecord[]>(() =>
    runtime.projection.value.orderedTaskIds
      .map((taskId) => runtime.projection.value.tasksById[taskId])
      .filter((task): task is TaskRecord => Boolean(task)),
  );

  const taskLists = computed<TaskListRecord[]>(() =>
    runtime.projection.value.orderedTaskListIds
      .map((taskListId) => runtime.projection.value.taskListsById[taskListId])
      .filter((taskList): taskList is TaskListRecord => Boolean(taskList)),
  );

  const users = computed<TaskUserRecord[]>(() =>
    runtime.projection.value.orderedUserIds
      .map((userId) => runtime.projection.value.usersById[userId])
      .filter((user): user is TaskUserRecord => Boolean(user)),
  );

  const accessiblePermissions = computed<TaskPermissionRecord[]>(() =>
    runtime.projection.value.accessiblePermissionIds
      .map((permissionId) => runtime.projection.value.permissionsById[permissionId])
      .filter((permission): permission is TaskPermissionRecord => Boolean(permission)),
  );

  const permissions = computed<TaskPermissionRecord[]>(() =>
    accessiblePermissions.value,
  );

  const permissionGrants = computed<TaskPermissionGrantRecord[]>(() =>
    runtime.projection.value.orderedPermissionGrantIds
      .map((grantId) => runtime.projection.value.permissionGrantsById[grantId])
      .filter((grant): grant is TaskPermissionGrantRecord => Boolean(grant)),
  );

  const totalTasks = computed(() => runtime.projection.value.orderedTaskIds.length);
  const openTasks = computed(() => totalTasks.value - runtime.projection.value.countsByStatus.done);
  const doneTasks = computed(() => runtime.projection.value.countsByStatus.done);

  return {
    mode: computed(() => runtime.mode.value),
    status: computed(() => runtime.status.value),
    transition: computed(() => runtime.transition.value),
    error: computed(() => runtime.error.value),
    reason: computed(() => runtime.reason.value),
    available: computed(() => runtime.mode.value !== "unavailable"),
    verified: computed(() => runtime.mode.value !== "unavailable"),
    empty: computed(() => totalTasks.value === 0),
    documentTitle: activeLedgerTitle,
    taskLists,
    users,
    permissions,
    accessiblePermissions,
    permissionGrants,
    canManagePermissions: computed(() =>
      runtime.mode.value === "interactive",
    ),
    hiddenProtectedByPermissionId: computed(
      () => runtime.projection.value.hiddenProtectedByPermissionId,
    ),
    hiddenProtectedTaskCount: computed(
      () => runtime.projection.value.hiddenProtectedTaskCount,
    ),
    hiddenProtectedUpdateCount: computed(
      () => runtime.projection.value.hiddenProtectedUpdateCount,
    ),
    hasHiddenProtectedEntries: computed(
      () =>
        runtime.projection.value.hiddenProtectedTaskCount > 0
        || runtime.projection.value.hiddenProtectedUpdateCount > 0,
    ),
    accessSummary: computed(() => {
      if (runtime.mode.value === "unavailable") {
        return runtime.reason.value ?? "Tasks is unavailable.";
      }

      const accessibleCount = accessiblePermissions.value.length;
      const permissionCount = runtime.projection.value.orderedPermissionIds.length;
      const hiddenTaskCount = runtime.projection.value.hiddenProtectedTaskCount;
      const hiddenUpdateCount =
        runtime.projection.value.hiddenProtectedUpdateCount;

      if (permissionCount === 0) {
        return "No permission groups in this ledger yet.";
      }

      if (hiddenTaskCount > 0 || hiddenUpdateCount > 0) {
        const hiddenParts: string[] = [];
        if (hiddenTaskCount > 0) {
          hiddenParts.push(
            hiddenTaskCount === 1 ? "1 hidden protected task" : `${hiddenTaskCount} hidden protected tasks`,
          );
        }
        if (hiddenUpdateCount > 0) {
          hiddenParts.push(
            hiddenUpdateCount === 1 ? "1 hidden protected update" : `${hiddenUpdateCount} hidden protected updates`,
          );
        }

        return `${accessibleCount}/${permissionCount} permission groups accessible. ${hiddenParts.join(" and ")}.`;
      }

      return `${accessibleCount}/${permissionCount} permission groups accessible.`;
    }),
    tasks,
    groups,
    countsByStatus: computed(() => runtime.projection.value.countsByStatus),
    totalTasks,
    openTasks,
    doneTasks,
    headingSummary: computed(() => {
      if (runtime.mode.value === "unavailable") {
        return runtime.reason.value ?? "Tasks is not available for the current ledger.";
      }

      if (totalTasks.value === 0) {
        return runtime.mode.value === "interactive"
          ? "This verified task document is empty. Add the first task when you're ready."
          : "You’re viewing a verified task document. Add identity when you want to make changes.";
      }

      const summary = `${totalTasks.value} tasks, ${openTasks.value} open, ${doneTasks.value} done.`;
      return runtime.mode.value === "interactive"
        ? `${summary} Changes stage locally and become signed history when you commit them.`
        : `${summary} Add identity when you want to make changes.`;
    }),
    emptyStateBody: computed(
      () =>
        "This task document is stored in the current ledger. Tasks and related records are rebuilt from signed history. Start by adding your first task.",
    ),
    formatRelativeTime,
  };
}

export function useRunTasksSurface(): RunTasksSurface {
  if (!singleton) {
    singleton = createRunTasksSurface();
  }

  return singleton;
}

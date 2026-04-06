import {
  deriveAgeRecipient,
  parseIdentity,
  validateIdentity,
} from "@ternent/identity";
import { useRunIdentityService } from "@/modules/run/identity";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunTasksRuntime } from "@/modules/run/tasks/useRunTasksRuntime";
import type {
  TaskEditInput,
  TaskListCreateInput,
  TaskPermissionCreateInput,
  TaskPermissionGrantInput,
  TaskSetStatusInput,
  TaskPriority,
  TaskUserUpsertInput,
} from "@/modules/run/tasks/types";
import type { RunServiceResult } from "./types";

export type RunTaskCreateInput = {
  taskListId?: string | null;
  title: string;
  notes?: string | null;
  priority?: TaskPriority;
  area?: string | null;
  assignee?: string | null;
  assigneeId?: string | null;
  permissionId?: string | null;
  tags?: string[];
  dueAt?: string | null;
};

export type RunTaskListCreateInput = {
  title: string;
  description?: string | null;
};

export type RunTaskUserCreateInput = {
  name: string;
  serializedIdentity: string;
};

export type RunTaskPermissionCreateInput = {
  title: string;
  scope?: string | null;
};

export type RunTaskPermissionGrantCreateInput = {
  permissionId: string;
  userId: string;
};

export type RunTaskActions = {
  createTask(input: RunTaskCreateInput): Promise<RunServiceResult<{ taskId: string }>>;
  editTask(input: TaskEditInput): Promise<RunServiceResult<{ taskId: string }>>;
  setTaskStatus(input: TaskSetStatusInput): Promise<RunServiceResult<{ taskId: string }>>;
  createTaskList(input: RunTaskListCreateInput): Promise<RunServiceResult<{ taskListId: string }>>;
  createTaskUser(input: RunTaskUserCreateInput): Promise<RunServiceResult<{ userId: string }>>;
  createTaskPermission(input: RunTaskPermissionCreateInput): Promise<RunServiceResult<{ permissionId: string }>>;
  grantTaskPermission(input: RunTaskPermissionGrantCreateInput): Promise<RunServiceResult<{ permissionGrantId: string }>>;
  commitStaged(message: string): Promise<RunServiceResult<{ commitId: string; entryIds: string[] }>>;
  discardStaged(): Promise<RunServiceResult<{ stagedCount: number }>>;
};

let singleton: RunTaskActions | null = null;

function createError<T>(error: string): RunServiceResult<T> {
  return {
    ok: false,
    error,
  };
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown task action error.");
}

function createEntityId(prefix: string): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) {
    return `${prefix}:${randomUuid}`;
  }

  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function createRunTaskActions(): RunTaskActions {
  const identity = useRunIdentityService();
  const projection = useRunProjectionState();
  const tasks = useRunTasksRuntime();

  async function getInteractiveApp() {
    if (!projection.activeProjection.value.id || !projection.activeProjection.value.readiness.inspectable) {
      return {
        ok: false as const,
        error: "Open a verified task document before making changes.",
      };
    }

    if (!projection.activeProjection.value.taskSupport.supported) {
      return {
        ok: false as const,
        error: "Tasks is not available for the current ledger.",
      };
    }

    const ready = await tasks.ensureReady();
    if (!ready || !tasks.app.value) {
      return {
        ok: false as const,
        error: "Tasks is not ready for the current ledger yet.",
      };
    }

    if (tasks.mode.value !== "interactive") {
      return {
        ok: false as const,
        error: "You're viewing this task document read-only. Add identity to make changes.",
      };
    }

    return {
      ok: true as const,
      app: tasks.app.value,
    };
  }

  async function stageTaskMutation(
    commandType: string,
    commandInput: unknown,
    taskId: string,
  ): Promise<RunServiceResult<{ taskId: string }>> {
    const interactiveApp = await getInteractiveApp();
    if (!interactiveApp.ok) {
      return createError(interactiveApp.error);
    }

    try {
      await interactiveApp.app.command(commandType, commandInput);

      return {
        ok: true,
        value: {
          taskId,
        },
      };
    } catch (error) {
      return createError(normalizeMessage(error));
    }
  }

  return {
    async createTask(input) {
      const title = input.title.trim();
      if (!title) {
        return createError("Task title is required.");
      }

      const taskId = createEntityId("task");
      return await stageTaskMutation(
        "task.create-item",
        {
          taskId,
          taskListId: input.taskListId ?? null,
          title,
          notes: input.notes ?? null,
          priority: input.priority ?? "normal",
          area: input.area ?? null,
          assignee: input.assignee ?? null,
          assigneeId: input.assigneeId ?? null,
          permissionId: input.permissionId ?? null,
          tags: input.tags ?? [],
          dueAt: input.dueAt ?? null,
        },
        taskId,
      );
    },
    async editTask(input) {
      return await stageTaskMutation(
        "task.edit-item",
        input,
        input.taskId,
      );
    },
    async setTaskStatus(input) {
      return await stageTaskMutation(
        "task.set-status",
        input,
        input.taskId,
      );
    },
    async createTaskList(input) {
      const title = input.title.trim();
      if (!title) {
        return createError("Task list title is required.");
      }

      const taskListId = createEntityId("tasklist");
      const result = await stageTaskMutation(
        "tasklist.create-list",
        {
          taskListId,
          title,
          description: input.description ?? null,
        } satisfies TaskListCreateInput,
        taskListId,
      );

      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        value: {
          taskListId,
        },
      };
    },
    async createTaskUser(input) {
      const name = input.name.trim();
      if (!name) {
        return createError("User name is required.");
      }

      const identity = await validateIdentity(parseIdentity(input.serializedIdentity));
      const publicEncryptionKey = await deriveAgeRecipient(identity);
      const userId = `user:${identity.keyId}`;
      const result = await stageTaskMutation(
        "taskuser.upsert",
        {
          userId,
          name,
          publicIdentityKey: identity.publicKey,
          publicEncryptionKey,
        } satisfies TaskUserUpsertInput,
        userId,
      );

      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        value: {
          userId,
        },
      };
    },
    async createTaskPermission(input) {
      const title = input.title.trim();
      if (!title) {
        return createError("Permission title is required.");
      }

      const permissionId = createEntityId("permission");
      const result = await stageTaskMutation(
        "taskpermission.create-group",
        {
          permissionId,
          title,
          scope: input.scope ?? null,
        } satisfies TaskPermissionCreateInput,
        permissionId,
      );

      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        value: {
          permissionId,
        },
      };
    },
    async grantTaskPermission(input) {
      if (!input.userId.trim()) {
        return createError("Select a local identity to grant this permission.");
      }

      const targetIdentity =
        identity.identities.value.find(
          (record) => `user:${record.identity.keyId}` === input.userId,
        ) ?? null;

      if (!targetIdentity) {
        return createError("The selected identity is not available on this device.");
      }

      const permissionGrantId = createEntityId("permission-grant");
      const result = await stageTaskMutation(
        "taskpermission.grant-access",
        {
          permissionGrantId,
          permissionId: input.permissionId,
          userId: input.userId,
          recipient: await deriveAgeRecipient(targetIdentity.identity),
        } satisfies TaskPermissionGrantInput,
        permissionGrantId,
      );

      if (!result.ok) {
        return result;
      }

      return {
        ok: true,
        value: {
          permissionGrantId,
        },
      };
    },
    async commitStaged(message) {
      const interactiveApp = await getInteractiveApp();
      if (!interactiveApp.ok) {
        return createError(interactiveApp.error);
      }

      const normalizedMessage = message.trim();
      if (!normalizedMessage) {
        return createError("Commit message is required.");
      }

      try {
        const result = await interactiveApp.app.commit({
          metadata: {
            message: normalizedMessage,
          },
        });

        return {
          ok: true,
          value: {
            commitId: result.commitId,
            entryIds: result.entryIds,
          },
        };
      } catch (error) {
        return createError(normalizeMessage(error));
      }
    },
    async discardStaged() {
      const interactiveApp = await getInteractiveApp();
      if (!interactiveApp.ok) {
        return createError(interactiveApp.error);
      }

      try {
        await interactiveApp.app.clearStaged();
        return {
          ok: true,
          value: {
            stagedCount: interactiveApp.app.getState().stagedCount,
          },
        };
      } catch (error) {
        return createError(normalizeMessage(error));
      }
    },
  };
}

export function useRunTaskActions(): RunTaskActions {
  if (!singleton) {
    singleton = createRunTaskActions();
  }

  return singleton;
}

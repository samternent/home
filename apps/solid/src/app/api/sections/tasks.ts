import type {
  PermissionsState,
  PermissionRecord,
  TaskArchiveInput,
  TaskAssignInput,
  TaskBoardColumnRecord,
  TaskBoardRecord,
  TaskCreateInput,
  TaskListCreateInput,
  TaskListRecord,
  TaskMoveInput,
  TaskRecord,
  TaskRenameInput,
} from "@/app/plugins";
import type { AppIdentity, AppTasksApi } from "@/app/api/types";
import type { AppApiSharedContext } from "./shared";
import { resolveViewerIdentity } from "./shared";

export type TasksApiContext = AppApiSharedContext & {
  requireActiveIdentity: (activeIdentity: AppIdentity | null) => AppIdentity;
};

export function createTasksApi(context: TasksApiContext): AppTasksApi {
  return {
    create(input: Omit<TaskCreateInput, "actorIdentityKey">) {
      const actor = context.requireActiveIdentity(context.activeIdentity());
      return context.command("task.create", {
        ...input,
        actorIdentityKey: actor.identityKey,
      } satisfies TaskCreateInput);
    },
    rename(input: Omit<TaskRenameInput, "actorIdentityKey">) {
      const actor = context.requireActiveIdentity(context.activeIdentity());
      return context.command("task.rename", {
        ...input,
        actorIdentityKey: actor.identityKey,
      } satisfies TaskRenameInput);
    },
    move(input: Omit<TaskMoveInput, "actorIdentityKey">) {
      const actor = context.requireActiveIdentity(context.activeIdentity());
      return context.command("task.move", {
        ...input,
        actorIdentityKey: actor.identityKey,
      } satisfies TaskMoveInput);
    },
    assign(input: Omit<TaskAssignInput, "actorIdentityKey">) {
      const actor = context.requireActiveIdentity(context.activeIdentity());
      return context.command("task.assign", {
        ...input,
        actorIdentityKey: actor.identityKey,
      } satisfies TaskAssignInput);
    },
    archive(input: Omit<TaskArchiveInput, "actorIdentityKey">) {
      const actor = context.requireActiveIdentity(context.activeIdentity());
      return context.command("task.archive", {
        ...input,
        actorIdentityKey: actor.identityKey,
      } satisfies TaskArchiveInput);
    },
    createPublicList(input: Omit<TaskListCreateInput, "actorIdentityKey">) {
      const actor = context.requireActiveIdentity(context.activeIdentity());
      return context.command("task.list.create", {
        ...input,
        actorIdentityKey: actor.identityKey,
      } satisfies TaskListCreateInput);
    },
    all() {
      const { viewerIdentityKey, viewerIdentityId } = resolveViewerIdentity(context.activeIdentity());
      return context.select<TaskRecord[]>(
        "tasks",
        "all",
        viewerIdentityKey,
        viewerIdentityId,
        context.getPluginState<PermissionsState>("permissions"),
      );
    },
    byId(taskId: string) {
      const { viewerIdentityKey, viewerIdentityId } = resolveViewerIdentity(context.activeIdentity());
      return context.select<TaskRecord | null>(
        "tasks",
        "byId",
        taskId,
        viewerIdentityKey,
        viewerIdentityId,
        context.getPluginState<PermissionsState>("permissions"),
      );
    },
    byBoard(boardId: string) {
      const { viewerIdentityKey, viewerIdentityId } = resolveViewerIdentity(context.activeIdentity());
      return context.select<TaskRecord[]>(
        "tasks",
        "byBoard",
        boardId,
        viewerIdentityKey,
        viewerIdentityId,
        context.getPluginState<PermissionsState>("permissions"),
      );
    },
    byColumn(boardId: string, columnId: string) {
      const { viewerIdentityKey, viewerIdentityId } = resolveViewerIdentity(context.activeIdentity());
      return context.select<TaskRecord[]>(
        "tasks",
        "byColumn",
        boardId,
        columnId,
        viewerIdentityKey,
        viewerIdentityId,
        context.getPluginState<PermissionsState>("permissions"),
      );
    },
    publicLists() {
      return context.select<TaskListRecord[]>("tasks", "publicLists");
    },
    permissionLists() {
      const { viewerIdentityKey, viewerIdentityId } = resolveViewerIdentity(context.activeIdentity());
      return context.select<PermissionRecord[]>(
        "permissions",
        "all",
        viewerIdentityKey,
        viewerIdentityId,
      );
    },
    boardColumns(boardId?: string) {
      const resolvedBoardId = boardId ?? context.select<string>("tasks", "defaultBoardId");
      return context.select<TaskBoardColumnRecord[]>("tasks", "boardColumns", resolvedBoardId);
    },
    boards() {
      return context.select<TaskBoardRecord[]>("tasks", "boards");
    },
    defaultBoardId() {
      return context.select<string>("tasks", "defaultBoardId");
    },
  };
}

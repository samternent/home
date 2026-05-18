import type { ConcordReplayPlugin } from "@ternent/concord";
import { deriveAgeRecipient } from "@ternent/identity";
import type { LedgerAppendInput, LedgerReplayEntry } from "@ternent/ledger";
import type { AppProjectionPlugin } from "@/app/runtime";
import {
  identityKeyToPublicKeyBytes,
  isIdentityKeyFormat,
  toDidKeyFromPublicKey,
  toLegacyAuthorDidFromIdentityKey,
  validateIdentityKey,
} from "./identityKey";
import type { PermissionsState } from "./permissions";
import type { UsersState } from "./users";

export type TaskAudienceType = "everyone" | "user" | "permission";

export type TaskAudiencePayload = {
  audienceType: TaskAudienceType;
  audienceId: string | null;
  keyRef: string | null;
  cipher: string | null;
  keyMissing: boolean;
};

export type TaskBoardRecord = {
  id: string;
  title: string;
  isDefault: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type TaskBoardColumnRecord = {
  id: string;
  boardId: string;
  title: string;
  order: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type TaskListRecord = {
  id: string;
  title: string;
  isPublic: true;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type TaskRecord = {
  id: string;
  title: string;
  titleCipher: string | null;
  boardId: string;
  columnId: string;
  taskListId: string | null;
  permissionId: string | null;
  assigneeIdentityKey: string | null;
  audienceType: TaskAudienceType;
  audienceId: string | null;
  cipher: string | null;
  keyRef: string | null;
  keyMissing: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type TasksState = {
  boardsById: Record<string, TaskBoardRecord>;
  boardOrder: string[];
  columnsById: Record<string, TaskBoardColumnRecord>;
  columnOrderByBoardId: Record<string, string[]>;
  listsById: Record<string, TaskListRecord>;
  listOrder: string[];
  byId: Record<string, TaskRecord>;
  order: string[];
};

export type TaskCreateInput = {
  title: string;
  taskListId?: string | null;
  permissionId?: string | null;
  assigneeIdentityKey?: string | null;
  audienceType?: TaskAudienceType;
  audienceId?: string | null;
  actorIdentityKey: string;
};

export type TaskRenameInput = {
  taskId: string;
  title: string;
  actorIdentityKey: string;
};

export type TaskMoveInput = {
  taskId: string;
  columnId: string;
  actorIdentityKey: string;
};

export type TaskAssignInput = {
  taskId: string;
  assigneeIdentityKey?: string | null;
  actorIdentityKey: string;
};

export type TaskArchiveInput = {
  taskId: string;
  actorIdentityKey: string;
};

export type TaskListCreateInput = {
  title: string;
  actorIdentityKey: string;
};

type TaskCreatePayload = {
  taskId: string;
  title: string;
  boardId: string;
  columnId: string;
  taskListId: string | null;
  permissionId: string | null;
  assigneeIdentityKey: string | null;
  audienceType: TaskAudienceType;
  audienceId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

type TaskRenamePayload = {
  taskId: string;
  title: string;
  updatedAt: string;
  updatedBy: string;
};

type TaskMovePayload = {
  taskId: string;
  columnId: string;
  updatedAt: string;
  updatedBy: string;
};

type TaskAssignPayload = {
  taskId: string;
  assigneeIdentityKey: string | null;
  updatedAt: string;
  updatedBy: string;
};

type TaskArchivePayload = {
  taskId: string;
  archivedAt: string;
  archivedBy: string;
  updatedAt: string;
  updatedBy: string;
};

type TaskListCreatePayload = {
  listId: string;
  title: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

const DEFAULT_TASK_BOARD_ID = "task-board:default";
const DEFAULT_TASK_COLUMN_TODO_ID = "task-column:todo";
const DEFAULT_TASK_COLUMN_DOING_ID = "task-column:doing";
const DEFAULT_TASK_COLUMN_DONE_ID = "task-column:done";

function normalizeRequiredText(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} is required.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function normalizeOptionalText(value: unknown, label: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  const normalized = value.trim();
  return normalized || null;
}

function readOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized || null;
}

function normalizeAudienceType(value: unknown): TaskAudienceType {
  if (value === "everyone" || value === "user" || value === "permission") {
    return value;
  }

  throw new Error("Audience type must be everyone, user, or permission.");
}

function createRandomSuffix(): string {
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(10);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  return `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

function createTaskId(nowIso: string): string {
  const timestamp = nowIso.replace(/[^0-9]/g, "").slice(0, 14) || "0";
  return `task:${timestamp}:${createRandomSuffix()}`;
}

function createTaskListId(nowIso: string): string {
  const timestamp = nowIso.replace(/[^0-9]/g, "").slice(0, 14) || "0";
  return `task-list:${timestamp}:${createRandomSuffix()}`;
}

function resolveRuntimeActorCandidates(identity: { publicKey: string; keyId: string }): Set<string> {
  const identityKey = toDidKeyFromPublicKey(identity.publicKey);
  return new Set([identityKey, identity.keyId, `did:key:${identity.keyId}`]);
}

function normalizeAuthorCandidateFromActorIdentityKey(actorIdentityKey: string): string {
  return actorIdentityKey.startsWith("did:key:")
    ? actorIdentityKey
    : `did:key:${actorIdentityKey}`;
}

async function resolveActorAuthorCandidates(actorIdentityKey: string): Promise<Set<string>> {
  const candidates = new Set<string>([
    normalizeAuthorCandidateFromActorIdentityKey(actorIdentityKey),
    actorIdentityKey,
  ]);

  if (isIdentityKeyFormat(actorIdentityKey)) {
    try {
      candidates.add(await toLegacyAuthorDidFromIdentityKey(actorIdentityKey));
    } catch {
      // Ignore malformed identity keys during replay hardening.
    }
  }

  return candidates;
}

function resolveViewerCandidates(viewerIdentityKey: unknown, viewerIdentityId: unknown): Set<string> {
  const candidates = new Set<string>();

  if (typeof viewerIdentityKey === "string" && viewerIdentityKey.trim()) {
    candidates.add(viewerIdentityKey.trim());
  }

  if (typeof viewerIdentityId === "string" && viewerIdentityId.trim()) {
    const identityId = viewerIdentityId.trim();
    candidates.add(identityId);
    candidates.add(`did:key:${identityId}`);
  }

  return candidates;
}

function defaultBoard(nowIso: string): TaskBoardRecord {
  return {
    id: DEFAULT_TASK_BOARD_ID,
    title: "Tasks",
    isDefault: true,
    createdAt: nowIso,
    createdBy: "system",
    updatedAt: nowIso,
    updatedBy: "system",
  };
}

function defaultColumns(nowIso: string): TaskBoardColumnRecord[] {
  return [
    {
      id: DEFAULT_TASK_COLUMN_TODO_ID,
      boardId: DEFAULT_TASK_BOARD_ID,
      title: "Todo",
      order: 0,
      createdAt: nowIso,
      createdBy: "system",
      updatedAt: nowIso,
      updatedBy: "system",
    },
    {
      id: DEFAULT_TASK_COLUMN_DOING_ID,
      boardId: DEFAULT_TASK_BOARD_ID,
      title: "Doing",
      order: 1,
      createdAt: nowIso,
      createdBy: "system",
      updatedAt: nowIso,
      updatedBy: "system",
    },
    {
      id: DEFAULT_TASK_COLUMN_DONE_ID,
      boardId: DEFAULT_TASK_BOARD_ID,
      title: "Done",
      order: 2,
      createdAt: nowIso,
      createdBy: "system",
      updatedAt: nowIso,
      updatedBy: "system",
    },
  ];
}

function initialTasksState(): TasksState {
  const nowIso = "2026-01-01T00:00:00.000Z";
  const board = defaultBoard(nowIso);
  const columns = defaultColumns(nowIso);

  return {
    boardsById: {
      [board.id]: board,
    },
    boardOrder: [board.id],
    columnsById: Object.fromEntries(columns.map((column) => [column.id, column])),
    columnOrderByBoardId: {
      [board.id]: columns.map((column) => column.id),
    },
    listsById: {},
    listOrder: [],
    byId: {},
    order: [],
  };
}

function getEntryPayload(entry: LedgerReplayEntry): unknown {
  if (entry.payload.type === "plain" || entry.payload.type === "decrypted") {
    return entry.payload.data;
  }

  return null;
}

function cloneBoardRecord(record: TaskBoardRecord): TaskBoardRecord {
  return {
    ...record,
  };
}

function cloneColumnRecord(record: TaskBoardColumnRecord): TaskBoardColumnRecord {
  return {
    ...record,
  };
}

function cloneTaskListRecord(record: TaskListRecord): TaskListRecord {
  return {
    ...record,
  };
}

function cloneTaskRecord(record: TaskRecord): TaskRecord {
  return {
    ...record,
  };
}

function cloneTasksState(state: TasksState): TasksState {
  return {
    boardsById: Object.fromEntries(
      Object.entries(state.boardsById).map(([boardId, record]) => [boardId, cloneBoardRecord(record)]),
    ),
    boardOrder: [...state.boardOrder],
    columnsById: Object.fromEntries(
      Object.entries(state.columnsById).map(([columnId, record]) => [columnId, cloneColumnRecord(record)]),
    ),
    columnOrderByBoardId: Object.fromEntries(
      Object.entries(state.columnOrderByBoardId).map(([boardId, columnIds]) => [boardId, [...columnIds]]),
    ),
    listsById: Object.fromEntries(
      Object.entries(state.listsById).map(([listId, record]) => [listId, cloneTaskListRecord(record)]),
    ),
    listOrder: [...state.listOrder],
    byId: Object.fromEntries(
      Object.entries(state.byId).map(([taskId, record]) => [taskId, cloneTaskRecord(record)]),
    ),
    order: [...state.order],
  };
}

async function parseTaskCreateInput(inputValue: unknown): Promise<TaskCreateInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Task create input is required.");
  }

  const input = inputValue as Record<string, unknown>;
  const actorIdentityKey = await validateIdentityKey(
    normalizeRequiredText(input.actorIdentityKey, "Actor identity key"),
  );

  const audienceType =
    input.audienceType === undefined || input.audienceType === null
      ? "user"
      : normalizeAudienceType(input.audienceType);

  const audienceIdRaw = normalizeOptionalText(input.audienceId, "Audience id");
  let audienceId = audienceIdRaw;

  if (audienceType === "user") {
    audienceId = await validateIdentityKey(audienceIdRaw ?? actorIdentityKey);
  }

  if (audienceType === "permission" && !audienceId) {
    throw new Error("Permission audience requires audience id.");
  }

  const assigneeRaw = normalizeOptionalText(input.assigneeIdentityKey, "Assignee identity key");
  const assigneeIdentityKey = assigneeRaw ? await validateIdentityKey(assigneeRaw) : null;

  const taskListId = normalizeOptionalText(input.taskListId, "Task list id");
  let permissionId = normalizeOptionalText(input.permissionId, "Permission id");

  if (audienceType === "permission") {
    permissionId = permissionId ?? audienceId;
  }

  if (taskListId && permissionId) {
    throw new Error("Task can target either a public list or a permission list, not both.");
  }

  if (permissionId && audienceType !== "permission") {
    throw new Error("Permission-scoped tasks must use permission audience.");
  }

  if (audienceType === "permission" && !permissionId) {
    throw new Error("Permission-scoped tasks must include permission id.");
  }

  return {
    title: normalizeRequiredText(input.title, "Task title"),
    taskListId,
    permissionId,
    assigneeIdentityKey,
    audienceType,
    audienceId,
    actorIdentityKey,
  };
}

async function parseTaskRenameInput(inputValue: unknown): Promise<TaskRenameInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Task rename input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    taskId: normalizeRequiredText(input.taskId, "Task id"),
    title: normalizeRequiredText(input.title, "Task title"),
    actorIdentityKey: await validateIdentityKey(
      normalizeRequiredText(input.actorIdentityKey, "Actor identity key"),
    ),
  };
}

async function parseTaskMoveInput(inputValue: unknown): Promise<TaskMoveInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Task move input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    taskId: normalizeRequiredText(input.taskId, "Task id"),
    columnId: normalizeRequiredText(input.columnId, "Column id"),
    actorIdentityKey: await validateIdentityKey(
      normalizeRequiredText(input.actorIdentityKey, "Actor identity key"),
    ),
  };
}

async function parseTaskAssignInput(inputValue: unknown): Promise<TaskAssignInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Task assign input is required.");
  }

  const input = inputValue as Record<string, unknown>;
  const assigneeRaw = normalizeOptionalText(input.assigneeIdentityKey, "Assignee identity key");

  return {
    taskId: normalizeRequiredText(input.taskId, "Task id"),
    assigneeIdentityKey: assigneeRaw ? await validateIdentityKey(assigneeRaw) : null,
    actorIdentityKey: await validateIdentityKey(
      normalizeRequiredText(input.actorIdentityKey, "Actor identity key"),
    ),
  };
}

async function parseTaskArchiveInput(inputValue: unknown): Promise<TaskArchiveInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Task archive input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    taskId: normalizeRequiredText(input.taskId, "Task id"),
    actorIdentityKey: await validateIdentityKey(
      normalizeRequiredText(input.actorIdentityKey, "Actor identity key"),
    ),
  };
}

async function parseTaskListCreateInput(inputValue: unknown): Promise<TaskListCreateInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Task list create input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    title: normalizeRequiredText(input.title, "Task list title"),
    actorIdentityKey: await validateIdentityKey(
      normalizeRequiredText(input.actorIdentityKey, "Actor identity key"),
    ),
  };
}

function resolveTaskPermissionId(task: TaskRecord): string | null {
  return task.permissionId ?? task.audienceId;
}

function hasPermissionGrant(
  permissionsState: PermissionsState,
  permissionId: string,
  identityKey: string,
): boolean {
  return Boolean(permissionsState.latestGrantIdByPermissionAndIdentity[permissionId]?.[identityKey]);
}

function taskMutationsAllowed(
  task: TaskRecord,
  actorIdentityKey: string,
  permissionsState: PermissionsState,
): boolean {
  if (task.audienceType === "everyone") {
    return true;
  }

  if (task.audienceType === "user") {
    return task.audienceId === actorIdentityKey;
  }

  const permissionId = resolveTaskPermissionId(task);
  if (!permissionId) {
    return false;
  }

  return hasPermissionGrant(permissionsState, permissionId, actorIdentityKey);
}

function validateAssigneeAccess(
  permissionsState: PermissionsState,
  audience: TaskAudiencePayload,
  assigneeIdentityKey: string | null,
): void {
  if (!assigneeIdentityKey) {
    return;
  }

  if (audience.audienceType === "user" && audience.audienceId !== assigneeIdentityKey) {
    throw new Error("Assignee does not have audience access.");
  }

  if (audience.audienceType === "permission") {
    const permissionId = audience.audienceId;
    if (!permissionId) {
      throw new Error("Permission audience id is required.");
    }

    if (!hasPermissionGrant(permissionsState, permissionId, assigneeIdentityKey)) {
      throw new Error("Assignee does not have audience access.");
    }
  }
}

async function deriveAgeRecipientFromIdentityKey(identityKey: string): Promise<string> {
  const publicKeyBytes = identityKeyToPublicKeyBytes(identityKey);
  return await deriveAgeRecipient(publicKeyBytes);
}

async function resolveIdentityRecipients(identityKeys: string[]): Promise<string[]> {
  const recipients = new Set<string>();

  for (const identityKey of identityKeys) {
    recipients.add(await deriveAgeRecipientFromIdentityKey(identityKey));
  }

  return [...recipients];
}

async function resolvePermissionAudienceRecipients(
  permissionId: string,
  permissionsState: PermissionsState,
): Promise<string[]> {
  const permission = permissionsState.byId[permissionId];
  if (!permission) {
    throw new Error("Permission does not exist.");
  }

  const memberIdentityKeys = permission.members
    .map((member) => member.memberId)
    .filter((identityKey) => hasPermissionGrant(permissionsState, permissionId, identityKey));

  if (memberIdentityKeys.length === 0) {
    throw new Error("Permission does not have readable members.");
  }

  return await resolveIdentityRecipients(memberIdentityKeys);
}

async function resolveAudienceProtection(
  audienceType: TaskAudienceType,
  audienceId: string | null,
  permissionsState: PermissionsState,
): Promise<LedgerAppendInput["protection"]> {
  if (audienceType === "everyone") {
    return {
      type: "none",
    };
  }

  if (audienceType === "user") {
    if (!audienceId) {
      throw new Error("User audience id is required.");
    }

    const recipients = await resolveIdentityRecipients([audienceId]);
    return {
      type: "recipients",
      recipients,
      encoding: "armor",
    };
  }

  if (!audienceId) {
    throw new Error("Permission audience id is required.");
  }

  const recipients = await resolvePermissionAudienceRecipients(audienceId, permissionsState);
  return {
    type: "recipients",
    recipients,
    encoding: "armor",
  };
}

function materializeTaskForViewer(
  task: TaskRecord,
  viewerCandidates: Set<string>,
  permissionsState: PermissionsState | null,
): TaskRecord | null {
  if (task.archivedAt) {
    return null;
  }

  if (task.audienceType === "everyone") {
    return cloneTaskRecord(task);
  }

  if (task.audienceType === "user") {
    if (viewerCandidates.size === 0 || !task.audienceId || !viewerCandidates.has(task.audienceId)) {
      return null;
    }
    return cloneTaskRecord(task);
  }

  const permissionId = resolveTaskPermissionId(task);
  if (!permissionId || !permissionsState) {
    return null;
  }

  const permission = permissionsState.byId[permissionId];
  if (!permission) {
    return null;
  }

  const viewerIsMember = permission.members.some((member) => viewerCandidates.has(member.memberId));
  if (!viewerIsMember) {
    return null;
  }

  return cloneTaskRecord(task);
}

function applyTaskRename(state: TasksState, payloadValue: unknown): TasksState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as TaskRenamePayload;
  const existing = state.byId[payload.taskId];
  if (!existing || existing.archivedAt) {
    return state;
  }

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.taskId]: {
        ...existing,
        title: payload.title,
        updatedAt: payload.updatedAt,
        updatedBy: payload.updatedBy,
      },
    },
  };
}

function applyTaskMove(state: TasksState, payloadValue: unknown): TasksState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as TaskMovePayload;
  const existing = state.byId[payload.taskId];
  if (!existing || existing.archivedAt) {
    return state;
  }

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.taskId]: {
        ...existing,
        columnId: payload.columnId,
        updatedAt: payload.updatedAt,
        updatedBy: payload.updatedBy,
      },
    },
  };
}

function applyTaskAssign(state: TasksState, payloadValue: unknown): TasksState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as TaskAssignPayload;
  const existing = state.byId[payload.taskId];
  if (!existing || existing.archivedAt) {
    return state;
  }

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.taskId]: {
        ...existing,
        assigneeIdentityKey: payload.assigneeIdentityKey,
        updatedAt: payload.updatedAt,
        updatedBy: payload.updatedBy,
      },
    },
  };
}

function applyTaskArchive(state: TasksState, payloadValue: unknown): TasksState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as TaskArchivePayload;
  const existing = state.byId[payload.taskId];
  if (!existing || existing.archivedAt) {
    return state;
  }

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.taskId]: {
        ...existing,
        archivedAt: payload.archivedAt,
        archivedBy: payload.archivedBy,
        updatedAt: payload.updatedAt,
        updatedBy: payload.updatedBy,
      },
    },
  };
}

function applyTaskListCreate(state: TasksState, payloadValue: unknown): TasksState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as TaskListCreatePayload;
  if (state.listsById[payload.listId]) {
    return state;
  }

  const record: TaskListRecord = {
    id: payload.listId,
    title: payload.title,
    isPublic: true,
    createdAt: payload.createdAt,
    createdBy: payload.createdBy,
    updatedAt: payload.updatedAt,
    updatedBy: payload.updatedBy,
  };

  return {
    ...state,
    listsById: {
      ...state.listsById,
      [record.id]: record,
    },
    listOrder: [...state.listOrder, record.id],
  };
}

function applyTaskCreate(state: TasksState, payloadValue: unknown): TasksState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as TaskCreatePayload;
  if (state.byId[payload.taskId]) {
    return state;
  }

  const nextTask: TaskRecord = {
    id: payload.taskId,
    title: payload.title,
    titleCipher: null,
    boardId: payload.boardId,
    columnId: payload.columnId,
    taskListId: payload.taskListId,
    permissionId: payload.permissionId,
    assigneeIdentityKey: payload.assigneeIdentityKey,
    audienceType: payload.audienceType,
    audienceId: payload.audienceId,
    keyRef: payload.audienceId,
    cipher: null,
    keyMissing: false,
    createdAt: payload.createdAt,
    createdBy: payload.createdBy,
    updatedAt: payload.updatedAt,
    updatedBy: payload.updatedBy,
    archivedAt: null,
    archivedBy: null,
  };

  return {
    ...state,
    byId: {
      ...state.byId,
      [nextTask.id]: nextTask,
    },
    order: [...state.order, nextTask.id],
  };
}

/**
 * Creates the local tasks replay plugin and selectors for v2.
 */
export function createTasksPlugin(): AppProjectionPlugin<TasksState> {
  const plugin: ConcordReplayPlugin<TasksState> = {
    id: "tasks",
    initialState: initialTasksState,
    commands: {
      "task.create": async (ctx, inputValue) => {
        const input = await parseTaskCreateInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actorIdentityKey)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const tasksState = ctx.getReplayState<TasksState>("tasks");
        const permissionsState = ctx.getReplayState<PermissionsState>("permissions");
        const usersState = ctx.getReplayState<UsersState>("users");

        const boardId = DEFAULT_TASK_BOARD_ID;
        const board = tasksState.boardsById[boardId];
        if (!board) {
          throw new Error("Board does not exist.");
        }

        const columnId = DEFAULT_TASK_COLUMN_TODO_ID;
        const column = tasksState.columnsById[columnId];
        if (!column || column.boardId !== boardId) {
          throw new Error("Board column does not exist.");
        }

        if (input.taskListId && !tasksState.listsById[input.taskListId]) {
          throw new Error("Task list does not exist.");
        }

        if (input.permissionId) {
          const permission = permissionsState.byId[input.permissionId];
          if (!permission) {
            throw new Error("Permission does not exist.");
          }

          if (!hasPermissionGrant(permissionsState, input.permissionId, input.actorIdentityKey)) {
            throw new Error("Actor does not have permission access.");
          }
        }

        if (input.assigneeIdentityKey && !usersState.byKey[input.assigneeIdentityKey]) {
          throw new Error("Assignee does not exist in users projection.");
        }

        const audience: TaskAudiencePayload = {
          audienceType: input.audienceType ?? "user",
          audienceId:
            input.audienceType === "permission"
              ? input.permissionId ?? input.audienceId ?? null
              : input.audienceType === "user"
                ? input.audienceId ?? input.actorIdentityKey
                : null,
          keyRef: input.audienceId ?? null,
          cipher: null,
          keyMissing: false,
        };

        if (audience.audienceType === "permission" && !audience.audienceId) {
          throw new Error("Permission audience requires permission id.");
        }

        if (audience.audienceType === "user" && !audience.audienceId) {
          throw new Error("User audience requires audience id.");
        }

        validateAssigneeAccess(permissionsState, audience, input.assigneeIdentityKey ?? null);

        const now = ctx.now();
        const taskId = createTaskId(now);

        if (tasksState.byId[taskId]) {
          throw new Error("Task already exists.");
        }

        const protection = await resolveAudienceProtection(
          audience.audienceType,
          audience.audienceId,
          permissionsState,
        );

        return {
          kind: "task.create",
          payload: {
            taskId,
            title: input.title,
            boardId,
            columnId,
            taskListId: input.taskListId ?? null,
            permissionId: input.permissionId ?? null,
            assigneeIdentityKey: input.assigneeIdentityKey ?? null,
            audienceType: audience.audienceType,
            audienceId: audience.audienceId,
            createdAt: now,
            createdBy: input.actorIdentityKey,
            updatedAt: now,
            updatedBy: input.actorIdentityKey,
          } satisfies TaskCreatePayload,
          protection,
        };
      },
      "task.rename": async (ctx, inputValue) => {
        const input = await parseTaskRenameInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actorIdentityKey)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const tasksState = ctx.getReplayState<TasksState>("tasks");
        const permissionsState = ctx.getReplayState<PermissionsState>("permissions");
        const task = tasksState.byId[input.taskId];
        if (!task || task.archivedAt) {
          throw new Error("Task does not exist.");
        }

        if (!taskMutationsAllowed(task, input.actorIdentityKey, permissionsState)) {
          throw new Error("Actor does not have access to mutate this task.");
        }

        const protection = await resolveAudienceProtection(
          task.audienceType,
          task.audienceId,
          permissionsState,
        );

        return {
          kind: "task.rename",
          payload: {
            taskId: input.taskId,
            title: input.title,
            updatedAt: ctx.now(),
            updatedBy: input.actorIdentityKey,
          } satisfies TaskRenamePayload,
          protection,
        };
      },
      "task.move": async (ctx, inputValue) => {
        const input = await parseTaskMoveInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actorIdentityKey)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const tasksState = ctx.getReplayState<TasksState>("tasks");
        const permissionsState = ctx.getReplayState<PermissionsState>("permissions");
        const task = tasksState.byId[input.taskId];
        if (!task || task.archivedAt) {
          throw new Error("Task does not exist.");
        }

        const column = tasksState.columnsById[input.columnId];
        if (!column || column.boardId !== task.boardId) {
          throw new Error("Board column does not exist.");
        }

        if (!taskMutationsAllowed(task, input.actorIdentityKey, permissionsState)) {
          throw new Error("Actor does not have access to mutate this task.");
        }

        const protection = await resolveAudienceProtection(
          task.audienceType,
          task.audienceId,
          permissionsState,
        );

        return {
          kind: "task.move",
          payload: {
            taskId: input.taskId,
            columnId: input.columnId,
            updatedAt: ctx.now(),
            updatedBy: input.actorIdentityKey,
          } satisfies TaskMovePayload,
          protection,
        };
      },
      "task.assign": async (ctx, inputValue) => {
        const input = await parseTaskAssignInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actorIdentityKey)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const tasksState = ctx.getReplayState<TasksState>("tasks");
        const permissionsState = ctx.getReplayState<PermissionsState>("permissions");
        const usersState = ctx.getReplayState<UsersState>("users");
        const task = tasksState.byId[input.taskId];
        if (!task || task.archivedAt) {
          throw new Error("Task does not exist.");
        }

        if (!taskMutationsAllowed(task, input.actorIdentityKey, permissionsState)) {
          throw new Error("Actor does not have access to mutate this task.");
        }

        if (input.assigneeIdentityKey && !usersState.byKey[input.assigneeIdentityKey]) {
          throw new Error("Assignee does not exist in users projection.");
        }

        validateAssigneeAccess(
          permissionsState,
          {
            audienceType: task.audienceType,
            audienceId: task.audienceId,
            keyRef: task.keyRef,
            cipher: null,
            keyMissing: false,
          },
          input.assigneeIdentityKey ?? null,
        );

        const protection = await resolveAudienceProtection(
          task.audienceType,
          task.audienceId,
          permissionsState,
        );

        return {
          kind: "task.assign",
          payload: {
            taskId: input.taskId,
            assigneeIdentityKey: input.assigneeIdentityKey ?? null,
            updatedAt: ctx.now(),
            updatedBy: input.actorIdentityKey,
          } satisfies TaskAssignPayload,
          protection,
        };
      },
      "task.archive": async (ctx, inputValue) => {
        const input = await parseTaskArchiveInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actorIdentityKey)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const tasksState = ctx.getReplayState<TasksState>("tasks");
        const permissionsState = ctx.getReplayState<PermissionsState>("permissions");
        const task = tasksState.byId[input.taskId];
        if (!task || task.archivedAt) {
          throw new Error("Task does not exist.");
        }

        if (!taskMutationsAllowed(task, input.actorIdentityKey, permissionsState)) {
          throw new Error("Actor does not have access to mutate this task.");
        }

        const now = ctx.now();

        const protection = await resolveAudienceProtection(
          task.audienceType,
          task.audienceId,
          permissionsState,
        );

        return {
          kind: "task.archive",
          payload: {
            taskId: input.taskId,
            archivedAt: now,
            archivedBy: input.actorIdentityKey,
            updatedAt: now,
            updatedBy: input.actorIdentityKey,
          } satisfies TaskArchivePayload,
          protection,
        };
      },
      "task.list.create": async (ctx, inputValue) => {
        const input = await parseTaskListCreateInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actorIdentityKey)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const now = ctx.now();
        const listId = createTaskListId(now);
        const tasksState = ctx.getReplayState<TasksState>("tasks");

        if (tasksState.listsById[listId]) {
          throw new Error("Task list already exists.");
        }

        return {
          kind: "task.list.create",
          payload: {
            listId,
            title: input.title,
            createdAt: now,
            createdBy: input.actorIdentityKey,
            updatedAt: now,
            updatedBy: input.actorIdentityKey,
          } satisfies TaskListCreatePayload,
        };
      },
    },
    async applyEntry(entry, ctx) {
      const state = cloneTasksState(ctx.getState());
      const payload = getEntryPayload(entry);

      if (entry.kind === "task.create") {
        const actorIdentityKey =
          payload && typeof payload === "object"
            ? readOptionalText((payload as Record<string, unknown>).createdBy)
            : null;

        if (!actorIdentityKey) {
          return;
        }

        const authorCandidates = await resolveActorAuthorCandidates(actorIdentityKey);
        if (!authorCandidates.has(entry.author)) {
          return;
        }

        ctx.setState(applyTaskCreate(state, payload));
        return;
      }

      if (entry.kind === "task.rename") {
        const actorIdentityKey =
          payload && typeof payload === "object"
            ? readOptionalText((payload as Record<string, unknown>).updatedBy)
            : null;

        if (!actorIdentityKey) {
          return;
        }

        const authorCandidates = await resolveActorAuthorCandidates(actorIdentityKey);
        if (!authorCandidates.has(entry.author)) {
          return;
        }

        ctx.setState(applyTaskRename(state, payload));
        return;
      }

      if (entry.kind === "task.move") {
        const actorIdentityKey =
          payload && typeof payload === "object"
            ? readOptionalText((payload as Record<string, unknown>).updatedBy)
            : null;

        if (!actorIdentityKey) {
          return;
        }

        const authorCandidates = await resolveActorAuthorCandidates(actorIdentityKey);
        if (!authorCandidates.has(entry.author)) {
          return;
        }

        ctx.setState(applyTaskMove(state, payload));
        return;
      }

      if (entry.kind === "task.assign") {
        const actorIdentityKey =
          payload && typeof payload === "object"
            ? readOptionalText((payload as Record<string, unknown>).updatedBy)
            : null;

        if (!actorIdentityKey) {
          return;
        }

        const authorCandidates = await resolveActorAuthorCandidates(actorIdentityKey);
        if (!authorCandidates.has(entry.author)) {
          return;
        }

        ctx.setState(applyTaskAssign(state, payload));
        return;
      }

      if (entry.kind === "task.archive") {
        const actorIdentityKey =
          payload && typeof payload === "object"
            ? readOptionalText((payload as Record<string, unknown>).updatedBy)
            : null;

        if (!actorIdentityKey) {
          return;
        }

        const authorCandidates = await resolveActorAuthorCandidates(actorIdentityKey);
        if (!authorCandidates.has(entry.author)) {
          return;
        }

        ctx.setState(applyTaskArchive(state, payload));
        return;
      }

      if (entry.kind === "task.list.create") {
        const actorIdentityKey =
          payload && typeof payload === "object"
            ? readOptionalText((payload as Record<string, unknown>).createdBy)
            : null;

        if (!actorIdentityKey) {
          return;
        }

        const authorCandidates = await resolveActorAuthorCandidates(actorIdentityKey);
        if (!authorCandidates.has(entry.author)) {
          return;
        }

        ctx.setState(applyTaskListCreate(state, payload));
      }
    },
  };

  return {
    plugin,
    selectors: {
      all(state, viewerIdentityKey: unknown, viewerIdentityId: unknown, permissionsState: unknown) {
        const viewerCandidates = resolveViewerCandidates(viewerIdentityKey, viewerIdentityId);
        const resolvedPermissions =
          permissionsState && typeof permissionsState === "object"
            ? (permissionsState as PermissionsState)
            : null;

        return state.order
          .map((taskId) => state.byId[taskId])
          .filter((record): record is TaskRecord => Boolean(record))
          .map((record) => materializeTaskForViewer(record, viewerCandidates, resolvedPermissions))
          .filter((record): record is TaskRecord => Boolean(record));
      },
      byId(
        state,
        taskId: unknown,
        viewerIdentityKey: unknown,
        viewerIdentityId: unknown,
        permissionsState: unknown,
      ) {
        if (typeof taskId !== "string") {
          return null;
        }

        const task = state.byId[taskId] ?? null;
        if (!task) {
          return null;
        }

        const viewerCandidates = resolveViewerCandidates(viewerIdentityKey, viewerIdentityId);
        const resolvedPermissions =
          permissionsState && typeof permissionsState === "object"
            ? (permissionsState as PermissionsState)
            : null;

        return materializeTaskForViewer(task, viewerCandidates, resolvedPermissions);
      },
      byBoard(
        state,
        boardId: unknown,
        viewerIdentityKey: unknown,
        viewerIdentityId: unknown,
        permissionsState: unknown,
      ) {
        if (typeof boardId !== "string") {
          return [];
        }

        const viewerCandidates = resolveViewerCandidates(viewerIdentityKey, viewerIdentityId);
        const resolvedPermissions =
          permissionsState && typeof permissionsState === "object"
            ? (permissionsState as PermissionsState)
            : null;

        return state.order
          .map((taskId) => state.byId[taskId])
          .filter((record): record is TaskRecord => Boolean(record) && record.boardId === boardId)
          .map((record) => materializeTaskForViewer(record, viewerCandidates, resolvedPermissions))
          .filter((record): record is TaskRecord => Boolean(record));
      },
      byColumn(
        state,
        boardId: unknown,
        columnId: unknown,
        viewerIdentityKey: unknown,
        viewerIdentityId: unknown,
        permissionsState: unknown,
      ) {
        if (typeof boardId !== "string" || typeof columnId !== "string") {
          return [];
        }

        const viewerCandidates = resolveViewerCandidates(viewerIdentityKey, viewerIdentityId);
        const resolvedPermissions =
          permissionsState && typeof permissionsState === "object"
            ? (permissionsState as PermissionsState)
            : null;

        return state.order
          .map((taskId) => state.byId[taskId])
          .filter(
            (record): record is TaskRecord =>
              Boolean(record) && record.boardId === boardId && record.columnId === columnId,
          )
          .map((record) => materializeTaskForViewer(record, viewerCandidates, resolvedPermissions))
          .filter((record): record is TaskRecord => Boolean(record));
      },
      publicLists(state) {
        return state.listOrder
          .map((listId) => state.listsById[listId])
          .filter((record): record is TaskListRecord => Boolean(record))
          .map(cloneTaskListRecord);
      },
      boardColumns(state, boardId: unknown) {
        if (typeof boardId !== "string") {
          return [];
        }

        return (state.columnOrderByBoardId[boardId] ?? [])
          .map((columnId) => state.columnsById[columnId])
          .filter((record): record is TaskBoardColumnRecord => Boolean(record))
          .map(cloneColumnRecord);
      },
      boards(state) {
        return state.boardOrder
          .map((boardId) => state.boardsById[boardId])
          .filter((record): record is TaskBoardRecord => Boolean(record))
          .map(cloneBoardRecord);
      },
      defaultBoardId() {
        return DEFAULT_TASK_BOARD_ID;
      },
    },
  };
}

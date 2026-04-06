import type { ConcordReplayPlugin } from "@ternent/concord";
import type { LedgerReplayEntry } from "@ternent/ledger";
import type { SerializedIdentity } from "@ternent/identity";
import { deriveAgeRecipient } from "@ternent/identity";
import {
  createTaskPermissionKey,
  decryptProtectedTaskPayload,
  encryptProtectedTaskPayload,
  isProtectedTaskPayloadEnvelope,
  unwrapPermissionKey,
  wrapPermissionKeyForRecipient,
} from "./crypto";
import {
  parseTaskCreateInput,
  parseTaskEditInput,
  parseTaskListCreateInput,
  parseTaskListEditInput,
  parseTaskPermissionCreateInput,
  parseTaskPermissionEditInput,
  parseTaskPermissionGrantInput,
  parseTaskSetStatusInput,
  parseTaskUserUpsertInput,
} from "./schemas";
import {
  createEmptyTaskProjection,
  normalizeTaskProjection,
} from "./state";
import type {
  TaskCreateInput,
  TaskEditInput,
  TaskListCreateInput,
  TaskListEditInput,
  TaskPermissionCreateInput,
  TaskPermissionEditInput,
  TaskPermissionGrantInput,
  TaskProjection,
  TaskRecord,
  TaskSetStatusInput,
  TaskUserUpsertInput,
} from "./types";

type TaskPluginOptions = {
  activeIdentity?: SerializedIdentity;
};

const REPLAY_YIELD_INTERVAL = 25;

async function yieldToHost(): Promise<void> {
  if (typeof requestAnimationFrame === "function") {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    return;
  }

  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, 0);
  });
}

function normalizeText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTags(value: string[] | null | undefined): string[] {
  if (!value?.length) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );
}

function createSelfUserId(identityKeyId: string): string {
  return `user:${identityKeyId}`;
}

function normalizeTaskCreateInput(input: unknown): TaskCreateInput {
  const parsed = parseTaskCreateInput(input);
  return {
    taskId: parsed.taskId,
    taskListId: normalizeText(parsed.taskListId),
    title: parsed.title.trim(),
    notes: normalizeText(parsed.notes),
    priority: parsed.priority ?? "normal",
    area: normalizeText(parsed.area),
    assignee: normalizeText(parsed.assignee),
    assigneeId: normalizeText(parsed.assigneeId),
    permissionId: normalizeText(parsed.permissionId),
    tags: normalizeTags(parsed.tags),
    dueAt: normalizeText(parsed.dueAt),
  };
}

function normalizeTaskEditInput(input: unknown): TaskEditInput {
  const parsed = parseTaskEditInput(input);
  const next: TaskEditInput = {
    taskId: parsed.taskId,
  };

  if (parsed.taskListId !== undefined) {
    next.taskListId = normalizeText(parsed.taskListId);
  }
  if (parsed.title !== undefined) {
    next.title = parsed.title.trim();
  }
  if (parsed.notes !== undefined) {
    next.notes = normalizeText(parsed.notes);
  }
  if (parsed.priority !== undefined) {
    next.priority = parsed.priority;
  }
  if (parsed.area !== undefined) {
    next.area = normalizeText(parsed.area);
  }
  if (parsed.assignee !== undefined) {
    next.assignee = normalizeText(parsed.assignee);
  }
  if (parsed.assigneeId !== undefined) {
    next.assigneeId = normalizeText(parsed.assigneeId);
  }
  if (parsed.permissionId !== undefined) {
    next.permissionId = normalizeText(parsed.permissionId);
  }
  if (parsed.tags !== undefined) {
    next.tags = normalizeTags(parsed.tags);
  }
  if (parsed.dueAt !== undefined) {
    next.dueAt = normalizeText(parsed.dueAt);
  }

  return next;
}

function normalizeTaskSetStatusInput(input: unknown): TaskSetStatusInput {
  return parseTaskSetStatusInput(input);
}

function normalizeTaskListCreateInput(input: unknown): TaskListCreateInput {
  const parsed = parseTaskListCreateInput(input);
  return {
    taskListId: parsed.taskListId,
    title: parsed.title.trim(),
    description: normalizeText(parsed.description),
  };
}

function normalizeTaskListEditInput(input: unknown): TaskListEditInput {
  const parsed = parseTaskListEditInput(input);
  const next: TaskListEditInput = {
    taskListId: parsed.taskListId,
  };

  if (parsed.title !== undefined) {
    next.title = parsed.title.trim();
  }
  if (parsed.description !== undefined) {
    next.description = normalizeText(parsed.description);
  }

  return next;
}

function normalizeTaskUserUpsertInput(input: unknown): TaskUserUpsertInput {
  const parsed = parseTaskUserUpsertInput(input);
  return {
    userId: parsed.userId,
    name: parsed.name.trim(),
    publicIdentityKey: normalizeText(parsed.publicIdentityKey),
    publicEncryptionKey: normalizeText(parsed.publicEncryptionKey),
  };
}

function normalizeTaskPermissionCreateInput(input: unknown): TaskPermissionCreateInput {
  const parsed = parseTaskPermissionCreateInput(input);
  return {
    permissionId: parsed.permissionId,
    title: parsed.title.trim(),
    scope: normalizeText(parsed.scope),
  };
}

function normalizeTaskPermissionEditInput(input: unknown): TaskPermissionEditInput {
  const parsed = parseTaskPermissionEditInput(input);
  const next: TaskPermissionEditInput = {
    permissionId: parsed.permissionId,
  };

  if (parsed.title !== undefined) {
    next.title = parsed.title.trim();
  }
  if (parsed.scope !== undefined) {
    next.scope = normalizeText(parsed.scope);
  }

  return next;
}

function normalizeTaskPermissionGrantInput(input: unknown): TaskPermissionGrantInput {
  return parseTaskPermissionGrantInput(input);
}

function upsertTaskRecord(
  state: TaskProjection,
  nextTask: TaskRecord,
): TaskProjection {
  const exists = Boolean(state.tasksById[nextTask.taskId]);
  return {
    ...state,
    tasksById: {
      ...state.tasksById,
      [nextTask.taskId]: nextTask,
    },
    orderedTaskIds: exists ? state.orderedTaskIds : [...state.orderedTaskIds, nextTask.taskId],
  };
}

function resolveEntryPayload(entry: {
  payload:
    | { type: "plain"; data: unknown }
    | { type: "decrypted"; data: unknown }
    | { type: "encrypted" };
}): unknown | null {
  if (entry.payload.type === "plain" || entry.payload.type === "decrypted") {
    return entry.payload.data;
  }

  return null;
}

async function resolveTaskPayloadData(
  entry: {
    payload:
      | { type: "plain"; data: unknown }
      | { type: "decrypted"; data: unknown }
      | { type: "encrypted" };
  },
  current: TaskProjection,
): Promise<unknown | null> {
  const payloadData = resolveEntryPayload(entry);
  if (!payloadData) {
    return null;
  }

  if (!isProtectedTaskPayloadEnvelope(payloadData)) {
    return payloadData;
  }

  const permissionKey = current.permissionKeysById[payloadData.permissionId];
  if (!permissionKey) {
    return null;
  }

  try {
    return await decryptProtectedTaskPayload({
      permissionKey,
      envelope: payloadData,
    });
  } catch {
    return null;
  }
}

function resolvePermissionKey(
  projection: TaskProjection,
  permissionId: string,
): string {
  const permission = projection.permissionsById[permissionId];
  if (!permission) {
    throw new Error(`Permission not found: ${permissionId}`);
  }

  const permissionKey = projection.permissionKeysById[permissionId];
  if (!permissionKey) {
    throw new Error(`You do not have access to ${permission.title}.`);
  }

  return permissionKey;
}

function normalizePermissionState(state: TaskProjection): TaskProjection {
  return {
    ...state,
    permissionKeysById: { ...state.permissionKeysById },
  };
}

function summarizeDeferredProtectedEntries(
  deferredEntriesByPermissionId: Map<string, LedgerReplayEntry[]>,
) {
  const hiddenProtectedByPermissionId: TaskProjection["hiddenProtectedByPermissionId"] = {};
  let hiddenProtectedTaskCount = 0;
  let hiddenProtectedUpdateCount = 0;

  for (const [permissionId, entries] of deferredEntriesByPermissionId.entries()) {
    let taskCount = 0;
    let updateCount = 0;

    for (const entry of entries) {
      if (entry.kind === "task.item.created") {
        taskCount += 1;
      } else if (
        entry.kind === "task.item.edited"
        || entry.kind === "task.item.status-set"
      ) {
        updateCount += 1;
      }
    }

    if (taskCount === 0 && updateCount === 0) {
      continue;
    }

    hiddenProtectedByPermissionId[permissionId] = {
      taskCount,
      updateCount,
    };
    hiddenProtectedTaskCount += taskCount;
    hiddenProtectedUpdateCount += updateCount;
  }

  return {
    hiddenProtectedByPermissionId,
    hiddenProtectedTaskCount,
    hiddenProtectedUpdateCount,
  };
}

export function taskPlugin(options: TaskPluginOptions = {}): ConcordReplayPlugin<TaskProjection> {
  const activeIdentity = options.activeIdentity;
  const selfUserId = activeIdentity ? createSelfUserId(activeIdentity.keyId) : null;
  const deferredEntriesByPermissionId = new Map<string, LedgerReplayEntry[]>();
  const bufferedStructureEntries: LedgerReplayEntry[] = [];
  const bufferedTaskEntries: LedgerReplayEntry[] = [];

  function resetDeferredEntries() {
    deferredEntriesByPermissionId.clear();
  }

  function resetReplayBuffers() {
    bufferedStructureEntries.length = 0;
    bufferedTaskEntries.length = 0;
  }

  function getProtectedPermissionId(entry: LedgerReplayEntry): string | null {
    const payloadData = resolveEntryPayload(entry);
    if (!isProtectedTaskPayloadEnvelope(payloadData)) {
      return null;
    }

    return payloadData.permissionId;
  }

  function deferProtectedEntry(entry: LedgerReplayEntry) {
    const permissionId = getProtectedPermissionId(entry);
    if (!permissionId) {
      return;
    }

    const queue = deferredEntriesByPermissionId.get(permissionId) ?? [];
    if (!queue.some((candidate) => candidate.entryId === entry.entryId)) {
      queue.push(entry);
      deferredEntriesByPermissionId.set(permissionId, queue);
    }
  }

  function syncHiddenProtectedState(
    ctx: {
      getState(): TaskProjection;
      setState(next: TaskProjection | ((prev: TaskProjection) => TaskProjection)): void;
    },
  ) {
    const current = ctx.getState() as TaskProjection;
    const hiddenSummary = summarizeDeferredProtectedEntries(
      deferredEntriesByPermissionId,
    );

    ctx.setState({
      ...current,
      ...hiddenSummary,
    });
  }

  async function applyTaskEntry(
    entry: LedgerReplayEntry,
    ctx: {
      getState(): TaskProjection;
      setState(next: TaskProjection | ((prev: TaskProjection) => TaskProjection)): void;
    },
  ): Promise<boolean> {
    if (entry.kind === "task.item.created") {
      const current = ctx.getState() as TaskProjection;
      const payloadData = await resolveTaskPayloadData(entry, current);
      if (!payloadData) {
        if (getProtectedPermissionId(entry)) {
          deferProtectedEntry(entry);
          syncHiddenProtectedState(ctx);
        }
        return false;
      }
      const payload = normalizeTaskCreateInput(payloadData);

      ctx.setState(
        upsertTaskRecord(current, {
          taskId: payload.taskId,
          taskListId: payload.taskListId ?? null,
          title: payload.title,
          notes: payload.notes ?? null,
          status: "backlog",
          priority: payload.priority ?? "normal",
          area: payload.area ?? null,
          assignee: payload.assignee ?? null,
          assigneeId: payload.assigneeId ?? null,
          permissionId: payload.permissionId ?? null,
          tags: payload.tags ?? [],
          dueAt: payload.dueAt ?? null,
          createdAt: entry.authoredAt,
          updatedAt: entry.authoredAt,
        }),
      );
      return true;
    }

    if (entry.kind === "task.item.edited") {
      const current = ctx.getState() as TaskProjection;
      const payloadData = await resolveTaskPayloadData(entry, current);
      if (!payloadData) {
        if (getProtectedPermissionId(entry)) {
          deferProtectedEntry(entry);
          syncHiddenProtectedState(ctx);
        }
        return false;
      }
      const payload = normalizeTaskEditInput(payloadData);
      const existing = current.tasksById[payload.taskId];
      if (!existing) {
        return false;
      }

      ctx.setState(
        upsertTaskRecord(current, {
          ...existing,
          taskListId: payload.taskListId !== undefined ? payload.taskListId : existing.taskListId,
          title: payload.title !== undefined ? payload.title : existing.title,
          notes: payload.notes !== undefined ? payload.notes : existing.notes,
          priority: payload.priority !== undefined ? payload.priority : existing.priority,
          area: payload.area !== undefined ? payload.area : existing.area,
          assignee: payload.assignee !== undefined ? payload.assignee : existing.assignee,
          assigneeId: payload.assigneeId !== undefined ? payload.assigneeId : existing.assigneeId,
          permissionId: payload.permissionId !== undefined ? payload.permissionId : existing.permissionId,
          tags: payload.tags !== undefined ? payload.tags : existing.tags,
          dueAt: payload.dueAt !== undefined ? payload.dueAt : existing.dueAt,
          updatedAt: entry.authoredAt,
        }),
      );
      return true;
    }

    if (entry.kind === "task.item.status-set") {
      const current = ctx.getState() as TaskProjection;
      const payloadData = await resolveTaskPayloadData(entry, current);
      if (!payloadData) {
        if (getProtectedPermissionId(entry)) {
          deferProtectedEntry(entry);
          syncHiddenProtectedState(ctx);
        }
        return false;
      }
      const payload = normalizeTaskSetStatusInput(payloadData);
      const existing = current.tasksById[payload.taskId];
      if (!existing) {
        return false;
      }

      ctx.setState(
        upsertTaskRecord(current, {
          ...existing,
          status: payload.status,
          updatedAt: entry.authoredAt,
        }),
      );
      return true;
    }

    return false;
  }

  async function flushDeferredEntriesForPermission(
    permissionId: string,
    ctx: {
      getState(): TaskProjection;
      setState(next: TaskProjection | ((prev: TaskProjection) => TaskProjection)): void;
    },
  ) {
    const queue = deferredEntriesByPermissionId.get(permissionId);
    if (!queue?.length) {
      return;
    }

    deferredEntriesByPermissionId.delete(permissionId);

    for (const deferredEntry of queue) {
      const applied = await applyTaskEntry(deferredEntry, ctx);
      if (!applied && getProtectedPermissionId(deferredEntry) === permissionId) {
        deferProtectedEntry(deferredEntry);
      }
    }

    syncHiddenProtectedState(ctx);
  }

  async function applyStructuralEntry(
    entry: LedgerReplayEntry,
    ctx: {
      getState(): TaskProjection;
      setState(next: TaskProjection | ((prev: TaskProjection) => TaskProjection)): void;
    },
  ): Promise<boolean> {
    if (entry.kind === "task.list.created") {
      if (entry.payload.type !== "plain") {
        return true;
      }
      const payload = normalizeTaskListCreateInput(entry.payload.data);
      const current = ctx.getState() as TaskProjection;
      const exists = Boolean(current.taskListsById[payload.taskListId]);

      ctx.setState({
        ...current,
        taskListsById: {
          ...current.taskListsById,
          [payload.taskListId]: {
            taskListId: payload.taskListId,
            title: payload.title,
            description: payload.description ?? null,
            createdAt: entry.authoredAt,
            updatedAt: entry.authoredAt,
          },
        },
        orderedTaskListIds: exists
          ? current.orderedTaskListIds
          : [...current.orderedTaskListIds, payload.taskListId],
      });
      return true;
    }

    if (entry.kind === "task.list.edited") {
      if (entry.payload.type !== "plain") {
        return true;
      }
      const payload = normalizeTaskListEditInput(entry.payload.data);
      const current = ctx.getState() as TaskProjection;
      const existing = current.taskListsById[payload.taskListId];
      if (!existing) {
        return true;
      }

      ctx.setState({
        ...current,
        taskListsById: {
          ...current.taskListsById,
          [payload.taskListId]: {
            ...existing,
            title: payload.title !== undefined ? payload.title : existing.title,
            description: payload.description !== undefined ? payload.description : existing.description,
            updatedAt: entry.authoredAt,
          },
        },
      });
      return true;
    }

    if (entry.kind === "task.user.upserted") {
      if (entry.payload.type !== "plain") {
        return true;
      }
      const payload = normalizeTaskUserUpsertInput(entry.payload.data);
      const current = ctx.getState() as TaskProjection;
      const existing = current.usersById[payload.userId];
      const exists = Boolean(existing);

      ctx.setState({
        ...current,
        usersById: {
          ...current.usersById,
          [payload.userId]: {
            userId: payload.userId,
            name: payload.name,
            publicIdentityKey: payload.publicIdentityKey ?? null,
            publicEncryptionKey: payload.publicEncryptionKey ?? null,
            createdAt: existing?.createdAt ?? entry.authoredAt,
            updatedAt: entry.authoredAt,
          },
        },
        orderedUserIds: exists ? current.orderedUserIds : [...current.orderedUserIds, payload.userId],
      });
      return true;
    }

    if (entry.kind === "task.permission.created") {
      if (entry.payload.type !== "plain") {
        return true;
      }
      const payload = normalizeTaskPermissionCreateInput(entry.payload.data);
      const current = ctx.getState() as TaskProjection;
      const exists = Boolean(current.permissionsById[payload.permissionId]);

      ctx.setState({
        ...current,
        permissionsById: {
          ...current.permissionsById,
          [payload.permissionId]: {
            permissionId: payload.permissionId,
            title: payload.title,
            scope: payload.scope ?? null,
            createdAt: entry.authoredAt,
            updatedAt: entry.authoredAt,
          },
        },
        orderedPermissionIds: exists
          ? current.orderedPermissionIds
          : [...current.orderedPermissionIds, payload.permissionId],
      });
      return true;
    }

    if (entry.kind === "task.permission.edited") {
      if (entry.payload.type !== "plain") {
        return true;
      }
      const payload = normalizeTaskPermissionEditInput(entry.payload.data);
      const current = ctx.getState() as TaskProjection;
      const existing = current.permissionsById[payload.permissionId];
      if (!existing) {
        return true;
      }

      ctx.setState({
        ...current,
        permissionsById: {
          ...current.permissionsById,
          [payload.permissionId]: {
            ...existing,
            title: payload.title !== undefined ? payload.title : existing.title,
            scope: payload.scope !== undefined ? payload.scope : existing.scope,
            updatedAt: entry.authoredAt,
          },
        },
      });
      return true;
    }

    if (entry.kind === "task.permission-grant.created") {
      if (entry.payload.type !== "plain") {
        return true;
      }
      const payload = entry.payload.data as {
        permissionGrantId: string;
        permissionId: string;
        userId: string;
        wrappedPermissionKey: string;
        keyEncoding: "armor";
      };
      if (
        typeof payload.wrappedPermissionKey !== "string"
        || payload.keyEncoding !== "armor"
      ) {
        return true;
      }
      const normalized = normalizeTaskPermissionGrantInput(payload);
      const current = ctx.getState() as TaskProjection;
      const existing = current.permissionGrantsById[normalized.permissionGrantId];
      const nextState = normalizePermissionState({
        ...current,
        permissionGrantsById: {
          ...current.permissionGrantsById,
          [normalized.permissionGrantId]: {
            permissionGrantId: normalized.permissionGrantId,
            permissionId: normalized.permissionId,
            userId: normalized.userId,
            wrappedPermissionKey: payload.wrappedPermissionKey,
            keyEncoding: payload.keyEncoding,
            createdAt: existing?.createdAt ?? entry.authoredAt,
            updatedAt: entry.authoredAt,
          },
        },
        orderedPermissionGrantIds: existing
          ? current.orderedPermissionGrantIds
          : [...current.orderedPermissionGrantIds, normalized.permissionGrantId],
      });

      if (
        activeIdentity &&
        selfUserId &&
        normalized.userId === selfUserId
      ) {
        try {
          nextState.permissionKeysById[normalized.permissionId] = await unwrapPermissionKey({
            wrappedPermissionKey: payload.wrappedPermissionKey,
            identity: activeIdentity,
          });
        } catch {
          delete nextState.permissionKeysById[normalized.permissionId];
        }
      }

      ctx.setState(nextState);
      await flushDeferredEntriesForPermission(normalized.permissionId, ctx);
      return true;
    }

    return false;
  }

  function isTaskMutationEntry(entry: LedgerReplayEntry): boolean {
    return entry.kind === "task.item.created"
      || entry.kind === "task.item.edited"
      || entry.kind === "task.item.status-set";
  }

  return {
    id: "tasks",
    initialState() {
      return createEmptyTaskProjection();
    },
    reset() {
      resetDeferredEntries();
      resetReplayBuffers();
    },
    beginReplay() {
      resetDeferredEntries();
      resetReplayBuffers();
    },
    commands: {
      "task.create-item": async (ctx, input) => {
        const payload = normalizeTaskCreateInput(input);
        const permissionId = payload.permissionId ?? null;

        if (!permissionId) {
          return {
            kind: "task.item.created",
            payload,
          };
        }

        const projection = ctx.getReplayState<TaskProjection>("tasks");
        return {
          kind: "task.item.created",
          payload: await encryptProtectedTaskPayload({
            permissionId,
            permissionKey: resolvePermissionKey(projection, permissionId),
            payload,
          }),
        };
      },
      "task.edit-item": async (ctx, input) => {
        const payload = normalizeTaskEditInput(input);
        const projection = ctx.getReplayState<TaskProjection>("tasks");
        const existing = projection.tasksById[payload.taskId];
        const permissionId =
          payload.permissionId !== undefined
            ? payload.permissionId
            : existing?.permissionId ?? null;

        if (!permissionId) {
          return {
            kind: "task.item.edited",
            payload,
          };
        }

        return {
          kind: "task.item.edited",
          payload: await encryptProtectedTaskPayload({
            permissionId,
            permissionKey: resolvePermissionKey(projection, permissionId),
            payload,
          }),
        };
      },
      "task.set-status": async (ctx, input) => {
        const payload = normalizeTaskSetStatusInput(input);
        const projection = ctx.getReplayState<TaskProjection>("tasks");
        const existing = projection.tasksById[payload.taskId];
        const permissionId = existing?.permissionId ?? null;

        if (!permissionId) {
          return {
            kind: "task.item.status-set",
            payload,
          };
        }

        return {
          kind: "task.item.status-set",
          payload: await encryptProtectedTaskPayload({
            permissionId,
            permissionKey: resolvePermissionKey(projection, permissionId),
            payload,
          }),
        };
      },
      "tasklist.create-list": async (_ctx, input) => ({
        kind: "task.list.created",
        payload: normalizeTaskListCreateInput(input),
      }),
      "tasklist.edit-list": async (_ctx, input) => ({
        kind: "task.list.edited",
        payload: normalizeTaskListEditInput(input),
      }),
      "taskuser.upsert": async (_ctx, input) => ({
        kind: "task.user.upserted",
        payload: normalizeTaskUserUpsertInput(input),
      }),
      "taskpermission.create-group": async (ctx, input) => {
        const payload = normalizeTaskPermissionCreateInput(input);
        const selfRecipient = await deriveAgeRecipient(ctx.identity);
        const permissionKey = createTaskPermissionKey();

        return [
          {
            kind: "task.permission.created",
            payload,
          },
          {
            kind: "task.permission-grant.created",
            payload: {
              permissionGrantId: `permission-grant:${payload.permissionId}:${ctx.identity.keyId}`,
              permissionId: payload.permissionId,
              userId: createSelfUserId(ctx.identity.keyId),
              wrappedPermissionKey: await wrapPermissionKeyForRecipient({
                permissionKey,
                recipient: selfRecipient,
              }),
              keyEncoding: "armor",
            },
          },
        ];
      },
      "taskpermission.edit-group": async (_ctx, input) => ({
        kind: "task.permission.edited",
        payload: normalizeTaskPermissionEditInput(input),
      }),
      "taskpermission.grant-access": async (ctx, input) => {
        const payload = normalizeTaskPermissionGrantInput(input);
        const projection = ctx.getReplayState<TaskProjection>("tasks");
        const permission = projection.permissionsById[payload.permissionId];
        if (!permission) {
          throw new Error(`Permission not found: ${payload.permissionId}`);
        }

        const permissionKey = resolvePermissionKey(projection, payload.permissionId);
        const targetRecipient = payload.recipient ?? null;

        if (!targetRecipient) {
          throw new Error("The selected identity is not available for this grant.");
        }

        return {
          kind: "task.permission-grant.created",
          payload: {
            permissionGrantId: payload.permissionGrantId,
            permissionId: payload.permissionId,
            userId: payload.userId,
            wrappedPermissionKey: await wrapPermissionKeyForRecipient({
              permissionKey,
              recipient: targetRecipient,
            }),
            keyEncoding: "armor" as const,
          },
        };
      },
    },
    async applyEntry(entry, ctx) {
      if (ctx.replay?.phase === "applyEntry") {
        if (isTaskMutationEntry(entry)) {
          bufferedTaskEntries.push(entry);
        } else {
          bufferedStructureEntries.push(entry);
        }
        return;
      }

      if (await applyTaskEntry(entry, ctx)) {
        return;
      }

      await applyStructuralEntry(entry, ctx);
    },
    async endReplay(ctx) {
      for (let index = 0; index < bufferedStructureEntries.length; index += 1) {
        const entry = bufferedStructureEntries[index]!;
        await applyStructuralEntry(entry, ctx);
        if ((index + 1) % REPLAY_YIELD_INTERVAL === 0) {
          await yieldToHost();
        }
      }
      for (let index = 0; index < bufferedTaskEntries.length; index += 1) {
        const entry = bufferedTaskEntries[index]!;
        await applyTaskEntry(entry, ctx);
        if ((index + 1) % REPLAY_YIELD_INTERVAL === 0) {
          await yieldToHost();
        }
      }
      const permissionIds = [...deferredEntriesByPermissionId.keys()];
      for (let index = 0; index < permissionIds.length; index += 1) {
        const permissionId = permissionIds[index]!;
        await flushDeferredEntriesForPermission(permissionId, ctx);
        if ((index + 1) % REPLAY_YIELD_INTERVAL === 0) {
          await yieldToHost();
        }
      }
      ctx.setState((current) =>
        normalizeTaskProjection(
          normalizePermissionState(current as TaskProjection),
        ),
      );
      syncHiddenProtectedState(ctx);
      resetReplayBuffers();
      resetDeferredEntries();
    },
    destroy() {
      resetDeferredEntries();
      resetReplayBuffers();
    },
  };
}

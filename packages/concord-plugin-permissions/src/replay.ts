import {
  ConcordProtocolError,
  getCommitChain,
  isGenesisCommit,
  type Entry,
  type LedgerContainer,
} from "@ternent/concord-protocol";
import {
  groupMemberPayloadSchema,
  groupUpsertPayloadSchema,
  permGrantPayloadSchema,
  permRevokePayloadSchema,
  type GroupMemberPayload,
  type GroupUpsertPayload,
  type PermGrantPayload,
  type PermRevokePayload,
} from "./schemas";
import { can, isAuthorizedGroupChange } from "./auth";
import { createEmptyState, type PermissionState, type ReplayConfig } from "./state";

export class PermissionRegistryError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PermissionRegistryError";
    this.code = code;
  }
}

type SchemaLike<T> = { safeParse: (value: unknown) => { success: boolean; data?: T; error?: { issues: { message: string; path: (string | number)[] }[] } } };

function buildInvalidPayloadError(
  issues: { message: string; path: (string | number)[] }[]
): PermissionRegistryError {
  const hasCap = issues.some((issue) => issue.path[0] === "cap");
  if (hasCap) {
    return new PermissionRegistryError(
      "INVALID_CAP",
      issues.map((issue) => issue.message).join("; ")
    );
  }
  const hasTarget = issues.some((issue) => issue.path[0] === "target");
  if (hasTarget) {
    return new PermissionRegistryError(
      "INVALID_TARGET",
      issues.map((issue) => issue.message).join("; ")
    );
  }
  return new PermissionRegistryError(
    "INVALID_PAYLOAD",
    issues.map((issue) => issue.message).join("; ")
  );
}

function parsePayload<T>(schema: SchemaLike<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw buildInvalidPayloadError(result.error?.issues ?? []);
  }
  return result.data as T;
}

function applyGroupUpsert(
  state: PermissionState,
  entry: Entry
): PermissionState {
  const payload = parsePayload<GroupUpsertPayload>(
    groupUpsertPayloadSchema,
    entry.payload
  );

  const existing = state.groups[payload.groupId];
  if (existing) {
    if (!isAuthorizedGroupChange(state, entry.author, payload.groupId)) {
      throw new PermissionRegistryError(
        "UNAUTHORIZED_GROUP_UPDATE",
        "group changes require group owner or rootAdmin"
      );
    }
    return {
      ...state,
      groups: {
        ...state.groups,
        [payload.groupId]: {
          ...existing,
          displayName: payload.displayName ?? existing.displayName,
        },
      },
    };
  }

  return {
    ...state,
    groups: {
      ...state.groups,
      [payload.groupId]: {
        groupId: payload.groupId,
        displayName: payload.displayName,
        owner: entry.author,
        members: [],
      },
    },
  };
}

function applyGroupMember(
  state: PermissionState,
  entry: Entry,
  action: "add" | "remove"
): PermissionState {
  const payload = parsePayload<GroupMemberPayload>(
    groupMemberPayloadSchema,
    entry.payload
  );

  const group = state.groups[payload.groupId];
  if (!group) {
    throw new PermissionRegistryError(
      "INVALID_TARGET",
      `Missing group ${payload.groupId}`
    );
  }
  if (!isAuthorizedGroupChange(state, entry.author, payload.groupId)) {
    throw new PermissionRegistryError(
      "UNAUTHORIZED_GROUP_UPDATE",
      "group changes require group owner or rootAdmin"
    );
  }

  const members = new Set(group.members);
  if (action === "add") {
    members.add(payload.principalId);
  } else {
    members.delete(payload.principalId);
  }

  return {
    ...state,
    groups: {
      ...state.groups,
      [payload.groupId]: {
        ...group,
        members: Array.from(members),
      },
    },
  };
}

function applyPermGrant(
  state: PermissionState,
  entry: Entry,
  order: number
): PermissionState {
  const payload = parsePayload<PermGrantPayload>(
    permGrantPayloadSchema,
    entry.payload
  );

  if (!can(state, entry.author, "perm:grant", payload.scope)) {
    throw new PermissionRegistryError(
      "UNAUTHORIZED_GRANT",
      "perm.grant requires grant or admin capability"
    );
  }

  return {
    ...state,
    grants: [
      ...state.grants,
      {
        scope: payload.scope,
        cap: payload.cap,
        target: payload.target,
        constraints: payload.constraints,
        grantedBy: entry.author,
        grantedAt: entry.timestamp,
        order,
      },
    ],
  };
}

function applyPermRevoke(
  state: PermissionState,
  entry: Entry,
  order: number
): PermissionState {
  const payload = parsePayload<PermRevokePayload>(
    permRevokePayloadSchema,
    entry.payload
  );

  if (!can(state, entry.author, "perm:admin", payload.scope)) {
    throw new PermissionRegistryError(
      "UNAUTHORIZED_REVOKE",
      "perm.revoke requires admin capability"
    );
  }

  return {
    ...state,
    revokes: [
      ...state.revokes,
      {
        scope: payload.scope,
        cap: payload.cap,
        target: payload.target,
        reason: payload.reason,
        revokedBy: entry.author,
        revokedAt: entry.timestamp,
        order,
      },
    ],
  };
}

export function replayPermissions(
  ledger: LedgerContainer,
  head?: string,
  config?: ReplayConfig
): PermissionState {
  const replayLedger = head ? { ...ledger, head } : ledger;
  const chain = getCommitChain(replayLedger);
  let state = createEmptyState(config);

  let order = 0;
  for (const commitId of chain) {
    const commit = replayLedger.commits[commitId];
    if (!commit) {
      throw new ConcordProtocolError(
        "MISSING_COMMIT",
        `Missing commit ${commitId}`
      );
    }
    if (isGenesisCommit(commit)) {
      continue;
    }
    for (const entryId of commit.entries) {
      const entry = replayLedger.entries[entryId];
      if (!entry) {
        throw new ConcordProtocolError(
          "MISSING_ENTRY",
          `Missing entry ${entryId}`
        );
      }
      switch (entry.kind) {
        case "group.upsert":
          state = applyGroupUpsert(state, entry);
          break;
        case "group.member.add":
          state = applyGroupMember(state, entry, "add");
          break;
        case "group.member.remove":
          state = applyGroupMember(state, entry, "remove");
          break;
        case "perm.grant":
          state = applyPermGrant(state, entry, order);
          break;
        case "perm.revoke":
          state = applyPermRevoke(state, entry, order);
          break;
        default:
          break;
      }
      order += 1;
    }
  }

  return state;
}

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

function parsePayload<T>(schema: { safeParse: (value: unknown) => any }, payload: unknown, code: string): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new PermissionRegistryError(
      code,
      result.error.issues.map((issue: { message: string }) => issue.message).join("; ")
    );
  }
  return result.data as T;
}

function applyGroupUpsert(
  state: PermissionState,
  entry: Entry
): PermissionState {
  const payload = parsePayload<GroupUpsertPayload>(
    groupUpsertPayloadSchema,
    entry.payload,
    "INVALID_GROUP_UPSERT"
  );

  const existing = state.groups[payload.groupId];
  if (existing) {
    if (!isAuthorizedGroupChange(state, entry.author, payload.groupId)) {
      throw new PermissionRegistryError(
        "UNAUTHORIZED_GROUP_UPSERT",
        "group.upsert requires group owner or rootAdmin"
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
    entry.payload,
    "INVALID_GROUP_MEMBER"
  );

  const group = state.groups[payload.groupId];
  if (!group) {
    throw new PermissionRegistryError(
      "GROUP_NOT_FOUND",
      `Missing group ${payload.groupId}`
    );
  }
  if (!isAuthorizedGroupChange(state, entry.author, payload.groupId)) {
    throw new PermissionRegistryError(
      "UNAUTHORIZED_GROUP_MEMBER",
      "group membership changes require group owner or rootAdmin"
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

function applyPermGrant(state: PermissionState, entry: Entry): PermissionState {
  const payload = parsePayload<PermGrantPayload>(
    permGrantPayloadSchema,
    entry.payload,
    "INVALID_PERM_GRANT"
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
      },
    ],
  };
}

function applyPermRevoke(state: PermissionState, entry: Entry): PermissionState {
  const payload = parsePayload<PermRevokePayload>(
    permRevokePayloadSchema,
    entry.payload,
    "INVALID_PERM_REVOKE"
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
          state = applyPermGrant(state, entry);
          break;
        case "perm.revoke":
          state = applyPermRevoke(state, entry);
          break;
        default:
          break;
      }
    }
  }

  return state;
}

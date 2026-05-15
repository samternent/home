import type { ConcordReplayPlugin } from "@ternent/concord";
import type { LedgerReplayEntry } from "@ternent/ledger";
import type { AppProjectionPlugin } from "@/app/runtime";
import {
  isIdentityKeyFormat,
  toDidKeyFromPublicKey,
  toLegacyAuthorDidFromIdentityKey,
  validateIdentityKey,
} from "./identityKey";

export type PermissionMember = {
  memberId: string;
  memberLabel: string | null;
};

export type PermissionRecord = {
  id: string;
  title: string;
  scope: string | null;
  members: PermissionMember[];
  createdAt: string;
  updatedAt: string;
};

export type PermissionsState = {
  byId: Record<string, PermissionRecord>;
  order: string[];
};

export type PermissionActorInput = {
  memberId: string;
  memberLabel?: string | null;
};

export type PermissionCreateInput = {
  title: string;
  scope?: string | null;
  actor: PermissionActorInput;
};

export type PermissionGrantInput = {
  permissionId: string;
  memberId: string;
  memberLabel?: string | null;
  actor: PermissionActorInput;
};

export type PermissionRevokeInput = {
  permissionId: string;
  memberId: string;
  actor: PermissionActorInput;
};

type PermissionCreatePayload = {
  permissionId: string;
  title: string;
  scope: string | null;
  actor: PermissionMember;
  createdAt: string;
  updatedAt: string;
};

type PermissionGrantPayload = {
  permissionId: string;
  memberId: string;
  memberLabel: string | null;
  actor: PermissionMember;
  updatedAt: string;
};

type PermissionRevokePayload = {
  permissionId: string;
  memberId: string;
  actor: PermissionMember;
  updatedAt: string;
};

function initialPermissionsState(): PermissionsState {
  return {
    byId: {},
    order: [],
  };
}

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

function normalizeActor(value: unknown): PermissionMember {
  if (!value || typeof value !== "object") {
    throw new Error("Actor is required.");
  }

  const actor = value as Record<string, unknown>;

  return {
    memberId: normalizeRequiredText(actor.memberId, "Actor member id"),
    memberLabel: normalizeOptionalText(actor.memberLabel, "Actor member label"),
  };
}

async function parsePermissionCreateInput(
  inputValue: unknown,
): Promise<PermissionCreateInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Permission create input is required.");
  }

  const input = inputValue as Record<string, unknown>;
  const actor = normalizeActor(input.actor);

  return {
    title: normalizeRequiredText(input.title, "Permission title"),
    scope: normalizeOptionalText(input.scope, "Permission scope"),
    actor: {
      ...actor,
      memberId: await validateIdentityKey(actor.memberId),
    },
  };
}

async function parsePermissionGrantInput(
  inputValue: unknown,
): Promise<PermissionGrantInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Permission grant input is required.");
  }

  const input = inputValue as Record<string, unknown>;
  const actor = normalizeActor(input.actor);

  return {
    permissionId: normalizeRequiredText(input.permissionId, "Permission id"),
    memberId: await validateIdentityKey(
      normalizeRequiredText(input.memberId, "Member id"),
    ),
    memberLabel: normalizeOptionalText(input.memberLabel, "Member label"),
    actor: {
      ...actor,
      memberId: await validateIdentityKey(actor.memberId),
    },
  };
}

async function parsePermissionRevokeInput(
  inputValue: unknown,
): Promise<PermissionRevokeInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Permission revoke input is required.");
  }

  const input = inputValue as Record<string, unknown>;
  const actor = normalizeActor(input.actor);

  return {
    permissionId: normalizeRequiredText(input.permissionId, "Permission id"),
    memberId: normalizeRequiredText(input.memberId, "Member id"),
    actor: {
      ...actor,
      memberId: await validateIdentityKey(actor.memberId),
    },
  };
}

function getEntryPayload(entry: LedgerReplayEntry): unknown {
  if (entry.payload.type === "plain") {
    return entry.payload.data;
  }

  if (entry.payload.type === "decrypted") {
    return entry.payload.data;
  }

  return null;
}

function clonePermissionRecord(record: PermissionRecord): PermissionRecord {
  return {
    ...record,
    members: record.members.map((member) => ({ ...member })),
  };
}

function clonePermissionsState(state: PermissionsState): PermissionsState {
  return {
    byId: Object.fromEntries(
      Object.entries(state.byId).map(([permissionId, record]) => [
        permissionId,
        clonePermissionRecord(record),
      ]),
    ),
    order: [...state.order],
  };
}

function applyPermissionCreate(
  state: PermissionsState,
  payloadValue: unknown,
): PermissionsState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as PermissionCreatePayload;
  const existing = state.byId[payload.permissionId];
  if (existing) {
    return state;
  }

  const nextRecord: PermissionRecord = {
    id: payload.permissionId,
    title: payload.title,
    scope: payload.scope,
    members: [
      {
        memberId: payload.actor.memberId,
        memberLabel: payload.actor.memberLabel,
      },
    ],
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };

  return {
    byId: {
      ...state.byId,
      [payload.permissionId]: nextRecord,
    },
    order: [...state.order, payload.permissionId],
  };
}

function applyPermissionGrant(
  state: PermissionsState,
  payloadValue: unknown,
): PermissionsState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as PermissionGrantPayload;
  const existing = state.byId[payload.permissionId];
  if (!existing) {
    return state;
  }

  const membersWithoutTarget = existing.members.filter(
    (member) => member.memberId !== payload.memberId,
  );
  const withTarget = [
    ...membersWithoutTarget,
    {
      memberId: payload.memberId,
      memberLabel: payload.memberLabel,
    },
  ];

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.permissionId]: {
        ...existing,
        members: withTarget,
        updatedAt: payload.updatedAt,
      },
    },
  };
}

function applyPermissionRevoke(
  state: PermissionsState,
  payloadValue: unknown,
): PermissionsState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as PermissionRevokePayload;
  const existing = state.byId[payload.permissionId];
  if (!existing) {
    return state;
  }

  const withoutMember = existing.members.filter(
    (member) => member.memberId !== payload.memberId,
  );

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.permissionId]: {
        ...existing,
        members: withoutMember,
        updatedAt: payload.updatedAt,
      },
    },
  };
}

function createStableHash(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function createPermissionId(
  nowIso: string,
  title: string,
  actorId: string,
  scope: string | null,
): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "permission";
  const timestamp = nowIso.replace(/[^0-9]/g, "").slice(0, 14) || "0";
  const fingerprint = createStableHash([slug, actorId, scope ?? "", nowIso].join("|"));
  return `permission:${slug}:${timestamp}:${fingerprint}`;
}

function permissionIncludesMember(
  record: PermissionRecord | undefined,
  candidates: Set<string>,
): boolean {
  if (!record) {
    return false;
  }
  return record.members.some((member) => candidates.has(member.memberId));
}

function resolveRuntimeActorCandidates(
  identity: { publicKey: string; keyId: string },
): Set<string> {
  const identityKey = toDidKeyFromPublicKey(identity.publicKey);
  return new Set([identityKey, identity.keyId, `did:key:${identity.keyId}`]);
}

function normalizeAuthorCandidateFromMemberId(memberId: string): string {
  return memberId.startsWith("did:key:") ? memberId : `did:key:${memberId}`;
}

async function resolveActorAuthorCandidates(
  actorMemberId: string,
): Promise<Set<string>> {
  const candidates = new Set<string>([
    normalizeAuthorCandidateFromMemberId(actorMemberId),
    actorMemberId,
  ]);
  if (isIdentityKeyFormat(actorMemberId)) {
    try {
      candidates.add(await toLegacyAuthorDidFromIdentityKey(actorMemberId));
    } catch {
      // Ignore malformed identity keys during replay hardening.
    }
  }
  return candidates;
}

function resolveViewerCandidates(
  viewerIdentityKey: unknown,
  viewerIdentityId: unknown,
): Set<string> {
  const candidates = new Set<string>();

  if (typeof viewerIdentityKey === "string" && viewerIdentityKey.trim()) {
    candidates.add(viewerIdentityKey.trim());
  }
  if (typeof viewerIdentityId === "string" && viewerIdentityId.trim()) {
    const value = viewerIdentityId.trim();
    candidates.add(value);
    candidates.add(`did:key:${value}`);
  }

  return candidates;
}

/**
 * Creates the local permissions replay plugin and selectors for v2.
 */
export function createPermissionsPlugin(): AppProjectionPlugin<PermissionsState> {
  const plugin: ConcordReplayPlugin<PermissionsState> = {
    id: "permissions",
    initialState: initialPermissionsState,
    commands: {
      "permission.create": async (ctx, inputValue) => {
        const input = await parsePermissionCreateInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actor.memberId)) {
          throw new Error("Actor identity does not match the active signer.");
        }
        const now = ctx.now();

        return {
          kind: "permission.create",
          payload: {
            permissionId: createPermissionId(
              now,
              input.title,
              input.actor.memberId,
              input.scope ?? null,
            ),
            title: input.title,
            scope: input.scope ?? null,
            actor: input.actor,
            createdAt: now,
            updatedAt: now,
          } satisfies PermissionCreatePayload,
        };
      },
      "permission.grant": async (ctx, inputValue) => {
        const input = await parsePermissionGrantInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actor.memberId)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const permissionsState = ctx.getReplayState<PermissionsState>("permissions");
        const permission = permissionsState.byId[input.permissionId];
        if (!permission) {
          throw new Error("Permission does not exist.");
        }
        if (!permissionIncludesMember(permission, runtimeCandidates)) {
          throw new Error("Only existing group members can add collaborators.");
        }

        return {
          kind: "permission.grant",
          payload: {
            permissionId: input.permissionId,
            memberId: input.memberId,
            memberLabel: input.memberLabel ?? null,
            actor: input.actor,
            updatedAt: ctx.now(),
          } satisfies PermissionGrantPayload,
        };
      },
      "permission.revoke": async (ctx, inputValue) => {
        const input = await parsePermissionRevokeInput(inputValue);
        const runtimeCandidates = resolveRuntimeActorCandidates(ctx.identity);
        if (!runtimeCandidates.has(input.actor.memberId)) {
          throw new Error("Actor identity does not match the active signer.");
        }

        const permissionsState = ctx.getReplayState<PermissionsState>("permissions");
        const permission = permissionsState.byId[input.permissionId];
        if (!permission) {
          throw new Error("Permission does not exist.");
        }
        if (!permissionIncludesMember(permission, runtimeCandidates)) {
          throw new Error("Only existing group members can remove collaborators.");
        }

        return {
          kind: "permission.revoke",
          payload: {
            permissionId: input.permissionId,
            memberId: input.memberId,
            actor: input.actor,
            updatedAt: ctx.now(),
          } satisfies PermissionRevokePayload,
        };
      },
    },
    async applyEntry(entry, ctx) {
      const state = clonePermissionsState(ctx.getState());
      const payload = getEntryPayload(entry);

      if (entry.kind === "permission.create") {
        const actorMemberId =
          payload && typeof payload === "object"
            ? readOptionalText(
                (payload as Record<string, unknown>).actor &&
                  typeof (payload as Record<string, unknown>).actor === "object"
                  ? (
                      (payload as Record<string, unknown>)
                        .actor as Record<string, unknown>
                    ).memberId
                  : null,
              )
            : null;
        if (!actorMemberId) {
          return;
        }
        const authorCandidates = await resolveActorAuthorCandidates(actorMemberId);
        if (!authorCandidates.has(entry.author)) {
          return;
        }
        ctx.setState(applyPermissionCreate(state, payload));
        return;
      }

      if (entry.kind === "permission.grant") {
        const grantPayload =
          payload && typeof payload === "object"
            ? (payload as Record<string, unknown>)
            : null;
        const actorValue =
          grantPayload && typeof grantPayload.actor === "object"
            ? (grantPayload.actor as Record<string, unknown>).memberId
            : null;
        const actorMemberId = readOptionalText(actorValue);
        if (!actorMemberId) {
          return;
        }
        const authorCandidates = await resolveActorAuthorCandidates(actorMemberId);
        if (!authorCandidates.has(entry.author)) {
          return;
        }
        const permissionId = readOptionalText(grantPayload?.permissionId ?? null);
        if (!permissionId) {
          return;
        }
        const permission = state.byId[permissionId];
        const actorCandidates = new Set<string>([
          actorMemberId,
          normalizeAuthorCandidateFromMemberId(actorMemberId),
        ]);
        if (!permissionIncludesMember(permission, actorCandidates)) {
          return;
        }
        ctx.setState(applyPermissionGrant(state, payload));
        return;
      }

      if (entry.kind === "permission.revoke") {
        const revokePayload =
          payload && typeof payload === "object"
            ? (payload as Record<string, unknown>)
            : null;
        const actorValue =
          revokePayload && typeof revokePayload.actor === "object"
            ? (revokePayload.actor as Record<string, unknown>).memberId
            : null;
        const actorMemberId = readOptionalText(actorValue);
        if (!actorMemberId) {
          return;
        }
        const authorCandidates = await resolveActorAuthorCandidates(actorMemberId);
        if (!authorCandidates.has(entry.author)) {
          return;
        }
        const permissionId = readOptionalText(revokePayload?.permissionId ?? null);
        if (!permissionId) {
          return;
        }
        const permission = state.byId[permissionId];
        const actorCandidates = new Set<string>([
          actorMemberId,
          normalizeAuthorCandidateFromMemberId(actorMemberId),
        ]);
        if (!permissionIncludesMember(permission, actorCandidates)) {
          return;
        }
        ctx.setState(applyPermissionRevoke(state, payload));
      }
    },
  };

  return {
    plugin,
    selectors: {
      all(state, viewerIdentityKey: unknown, viewerIdentityId: unknown) {
        const viewerCandidates = resolveViewerCandidates(
          viewerIdentityKey,
          viewerIdentityId,
        );
        const visibleRecords = state.order
          .map((permissionId) => state.byId[permissionId])
          .filter((record): record is PermissionRecord => Boolean(record))
          .map(clonePermissionRecord);
        if (viewerCandidates.size === 0) {
          return visibleRecords;
        }
        return visibleRecords.filter((record) =>
          permissionIncludesMember(record, viewerCandidates),
        );
      },
      byId(
        state,
        permissionId: unknown,
        viewerIdentityKey: unknown,
        viewerIdentityId: unknown,
      ) {
        if (typeof permissionId !== "string") {
          return null;
        }

        const record = state.byId[permissionId] ?? null;
        if (!record) {
          return null;
        }
        const viewerCandidates = resolveViewerCandidates(
          viewerIdentityKey,
          viewerIdentityId,
        );
        if (
          viewerCandidates.size > 0 &&
          !permissionIncludesMember(record, viewerCandidates)
        ) {
          return null;
        }
        return clonePermissionRecord(record);
      },
    },
  };
}

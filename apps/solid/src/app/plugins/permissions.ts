import type { ConcordReplayPlugin } from "@ternent/concord";
import type { LedgerReplayEntry } from "@ternent/ledger";
import type { AppProjectionPlugin } from "@/app/runtime";

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

function parsePermissionCreateInput(inputValue: unknown): PermissionCreateInput {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Permission create input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    title: normalizeRequiredText(input.title, "Permission title"),
    scope: normalizeOptionalText(input.scope, "Permission scope"),
    actor: normalizeActor(input.actor),
  };
}

function parsePermissionGrantInput(inputValue: unknown): PermissionGrantInput {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Permission grant input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    permissionId: normalizeRequiredText(input.permissionId, "Permission id"),
    memberId: normalizeRequiredText(input.memberId, "Member id"),
    memberLabel: normalizeOptionalText(input.memberLabel, "Member label"),
    actor: normalizeActor(input.actor),
  };
}

function parsePermissionRevokeInput(inputValue: unknown): PermissionRevokeInput {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Permission revoke input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    permissionId: normalizeRequiredText(input.permissionId, "Permission id"),
    memberId: normalizeRequiredText(input.memberId, "Member id"),
    actor: normalizeActor(input.actor),
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

function ensureActorMember(
  members: PermissionMember[],
  actor: PermissionMember,
): PermissionMember[] {
  const withoutActor = members.filter(
    (member) => member.memberId !== actor.memberId,
  );

  return [
    ...withoutActor,
    {
      memberId: actor.memberId,
      memberLabel: actor.memberLabel,
    },
  ];
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
    members: ensureActorMember([], payload.actor),
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
        members: ensureActorMember(withTarget, payload.actor),
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
        members: ensureActorMember(withoutMember, payload.actor),
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

/**
 * Creates the local permissions replay plugin and selectors for v2.
 */
export function createPermissionsPlugin(): AppProjectionPlugin<PermissionsState> {
  const plugin: ConcordReplayPlugin<PermissionsState> = {
    id: "permissions",
    initialState: initialPermissionsState,
    commands: {
      "permission.create": async (ctx, inputValue) => {
        const input = parsePermissionCreateInput(inputValue);
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
        const input = parsePermissionGrantInput(inputValue);

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
        const input = parsePermissionRevokeInput(inputValue);
        if (input.memberId === input.actor.memberId) {
          throw new Error("Active identity cannot be removed from a permission.");
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
    applyEntry(entry, ctx) {
      const state = clonePermissionsState(ctx.getState());
      const payload = getEntryPayload(entry);

      if (entry.kind === "permission.create") {
        ctx.setState(applyPermissionCreate(state, payload));
        return;
      }

      if (entry.kind === "permission.grant") {
        ctx.setState(applyPermissionGrant(state, payload));
        return;
      }

      if (entry.kind === "permission.revoke") {
        ctx.setState(applyPermissionRevoke(state, payload));
      }
    },
  };

  return {
    plugin,
    selectors: {
      all(state) {
        return state.order
          .map((permissionId) => state.byId[permissionId])
          .filter((record): record is PermissionRecord => Boolean(record))
          .map(clonePermissionRecord);
      },
      byId(state, permissionId: unknown) {
        if (typeof permissionId !== "string") {
          return null;
        }

        const record = state.byId[permissionId] ?? null;
        return record ? clonePermissionRecord(record) : null;
      },
    },
  };
}

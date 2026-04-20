import type { ConcordReplayPlugin } from "@ternent/concord";
import type { LedgerReplayEntry } from "@ternent/ledger";
import type { AppProjectionPlugin } from "@/app/runtime";

export type UserProfileRecord = {
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  attributes: Record<string, string>;
};

export type UserRecord = {
  identityId: string;
  label: string;
  profile: UserProfileRecord;
  encryptionGroupIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type UsersState = {
  byId: Record<string, UserRecord>;
  order: string[];
};

export type UserCreateInput = {
  identityId: string;
  label?: string | null;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  attributes?: Record<string, string | null>;
  encryptionGroupIds?: string[];
};

export type UserUpdateProfileInput = {
  identityId: string;
  label?: string | null;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  attributes?: Record<string, string | null>;
};

export type UserEncryptionGroupInput = {
  identityId: string;
  groupId: string;
};

type UserCreatePayload = UserCreateInput & {
  createdAt: string;
  updatedAt: string;
};

type UserUpdateProfilePayload = UserUpdateProfileInput & {
  updatedAt: string;
};

type UserEncryptionGroupPayload = UserEncryptionGroupInput & {
  updatedAt: string;
};

function initialUsersState(): UsersState {
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

function normalizeOptionalText(value: unknown, label: string): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizeAttributes(
  value: unknown,
): Record<string, string | null> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Attributes must be an object.");
  }

  const next: Record<string, string | null> = {};

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = rawKey.trim();
    if (!key) {
      throw new Error("Attribute keys cannot be empty.");
    }

    if (rawValue === null) {
      next[key] = null;
      continue;
    }

    if (typeof rawValue !== "string") {
      throw new Error(`Attribute '${key}' must be a string or null.`);
    }

    const normalizedValue = rawValue.trim();
    if (!normalizedValue) {
      throw new Error(`Attribute '${key}' cannot be empty.`);
    }

    next[key] = normalizedValue;
  }

  return next;
}

function normalizeGroupIds(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("Encryption group ids must be an array.");
  }

  const seen = new Set<string>();
  const groupIds: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      throw new Error("Encryption group ids must be strings.");
    }

    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    groupIds.push(normalized);
  }

  return groupIds;
}

function parseUserCreateInput(inputValue: unknown): UserCreateInput {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("User create input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    identityId: normalizeRequiredText(input.identityId, "Identity id"),
    label: normalizeOptionalText(input.label, "Label"),
    displayName: normalizeOptionalText(input.displayName, "Display name"),
    email: normalizeOptionalText(input.email, "Email"),
    avatarUrl: normalizeOptionalText(input.avatarUrl, "Avatar URL"),
    attributes: normalizeAttributes(input.attributes),
    encryptionGroupIds: normalizeGroupIds(input.encryptionGroupIds),
  };
}

function parseUserUpdateProfileInput(inputValue: unknown): UserUpdateProfileInput {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("User profile input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    identityId: normalizeRequiredText(input.identityId, "Identity id"),
    label: normalizeOptionalText(input.label, "Label"),
    displayName: normalizeOptionalText(input.displayName, "Display name"),
    email: normalizeOptionalText(input.email, "Email"),
    avatarUrl: normalizeOptionalText(input.avatarUrl, "Avatar URL"),
    attributes: normalizeAttributes(input.attributes),
  };
}

function parseUserEncryptionGroupInput(inputValue: unknown): UserEncryptionGroupInput {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Encryption group input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    identityId: normalizeRequiredText(input.identityId, "Identity id"),
    groupId: normalizeRequiredText(input.groupId, "Group id"),
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

function cloneUserRecord(record: UserRecord): UserRecord {
  return {
    ...record,
    profile: {
      ...record.profile,
      attributes: { ...record.profile.attributes },
    },
    encryptionGroupIds: [...record.encryptionGroupIds],
  };
}

function cloneUsersState(state: UsersState): UsersState {
  return {
    byId: Object.fromEntries(
      Object.entries(state.byId).map(([identityId, record]) => [identityId, cloneUserRecord(record)]),
    ),
    order: [...state.order],
  };
}

function removeUndefinedFields<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as T;
}

function mergeAttributes(
  previous: Record<string, string>,
  patch?: Record<string, string | null>,
): Record<string, string> {
  if (!patch) {
    return { ...previous };
  }

  const next = { ...previous };

  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete next[key];
      continue;
    }

    next[key] = value;
  }

  return next;
}

function applyUserCreate(state: UsersState, payloadValue: unknown): UsersState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as UserCreatePayload;
  if (state.byId[payload.identityId]) {
    return state;
  }

  const nextRecord: UserRecord = {
    identityId: payload.identityId,
    label: payload.label ?? payload.identityId,
    profile: {
      displayName: payload.displayName ?? null,
      email: payload.email ?? null,
      avatarUrl: payload.avatarUrl ?? null,
      attributes: mergeAttributes({}, payload.attributes),
    },
    encryptionGroupIds: payload.encryptionGroupIds ?? [],
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };

  return {
    byId: {
      ...state.byId,
      [payload.identityId]: nextRecord,
    },
    order: [...state.order, payload.identityId],
  };
}

function applyUserUpdateProfile(
  state: UsersState,
  payloadValue: unknown,
): UsersState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as UserUpdateProfilePayload;
  const existing = state.byId[payload.identityId];

  const fallbackRecord: UserRecord = {
    identityId: payload.identityId,
    label: payload.identityId,
    profile: {
      displayName: null,
      email: null,
      avatarUrl: null,
      attributes: {},
    },
    encryptionGroupIds: [],
    createdAt: payload.updatedAt,
    updatedAt: payload.updatedAt,
  };

  const baseRecord = existing ?? fallbackRecord;

  const nextRecord: UserRecord = {
    ...baseRecord,
    label: payload.label ?? baseRecord.label,
    profile: {
      displayName:
        payload.displayName === undefined
          ? baseRecord.profile.displayName
          : payload.displayName,
      email: payload.email === undefined ? baseRecord.profile.email : payload.email,
      avatarUrl:
        payload.avatarUrl === undefined
          ? baseRecord.profile.avatarUrl
          : payload.avatarUrl,
      attributes: mergeAttributes(baseRecord.profile.attributes, payload.attributes),
    },
    updatedAt: payload.updatedAt,
  };

  return {
    byId: {
      ...state.byId,
      [payload.identityId]: nextRecord,
    },
    order: existing ? state.order : [...state.order, payload.identityId],
  };
}

function applyGroupAdded(state: UsersState, payloadValue: unknown): UsersState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as UserEncryptionGroupPayload;
  const existing = state.byId[payload.identityId];
  if (!existing) {
    return state;
  }

  if (existing.encryptionGroupIds.includes(payload.groupId)) {
    return state;
  }

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.identityId]: {
        ...existing,
        encryptionGroupIds: [...existing.encryptionGroupIds, payload.groupId],
        updatedAt: payload.updatedAt,
      },
    },
  };
}

function applyGroupRemoved(state: UsersState, payloadValue: unknown): UsersState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as UserEncryptionGroupPayload;
  const existing = state.byId[payload.identityId];
  if (!existing) {
    return state;
  }

  if (!existing.encryptionGroupIds.includes(payload.groupId)) {
    return state;
  }

  return {
    ...state,
    byId: {
      ...state.byId,
      [payload.identityId]: {
        ...existing,
        encryptionGroupIds: existing.encryptionGroupIds.filter((groupId) => groupId !== payload.groupId),
        updatedAt: payload.updatedAt,
      },
    },
  };
}

/**
 * Creates the local users replay plugin and selectors for v2.
 */
export function createUsersPlugin(): AppProjectionPlugin<UsersState> {
  const plugin: ConcordReplayPlugin<UsersState> = {
    id: "users",
    initialState: initialUsersState,
    commands: {
      "user.create": async (ctx, inputValue) => {
        const input = parseUserCreateInput(inputValue);
        const now = ctx.now();

        return {
          kind: "user.create",
          payload: removeUndefinedFields({
            ...input,
            createdAt: now,
            updatedAt: now,
          }) satisfies UserCreatePayload,
        };
      },
      "user.updateProfile": async (ctx, inputValue) => {
        const input = parseUserUpdateProfileInput(inputValue);

        return {
          kind: "user.updateProfile",
          payload: removeUndefinedFields({
            ...input,
            updatedAt: ctx.now(),
          }) satisfies UserUpdateProfilePayload,
        };
      },
      "user.group.add": async (ctx, inputValue) => {
        const input = parseUserEncryptionGroupInput(inputValue);

        return {
          kind: "user.group.add",
          payload: {
            ...input,
            updatedAt: ctx.now(),
          } satisfies UserEncryptionGroupPayload,
        };
      },
      "user.group.remove": async (ctx, inputValue) => {
        const input = parseUserEncryptionGroupInput(inputValue);

        return {
          kind: "user.group.remove",
          payload: {
            ...input,
            updatedAt: ctx.now(),
          } satisfies UserEncryptionGroupPayload,
        };
      },
    },
    applyEntry(entry, ctx) {
      const state = cloneUsersState(ctx.getState());
      const payload = getEntryPayload(entry);

      if (entry.kind === "user.create") {
        ctx.setState(applyUserCreate(state, payload));
        return;
      }

      if (entry.kind === "user.updateProfile") {
        ctx.setState(applyUserUpdateProfile(state, payload));
        return;
      }

      if (entry.kind === "user.group.add") {
        ctx.setState(applyGroupAdded(state, payload));
        return;
      }

      if (entry.kind === "user.group.remove") {
        ctx.setState(applyGroupRemoved(state, payload));
      }
    },
  };

  return {
    plugin,
    selectors: {
      all(state) {
        return state.order
          .map((identityId) => state.byId[identityId])
          .filter((record): record is UserRecord => Boolean(record))
          .map(cloneUserRecord);
      },
      byId(state, identityId: unknown) {
        if (typeof identityId !== "string") {
          return null;
        }

        const record = state.byId[identityId] ?? null;
        return record ? cloneUserRecord(record) : null;
      },
    },
  };
}

import type { ConcordReplayPlugin } from "@ternent/concord";
import type { LedgerReplayEntry } from "@ternent/ledger";
import type { AppProjectionPlugin } from "@/app/runtime";
import { validateIdentityKey } from "./identityKey";

export type ProfileRecord = {
  identityKey: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  updatedAt: string;
  updatedBy: string;
};

export type ProfilesState = {
  byKey: Record<string, ProfileRecord>;
  order: string[];
};

export type ProfileUpsertInput = {
  identityKey: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  actorIdentityKey: string;
};

type ProfileUpsertPayload = {
  identityKey: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  updatedAt: string;
  updatedBy: string;
};

function initialProfilesState(): ProfilesState {
  return {
    byKey: {},
    order: [],
  };
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

async function parseProfileUpsertInput(inputValue: unknown): Promise<ProfileUpsertInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("Profile upsert input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  const identityKey = await validateIdentityKey(String(input.identityKey ?? ""));
  const actorIdentityKey = await validateIdentityKey(String(input.actorIdentityKey ?? ""));

  if (actorIdentityKey !== identityKey) {
    throw new Error("Profile updates are self-service only.");
  }

  return {
    identityKey,
    actorIdentityKey,
    displayName: normalizeOptionalText(input.displayName, "Display name"),
    bio: normalizeOptionalText(input.bio, "Bio"),
    avatarUrl: normalizeOptionalText(input.avatarUrl, "Avatar URL"),
  };
}

function removeUndefinedFields<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
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

function cloneProfileRecord(record: ProfileRecord): ProfileRecord {
  return {
    ...record,
  };
}

function cloneProfilesState(state: ProfilesState): ProfilesState {
  return {
    byKey: Object.fromEntries(
      Object.entries(state.byKey).map(([identityKey, record]) => [
        identityKey,
        cloneProfileRecord(record),
      ]),
    ),
    order: [...state.order],
  };
}

function applyProfileUpsert(state: ProfilesState, payloadValue: unknown): ProfilesState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as ProfileUpsertPayload;
  const existing = state.byKey[payload.identityKey];

  const baseRecord: ProfileRecord = existing ?? {
    identityKey: payload.identityKey,
    displayName: null,
    bio: null,
    avatarUrl: null,
    updatedAt: payload.updatedAt,
    updatedBy: payload.updatedBy,
  };

  const nextRecord: ProfileRecord = {
    ...baseRecord,
    displayName: payload.displayName === undefined ? baseRecord.displayName : payload.displayName,
    bio: payload.bio === undefined ? baseRecord.bio : payload.bio,
    avatarUrl: payload.avatarUrl === undefined ? baseRecord.avatarUrl : payload.avatarUrl,
    updatedAt: payload.updatedAt,
    updatedBy: payload.updatedBy,
  };

  return {
    byKey: {
      ...state.byKey,
      [payload.identityKey]: nextRecord,
    },
    order: existing ? state.order : [...state.order, payload.identityKey],
  };
}

/**
 * Creates the local profile replay plugin and selectors for v2.
 */
export function createProfilesPlugin(): AppProjectionPlugin<ProfilesState> {
  const plugin: ConcordReplayPlugin<ProfilesState> = {
    id: "profiles",
    initialState: initialProfilesState,
    commands: {
      "profile.upsert": async (ctx, inputValue) => {
        const input = await parseProfileUpsertInput(inputValue);

        return {
          kind: "profile.upsert",
          payload: removeUndefinedFields({
            identityKey: input.identityKey,
            displayName: input.displayName,
            bio: input.bio,
            avatarUrl: input.avatarUrl,
            updatedAt: ctx.now(),
            updatedBy: input.actorIdentityKey,
          }) satisfies ProfileUpsertPayload,
        };
      },
    },
    applyEntry(entry, ctx) {
      const state = cloneProfilesState(ctx.getState());
      const payload = getEntryPayload(entry);

      if (entry.kind === "profile.upsert") {
        ctx.setState(applyProfileUpsert(state, payload));
      }
    },
  };

  return {
    plugin,
    selectors: {
      all(state) {
        return state.order
          .map((identityKey) => state.byKey[identityKey])
          .filter((record): record is ProfileRecord => Boolean(record))
          .map(cloneProfileRecord);
      },
      byIdentityKey(state, identityKey: unknown) {
        if (typeof identityKey !== "string") {
          return null;
        }

        const record = state.byKey[identityKey] ?? null;
        return record ? cloneProfileRecord(record) : null;
      },
    },
  };
}

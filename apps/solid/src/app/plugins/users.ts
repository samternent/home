import type { ConcordReplayPlugin } from "@ternent/concord";
import type { LedgerReplayEntry } from "@ternent/ledger";
import type { AppProjectionPlugin } from "@/app/runtime";
import { validateIdentityKey } from "./identityKey";

export type UserRecord = {
  identityKey: string;
  addedAt: string;
  addedBy: string;
  label?: string | null;
};

export type UsersState = {
  byKey: Record<string, UserRecord>;
  order: string[];
};

export type UserCreateInput = {
  identityKey: string;
  actorIdentityKey: string;
};

type UserCreatePayload = {
  identityKey: string;
  label?: string | null;
  addedAt: string;
  addedBy: string;
};

function initialUsersState(): UsersState {
  return {
    byKey: {},
    order: [],
  };
}

async function parseUserCreateInput(inputValue: unknown): Promise<UserCreateInput> {
  if (!inputValue || typeof inputValue !== "object") {
    throw new Error("User create input is required.");
  }

  const input = inputValue as Record<string, unknown>;

  return {
    identityKey: await validateIdentityKey(String(input.identityKey ?? "")),
    actorIdentityKey: await validateIdentityKey(String(input.actorIdentityKey ?? "")),
  };
}

function normalizeLegacyLabel(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
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
  };
}

function cloneUsersState(state: UsersState): UsersState {
  return {
    byKey: Object.fromEntries(
      Object.entries(state.byKey).map(([identityKey, record]) => [
        identityKey,
        cloneUserRecord(record),
      ]),
    ),
    order: [...state.order],
  };
}

function applyUserCreate(state: UsersState, payloadValue: unknown): UsersState {
  if (!payloadValue || typeof payloadValue !== "object") {
    return state;
  }

  const payload = payloadValue as UserCreatePayload;
  if (state.byKey[payload.identityKey]) {
    return state;
  }

  const nextRecord: UserRecord = {
    identityKey: payload.identityKey,
    label: normalizeLegacyLabel(payload.label),
    addedAt: payload.addedAt,
    addedBy: payload.addedBy,
  };

  return {
    byKey: {
      ...state.byKey,
      [payload.identityKey]: nextRecord,
    },
    order: [...state.order, payload.identityKey],
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
        const input = await parseUserCreateInput(inputValue);

        const usersState = ctx.getReplayState<UsersState>("users");
        if (usersState.byKey[input.identityKey]) {
          throw new Error("User already exists.");
        }

        const now = ctx.now();

        return {
          kind: "user.create",
          payload: {
            identityKey: input.identityKey,
            addedAt: now,
            addedBy: input.actorIdentityKey,
          } satisfies UserCreatePayload,
        };
      },
    },
    applyEntry(entry, ctx) {
      const state = cloneUsersState(ctx.getState());
      const payload = getEntryPayload(entry);

      if (entry.kind === "user.create") {
        ctx.setState(applyUserCreate(state, payload));
      }
    },
  };

  return {
    plugin,
    selectors: {
      all(state) {
        return state.order
          .map((identityKey) => state.byKey[identityKey])
          .filter((record): record is UserRecord => Boolean(record))
          .map(cloneUserRecord);
      },
      byIdentityKey(state, identityKey: unknown) {
        if (typeof identityKey !== "string") {
          return null;
        }

        const record = state.byKey[identityKey] ?? null;
        return record ? cloneUserRecord(record) : null;
      },
      // Transition alias for older callers.
      byId(state, identityKey: unknown) {
        if (typeof identityKey !== "string") {
          return null;
        }

        const record = state.byKey[identityKey] ?? null;
        return record ? cloneUserRecord(record) : null;
      },
    },
  };
}

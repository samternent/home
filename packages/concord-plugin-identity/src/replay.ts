import {
  ConcordProtocolError,
  getCommitChain,
  isGenesisCommit,
  type Entry,
  type LedgerContainer,
} from "@ternent/concord-protocol";
import {
  identityUpsertPayloadSchema,
  type IdentityUpsertPayload,
} from "./schemas";
import { createEmptyState, type IdentityState } from "./state";

export class IdentityRegistryError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "IdentityRegistryError";
    this.code = code;
  }
}

function parseIdentityUpsertPayload(payload: unknown): IdentityUpsertPayload {
  const result = identityUpsertPayloadSchema.safeParse(payload);
  if (!result.success) {
    throw new IdentityRegistryError(
      "INVALID_IDENTITY_UPSERT",
      result.error.issues.map((issue) => issue.message).join("; ")
    );
  }
  return result.data;
}

function applyIdentityUpsert(
  state: IdentityState,
  entry: Entry
): IdentityState {
  const payload = parseIdentityUpsertPayload(entry.payload);
  if (entry.author !== payload.principalId) {
    throw new IdentityRegistryError(
      "AUTHOR_MISMATCH",
      "identity.upsert author must match payload.principalId"
    );
  }

  const updated = {
    principalId: payload.principalId,
    displayName: payload.displayName,
    ageRecipients: payload.ageRecipients ?? [],
    metadata: payload.metadata,
    updatedAt: entry.timestamp,
    updatedBy: entry.author,
  };

  return {
    ...state,
    principals: {
      ...state.principals,
      [payload.principalId]: updated,
    },
  };
}

export function replayIdentity(
  ledger: LedgerContainer,
  head?: string
): IdentityState {
  const replayLedger = head ? { ...ledger, head } : ledger;
  const chain = getCommitChain(replayLedger);
  let state = createEmptyState();

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
      if (entry.kind !== "identity.upsert") {
        continue;
      }
      state = applyIdentityUpsert(state, entry);
    }
  }

  return state;
}

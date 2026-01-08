import {
  identityUpsertPayloadSchema,
  replayIdentity,
  type IdentityRecord,
  type IdentityState,
} from "@ternent/concord-plugin-identity";
import type { LedgerContainer, Entry } from "@ternent/concord-protocol";

export type IdentityUpsertParams = {
  principalId: string;
  author: string;
  displayName?: string;
  ageRecipients?: string[];
};

export function createIdentityUpsertEntry(
  params: IdentityUpsertParams,
  timestamp: string
): Entry {
  if (params.author !== params.principalId) {
    throw new Error("Author must match principalId");
  }
  const payload = identityUpsertPayloadSchema.parse({
    principalId: params.principalId,
    displayName: params.displayName,
    ageRecipients: params.ageRecipients ?? [],
  });
  return {
    kind: "identity.upsert",
    timestamp,
    author: params.author,
    payload,
    signature: null,
  };
}

export function listIdentities(ledger: LedgerContainer): IdentityState {
  return replayIdentity(ledger);
}

export function getIdentity(
  ledger: LedgerContainer,
  principalId: string
): IdentityRecord | undefined {
  const state = replayIdentity(ledger);
  return state.principals[principalId];
}

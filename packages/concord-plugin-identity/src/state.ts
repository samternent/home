export type IdentityRecord = {
  principalId: string;
  displayName?: string;
  ageRecipients: string[];
  metadata?: Record<string, unknown>;
  updatedAt: string;
  updatedBy: string;
};

export type IdentityState = {
  principals: Record<string, IdentityRecord>;
};

export function createEmptyState(): IdentityState {
  return { principals: {} };
}

export function getPrincipal(
  state: IdentityState,
  principalId: string
): IdentityRecord | undefined {
  return state.principals[principalId];
}

export function resolveAgeRecipients(
  state: IdentityState,
  principalId: string
): string[] {
  return state.principals[principalId]?.ageRecipients ?? [];
}

export function resolveCurrentAgeRecipient(
  state: IdentityState,
  principalId: string
): string | undefined {
  const recipients = resolveAgeRecipients(state, principalId);
  if (recipients.length === 0) {
    return undefined;
  }
  return recipients[recipients.length - 1];
}

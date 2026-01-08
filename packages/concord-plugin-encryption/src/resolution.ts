import {
  getEffectiveCaps,
  type PermissionState,
} from "@ternent/concord-plugin-permissions";
import {
  resolveAgeRecipients,
  type IdentityState,
} from "@ternent/concord-plugin-identity";
import {
  replayPermissions,
  type ReplayConfig,
} from "@ternent/concord-plugin-permissions";
import { replayIdentity } from "@ternent/concord-plugin-identity";
import type { LedgerContainer } from "@ternent/concord-protocol";
import { replayEncryption } from "./replay";
import type { EncryptionState, WrapRecord } from "./state";

export type DecryptDiagnostics = {
  ok: boolean;
  reasons: string[];
  hasWrap: boolean;
  hasRecipient: boolean;
  hasRead: boolean;
};

export type DecryptabilityReason =
  | "NO_PERMISSION"
  | "NO_IDENTITY"
  | "NO_RECIPIENT"
  | "NO_WRAP"
  | "SCOPE_UNKNOWN"
  | "EPOCH_UNKNOWN";

export type DecryptabilityResult = {
  ok: boolean;
  scope: string;
  epoch?: number;
  reasons: DecryptabilityReason[];
  hasWrap: boolean;
  hasRecipient: boolean;
  hasRead: boolean;
};

export type ResolutionContext = {
  permissionsState?: PermissionState;
  identityState?: IdentityState;
  nowIso?: string;
};

export function findWrapsForPrincipal(
  state: EncryptionState,
  principalId: string,
  scope: string,
  epoch: number
): WrapRecord[] {
  return (state.wraps[scope]?.[epoch]?.[principalId] ?? []).slice();
}

export function findWrap(
  state: EncryptionState,
  principalId: string,
  scope: string,
  epoch: number
): WrapRecord | undefined {
  const wraps = findWrapsForPrincipal(state, principalId, scope, epoch);
  if (wraps.length === 0) {
    return undefined;
  }
  return wraps[wraps.length - 1];
}

export function explainWhyCannotDecrypt(
  state: EncryptionState,
  principalId: string,
  scope: string,
  epoch: number,
  context?: ResolutionContext
): DecryptDiagnostics {
  const reasons: string[] = [];
  const wraps = findWrapsForPrincipal(state, principalId, scope, epoch);
  const hasWrap = wraps.length > 0;

  let hasRecipient = true;
  if (context?.identityState) {
    const recipients = resolveAgeRecipients(context.identityState, principalId);
    hasRecipient = recipients.length > 0;
    if (!hasRecipient) {
      reasons.push("missing age recipients");
    }
  }

  let hasRead = true;
  if (context?.permissionsState) {
    const caps = getEffectiveCaps(
      context.permissionsState,
      principalId,
      scope,
      context.nowIso
    );
    hasRead = caps.has("read");
    if (!hasRead) {
      reasons.push("missing read capability");
    }
  }

  if (!hasWrap) {
    reasons.push("missing wrap for principal");
  }

  return {
    ok: hasWrap && hasRecipient && hasRead,
    reasons,
    hasWrap,
    hasRecipient,
    hasRead,
  };
}

export function explainDecryptability(
  ledger: LedgerContainer,
  principalId: string,
  rootAdmins?: string[],
  nowIso?: string
): DecryptabilityResult[] {
  const permissionsConfig: ReplayConfig | undefined = rootAdmins
    ? { rootAdmins }
    : undefined;
  const encryptionState = replayEncryption(ledger, undefined, {
    permissionsConfig,
  });
  const permissionsState = replayPermissions(ledger, undefined, permissionsConfig);
  const identityState = replayIdentity(ledger);
  const scopes = new Set<string>([
    ...Object.keys(encryptionState.scopes),
    ...Object.keys(encryptionState.wraps),
  ]);

  const results: DecryptabilityResult[] = [];

  for (const scope of scopes) {
    const reasons: DecryptabilityReason[] = [];
    const hasScopeState = Object.prototype.hasOwnProperty.call(
      encryptionState.scopes,
      scope
    );

    if (!hasScopeState) {
      results.push({
        ok: false,
        scope,
        reasons: ["SCOPE_UNKNOWN"],
        hasWrap: false,
        hasRecipient: false,
        hasRead: false,
      });
      continue;
    }

    const epoch = encryptionState.scopes[scope].currentEpoch;
    const epochWraps = encryptionState.wraps[scope]?.[epoch];

    let hasWrap = false;
    if (!epochWraps) {
      reasons.push("EPOCH_UNKNOWN");
    } else {
      hasWrap = Boolean(findWrap(encryptionState, principalId, scope, epoch));
      if (!hasWrap) {
        reasons.push("NO_WRAP");
      }
    }

    const identity = identityState.principals[principalId];
    let hasRecipient = false;
    if (!identity) {
      reasons.push("NO_IDENTITY");
    } else {
      hasRecipient = identity.ageRecipients.length > 0;
      if (!hasRecipient) {
        reasons.push("NO_RECIPIENT");
      }
    }

    const caps = getEffectiveCaps(
      permissionsState,
      principalId,
      scope,
      nowIso
    );
    const hasRead = caps.has("read");
    if (!hasRead) {
      reasons.push("NO_PERMISSION");
    }

    results.push({
      ok: reasons.length === 0,
      scope,
      epoch,
      reasons,
      hasWrap,
      hasRecipient,
      hasRead,
    });
  }

  return results;
}

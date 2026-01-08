import {
  getEffectiveCaps,
  type PermissionState,
} from "@ternent/concord-plugin-permissions";
import {
  resolveAgeRecipients,
  type IdentityState,
} from "@ternent/concord-plugin-identity";
import type { EncryptionState, WrapRecord } from "./state";

export type DecryptDiagnostics = {
  ok: boolean;
  reasons: string[];
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

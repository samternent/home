import {
  getEffectiveCaps,
  type PermissionState,
} from "@ternent/concord-plugin-permissions";
import {
  explainWhyCannotDecrypt,
  type EncryptionState,
  type ResolutionContext,
} from "@ternent/concord-plugin-encryption";

export type ExplainResult = {
  ok: boolean;
  reasons: string[];
  caps?: string[];
};

export function explainCannotGrant(
  permissions: PermissionState,
  principalId: string,
  scope: string
): ExplainResult {
  const caps = Array.from(getEffectiveCaps(permissions, principalId, scope));
  if (caps.includes("admin") || caps.includes("grant")) {
    return { ok: true, reasons: [], caps };
  }
  return {
    ok: false,
    reasons: ["missing grant capability"],
    caps,
  };
}

export function explainCannotDecrypt(
  encryption: EncryptionState,
  principalId: string,
  scope: string,
  epoch: number,
  context?: ResolutionContext
) {
  return explainWhyCannotDecrypt(
    encryption,
    principalId,
    scope,
    epoch,
    context
  );
}

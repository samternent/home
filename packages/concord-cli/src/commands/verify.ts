import {
  validateLedger,
  type LedgerContainer,
} from "@ternent/concord-protocol";
import { replayIdentity } from "@ternent/concord-plugin-identity";
import { replayPermissions } from "@ternent/concord-plugin-permissions";
import { replayEncryption } from "@ternent/concord-plugin-encryption";

export type VerifyResult = {
  ok: boolean;
  errors: string[];
};

export function verifyProtocol(ledger: LedgerContainer): VerifyResult {
  const result = validateLedger(ledger);
  return {
    ok: result.ok,
    errors: result.errors,
  };
}

export function verifySemantic(
  ledger: LedgerContainer,
  config?: { rootAdmins?: string[] }
): VerifyResult {
  try {
    replayIdentity(ledger);
    replayPermissions(ledger, undefined, { rootAdmins: config?.rootAdmins });
    replayEncryption(ledger, undefined, {
      permissionsConfig: { rootAdmins: config?.rootAdmins },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, errors: [message] };
  }
  return { ok: true, errors: [] };
}

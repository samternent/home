import {
  getCommitChain,
  getReplayEntries,
  validateLedger,
  type LedgerContainer,
} from "@ternent/concord-protocol";
import {
  replayIdentity,
  type IdentityState,
} from "@ternent/concord-plugin-identity";
import {
  replayPermissions,
  type PermissionState,
} from "@ternent/concord-plugin-permissions";
import {
  replayEncryption,
  type EncryptionState,
} from "@ternent/concord-plugin-encryption";
import { explainCannotGrant, explainCannotDecrypt } from "./explain";

export type InspectorConfig = {
  rootAdmins?: string[];
  nowIso?: string;
};

export type InspectorState = {
  protocolOk: boolean;
  protocolErrors: string[];
  commitChain: string[];
  entryKinds: Record<string, number>;
  identity: IdentityState;
  permissions: PermissionState;
  encryption: EncryptionState;
};

export function replayInspector(
  ledger: LedgerContainer,
  config?: InspectorConfig
): InspectorState {
  const protocol = validateLedger(ledger);
  const commitChain = getCommitChain(ledger);
  const entryKinds: Record<string, number> = {};
  for (const entry of getReplayEntries(ledger)) {
    entryKinds[entry.kind] = (entryKinds[entry.kind] ?? 0) + 1;
  }

  const identity = replayIdentity(ledger);
  const permissions = replayPermissions(ledger, undefined, {
    rootAdmins: config?.rootAdmins,
  });
  const encryption = replayEncryption(ledger, undefined, {
    permissionsConfig: { rootAdmins: config?.rootAdmins },
  });

  return {
    protocolOk: protocol.ok,
    protocolErrors: protocol.errors,
    commitChain,
    entryKinds,
    identity,
    permissions,
    encryption,
  };
}

export { explainCannotGrant, explainCannotDecrypt };

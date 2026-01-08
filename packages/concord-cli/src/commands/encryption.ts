import {
  replayEncryption,
  encryptedPayloadSchema,
  explainWhyCannotDecrypt,
  type EncryptionState,
} from "@ternent/concord-plugin-encryption";
import {
  replayIdentity,
  resolveAgeRecipients,
  type IdentityState,
} from "@ternent/concord-plugin-identity";
import {
  getEffectiveCaps,
  replayPermissions,
  type PermissionState,
} from "@ternent/concord-plugin-permissions";
import {
  getReplayEntries,
  getReplayEntryIds,
  type Entry,
  type LedgerContainer,
} from "@ternent/concord-protocol";

export type RotateResult = {
  entry: Entry;
  warnings: string[];
};

export type WrapResult = {
  entry: Entry;
  warnings: string[];
  hasRecipients: boolean;
};

export type DecryptCheck = {
  entryId: string;
  scope: string;
  epoch: number;
  ok: boolean;
  reasons: string[];
};

export function buildStates(
  ledger: LedgerContainer,
  rootAdmins?: string[]
): {
  identityState: IdentityState;
  permissionsState: PermissionState;
  encryptionState: EncryptionState;
} {
  const identityState = replayIdentity(ledger);
  const permissionsState = replayPermissions(ledger, undefined, { rootAdmins });
  const encryptionState = replayEncryption(ledger, undefined, {
    permissionsConfig: { rootAdmins },
  });
  return { identityState, permissionsState, encryptionState };
}

export function createRotateEntry(
  ledger: LedgerContainer,
  scope: string,
  author: string,
  rootAdmins?: string[]
): RotateResult {
  const { identityState, permissionsState, encryptionState } = buildStates(
    ledger,
    rootAdmins
  );
  const caps = getEffectiveCaps(permissionsState, author, scope);
  if (!caps.has("admin")) {
    throw new Error("UNAUTHORIZED_ROTATE");
  }
  const currentEpoch = encryptionState.scopes[scope]?.currentEpoch ?? 1;
  const newEpoch = currentEpoch + 1;

  const warnings: string[] = [];
  const wraps = Object.keys(identityState.principals).reduce(
    (acc, principalId) => {
      const principalCaps = getEffectiveCaps(
        permissionsState,
        principalId,
        scope
      );
      if (!principalCaps.has("read")) {
        return acc;
      }
      const recipients = resolveAgeRecipients(identityState, principalId);
      if (recipients.length === 0) {
        warnings.push(`Missing age recipients for ${principalId}`);
        return acc;
      }
      acc.push({
        principalId,
        epoch: newEpoch,
        wrap: {
          to: recipients,
          ct: `wrap:${scope}:${newEpoch}:${principalId}`,
        },
      });
      return acc;
    },
    [] as Array<{
      principalId: string;
      epoch: number;
      wrap: { to: string[]; ct: string };
    }>
  );

  const entry: Entry = {
    kind: "enc.epoch.rotate",
    timestamp: new Date().toISOString(),
    author,
    payload: {
      scope,
      newEpoch,
      wraps,
    },
    signature: null,
  };

  return { entry, warnings };
}

export function createWrapEntry(
  ledger: LedgerContainer,
  scope: string,
  epoch: number,
  principalId: string,
  author: string,
  rootAdmins?: string[],
  overrideRecipients?: string[]
): WrapResult {
  const { identityState, permissionsState } = buildStates(ledger, rootAdmins);
  const caps = getEffectiveCaps(permissionsState, author, scope);
  if (!caps.has("grant") && !caps.has("admin")) {
    throw new Error("UNAUTHORIZED_WRAP");
  }
  const targetCaps = getEffectiveCaps(permissionsState, principalId, scope);
  if (!targetCaps.has("read")) {
    throw new Error("INELIGIBLE_TARGET");
  }

  const warnings: string[] = [];
  const recipients =
    overrideRecipients && overrideRecipients.length > 0
      ? overrideRecipients
      : resolveAgeRecipients(identityState, principalId);
  if (recipients.length === 0) {
    warnings.push(`Missing age recipients for ${principalId}`);
  }
  const entry: Entry = {
    kind: "enc.wrap.publish",
    timestamp: new Date().toISOString(),
    author,
    payload: {
      scope,
      epoch,
      principalId,
      wrap: {
        to: recipients,
        ct: `wrap:${scope}:${epoch}:${principalId}`,
      },
    },
    signature: null,
  };

  return { entry, warnings, hasRecipients: recipients.length > 0 };
}

export function checkDecryptable(
  ledger: LedgerContainer,
  principalId: string,
  rootAdmins?: string[]
): DecryptCheck[] {
  const { encryptionState, identityState, permissionsState } = buildStates(
    ledger,
    rootAdmins
  );
  const entries = getReplayEntries(ledger);
  const entryIds = getReplayEntryIds(ledger);
  const checks: DecryptCheck[] = [];

  for (const [index, entry] of entries.entries()) {
    const payload = entry.payload;
    const parsed = encryptedPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      continue;
    }
    const diagnostics = explainWhyCannotDecrypt(
      encryptionState,
      principalId,
      parsed.data.scope,
      parsed.data.epoch,
      {
        identityState,
        permissionsState,
      }
    );
    const ok = diagnostics.ok;
    checks.push({
      entryId: entryIds[index] ?? String(index),
      scope: parsed.data.scope,
      epoch: parsed.data.epoch,
      ok,
      reasons: diagnostics.reasons,
    });
  }

  return checks;
}

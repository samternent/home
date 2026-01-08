import {
  replayEncryption,
  encryptedPayloadSchema,
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
  type: "entry" | "scope";
  entryId?: string;
  scope: string;
  epoch?: number;
  ok: boolean;
  reasons: string[];
  cryptoOk?: boolean;
  policyOk?: boolean;
};

export type DecryptMode = "combined" | "crypto" | "policy";

function cliError(code: string, message: string): Error {
  const error = new Error(message);
  (error as Error & { code?: string }).code = code;
  return error;
}

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
    throw cliError("UNAUTHORIZED_ROTATE", "enc.epoch.rotate requires admin capability");
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
    throw cliError("UNAUTHORIZED_WRAP", "enc.wrap.publish requires grant or admin capability");
  }
  const targetCaps = getEffectiveCaps(permissionsState, principalId, scope);
  if (!targetCaps.has("read")) {
    throw cliError("INELIGIBLE_TARGET", "wrap target must have read capability");
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
  rootAdmins?: string[],
  nowIso?: string,
  mode: DecryptMode = "combined"
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
    const scope = parsed.data.scope;
    const epoch = parsed.data.epoch;
    const crypto = evaluateCrypto(encryptionState, principalId, scope, epoch);
    const policy = evaluatePolicy(
      identityState,
      permissionsState,
      principalId,
      scope,
      nowIso
    );
    const selected = selectMode(mode, crypto, policy);
    checks.push({
      type: "entry",
      entryId: entryIds[index] ?? String(index),
      scope,
      epoch,
      ok: selected.ok,
      reasons: selected.reasons,
      cryptoOk: crypto.ok,
      policyOk: policy.ok,
    });
  }

  if (checks.length === 0) {
    const scopeEpochs = new Map<string, number>();
    for (const scope of Object.keys(encryptionState.scopes)) {
      scopeEpochs.set(scope, encryptionState.scopes[scope].currentEpoch);
    }
    for (const [scope, epochs] of Object.entries(encryptionState.wraps)) {
      if (scopeEpochs.has(scope)) {
        continue;
      }
      const epochNumbers = Object.keys(epochs).map((value) => Number(value));
      const highest = epochNumbers.length > 0 ? Math.max(...epochNumbers) : 1;
      scopeEpochs.set(scope, Number.isFinite(highest) ? highest : 1);
    }
    for (const [scope, epoch] of scopeEpochs.entries()) {
      const crypto = evaluateCrypto(encryptionState, principalId, scope, epoch);
      const policy = evaluatePolicy(
        identityState,
        permissionsState,
        principalId,
        scope,
        nowIso
      );
      const selected = selectMode(mode, crypto, policy);
      checks.push({
        type: "scope",
        scope,
        epoch,
        ok: selected.ok,
        reasons: selected.reasons,
        cryptoOk: crypto.ok,
        policyOk: policy.ok,
      });
    }
  }

  return checks;
}

type Diagnostic = { ok: boolean; reasons: string[] };

function evaluateCrypto(
  encryptionState: EncryptionState,
  principalId: string,
  scope: string,
  epoch: number
): Diagnostic {
  const reasons: string[] = [];
  const scopeState = encryptionState.scopes[scope];
  const scopeWraps = encryptionState.wraps[scope];
  if (!scopeState && !scopeWraps) {
    return { ok: false, reasons: ["SCOPE_UNKNOWN"] };
  }
  const epochWraps = scopeWraps?.[epoch];
  if (!epochWraps) {
    return { ok: false, reasons: ["EPOCH_UNKNOWN"] };
  }
  const wraps = epochWraps[principalId] ?? [];
  if (wraps.length === 0) {
    reasons.push("NO_WRAP");
  }
  return { ok: reasons.length === 0, reasons };
}

function evaluatePolicy(
  identityState: IdentityState,
  permissionsState: PermissionState,
  principalId: string,
  scope: string,
  nowIso?: string
): Diagnostic {
  const reasons: string[] = [];
  const identity = identityState.principals[principalId];
  if (!identity) {
    reasons.push("NO_IDENTITY");
  } else if (identity.ageRecipients.length === 0) {
    reasons.push("NO_RECIPIENT");
  }
  const caps = getEffectiveCaps(permissionsState, principalId, scope, nowIso);
  if (!caps.has("read")) {
    reasons.push("NO_PERMISSION");
  }
  return { ok: reasons.length === 0, reasons };
}

function selectMode(
  mode: DecryptMode,
  crypto: Diagnostic,
  policy: Diagnostic
): Diagnostic {
  if (mode === "crypto") {
    return crypto;
  }
  if (mode === "policy") {
    return policy;
  }
  return {
    ok: crypto.ok && policy.ok,
    reasons: [...crypto.reasons, ...policy.reasons],
  };
}

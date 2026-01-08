import {
  ConcordProtocolError,
  getCommitChain,
  isGenesisCommit,
  type Entry,
  type LedgerContainer,
} from "@ternent/concord-protocol";
import {
  getEffectiveCaps,
  replayPermissions,
  type PermissionState,
} from "@ternent/concord-plugin-permissions";
import {
  replayIdentity,
  resolveAgeRecipients,
  type IdentityState,
} from "@ternent/concord-plugin-identity";
import {
  encEpochRotatePayloadSchema,
  encWrapPublishPayloadSchema,
  type EncEpochRotatePayload,
  type EncWrapPublishPayload,
} from "./schemas";
import {
  addWrap,
  addWarning,
  createEmptyState,
  getScopeState,
  type EncryptionReplayConfig,
  type EncryptionState,
} from "./state";

export class EncryptionRegistryError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "EncryptionRegistryError";
    this.code = code;
  }
}

function parsePayload<T>(
  schema: { safeParse: (value: unknown) => any },
  payload: unknown
): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new EncryptionRegistryError(
      "INVALID_PAYLOAD",
      result.error.issues
        .map((issue: { message: string }) => issue.message)
        .join("; ")
    );
  }
  return result.data as T;
}

function ensureAdmin(
  permissionsState: PermissionState,
  author: string,
  scope: string
) {
  const caps = getEffectiveCaps(permissionsState, author, scope);
  if (!caps.has("admin")) {
    throw new EncryptionRegistryError(
      "UNAUTHORIZED_ROTATE",
      "enc.epoch.rotate requires admin capability"
    );
  }
}

function ensureGrantOrAdmin(
  permissionsState: PermissionState,
  author: string,
  scope: string
) {
  const caps = getEffectiveCaps(permissionsState, author, scope);
  if (!caps.has("grant") && !caps.has("admin")) {
    throw new EncryptionRegistryError(
      "UNAUTHORIZED_WRAP",
      "enc.wrap.publish requires grant or admin capability"
    );
  }
}

function ensureReadable(
  permissionsState: PermissionState,
  principalId: string,
  scope: string
) {
  const caps = getEffectiveCaps(permissionsState, principalId, scope);
  if (!caps.has("read")) {
    throw new EncryptionRegistryError(
      "INELIGIBLE_TARGET",
      "wrap target must have read capability"
    );
  }
}

function ensureRecipientsMatch(
  identityState: IdentityState,
  scope: string,
  principalId: string,
  toRecipients: string[],
  state: EncryptionState
): EncryptionState {
  const recipients = resolveAgeRecipients(identityState, principalId);
  if (recipients.length === 0) {
    return addWarning(state, {
      code: "MISSING_RECIPIENTS",
      message: "principal has no registered age recipients",
      scope,
      principalId,
    });
  }

  for (const recipient of recipients) {
    if (!toRecipients.includes(recipient)) {
      throw new EncryptionRegistryError(
        "INVALID_PAYLOAD",
        "wrap recipients must include all registered age recipients"
      );
    }
  }

  return state;
}

function sliceLedgerForEntry(
  ledger: LedgerContainer,
  commitId: string,
  entryIndex: number
): LedgerContainer {
  const commit = ledger.commits[commitId];
  if (!commit) {
    return ledger;
  }
  const slicedCommit = {
    ...commit,
    entries: commit.entries.slice(0, entryIndex),
  };
  return {
    ...ledger,
    commits: {
      ...ledger.commits,
      [commitId]: slicedCommit,
    },
    head: commitId,
  };
}

function getDependencyStates(
  ledger: LedgerContainer,
  commitId: string,
  entryIndex: number,
  config?: EncryptionReplayConfig
): { permissionsState: PermissionState; identityState: IdentityState } {
  const partialLedger = sliceLedgerForEntry(ledger, commitId, entryIndex);
  return {
    permissionsState: replayPermissions(
      partialLedger,
      commitId,
      config?.permissionsConfig
    ),
    identityState: replayIdentity(partialLedger, commitId),
  };
}

function applyEpochRotate(
  state: EncryptionState,
  entry: Entry,
  payload: EncEpochRotatePayload,
  permissionsState: PermissionState,
  identityState: IdentityState
): EncryptionState {
  ensureAdmin(permissionsState, entry.author, payload.scope);
  const scopeState = getScopeState(state, payload.scope);
  if (payload.newEpoch !== scopeState.currentEpoch + 1) {
    throw new EncryptionRegistryError(
      "INVALID_EPOCH_TRANSITION",
      "newEpoch must equal currentEpoch + 1"
    );
  }

  let nextState: EncryptionState = {
    ...state,
    scopes: {
      ...state.scopes,
      [payload.scope]: {
        currentEpoch: payload.newEpoch,
      },
    },
  };

  for (const wrap of payload.wraps) {
    if (wrap.epoch !== payload.newEpoch) {
      throw new EncryptionRegistryError(
        "INVALID_PAYLOAD",
        "wrap.epoch must equal newEpoch"
      );
    }
    ensureReadable(permissionsState, wrap.principalId, payload.scope);
    nextState = ensureRecipientsMatch(
      identityState,
      payload.scope,
      wrap.principalId,
      wrap.wrap.to,
      nextState
    );
    nextState = addWrap(nextState, {
      scope: payload.scope,
      epoch: wrap.epoch,
      principalId: wrap.principalId,
      wrap: {
        to: wrap.wrap.to,
        ct: wrap.wrap.ct,
      },
      publishedBy: entry.author,
      publishedAt: entry.timestamp,
      source: "rotate",
    });
  }

  return nextState;
}

function applyWrapPublish(
  state: EncryptionState,
  entry: Entry,
  payload: EncWrapPublishPayload,
  permissionsState: PermissionState,
  identityState: IdentityState
): EncryptionState {
  ensureGrantOrAdmin(permissionsState, entry.author, payload.scope);
  ensureReadable(permissionsState, payload.principalId, payload.scope);
  let nextState = ensureRecipientsMatch(
    identityState,
    payload.scope,
    payload.principalId,
    payload.wrap.to,
    state
  );
  nextState = addWrap(nextState, {
    scope: payload.scope,
    epoch: payload.epoch,
    principalId: payload.principalId,
    wrap: {
      to: payload.wrap.to,
      ct: payload.wrap.ct,
    },
    publishedBy: entry.author,
    publishedAt: entry.timestamp,
    source: "publish",
  });
  return nextState;
}

export function replayEncryption(
  ledger: LedgerContainer,
  head?: string,
  config?: EncryptionReplayConfig
): EncryptionState {
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
    for (let index = 0; index < commit.entries.length; index += 1) {
      const entryId = commit.entries[index];
      const entry = replayLedger.entries[entryId];
      if (!entry) {
        throw new ConcordProtocolError(
          "MISSING_ENTRY",
          `Missing entry ${entryId}`
        );
      }
      if (
        entry.kind !== "enc.epoch.rotate" &&
        entry.kind !== "enc.wrap.publish"
      ) {
        continue;
      }

      const { permissionsState, identityState } = getDependencyStates(
        replayLedger,
        commitId,
        index,
        config
      );

      if (entry.kind === "enc.epoch.rotate") {
        const payload = parsePayload<EncEpochRotatePayload>(
          encEpochRotatePayloadSchema,
          entry.payload
        );
        state = applyEpochRotate(
          state,
          entry,
          payload,
          permissionsState,
          identityState
        );
      } else if (entry.kind === "enc.wrap.publish") {
        const payload = parsePayload<EncWrapPublishPayload>(
          encWrapPublishPayloadSchema,
          entry.payload
        );
        state = applyWrapPublish(
          state,
          entry,
          payload,
          permissionsState,
          identityState
        );
      }
    }
  }

  return state;
}

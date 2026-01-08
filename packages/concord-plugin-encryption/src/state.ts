export type WrapRecord = {
  scope: string;
  epoch: number;
  principalId: string;
  wrap: {
    to: string[];
    ct: string;
  };
  publishedBy: string;
  publishedAt: string;
  source: "rotate" | "publish";
};

export type ScopeState = {
  currentEpoch: number;
};

export type EncryptionWarning = {
  code: string;
  message: string;
  scope?: string;
  principalId?: string;
};

export type EncryptionState = {
  scopes: Record<string, ScopeState>;
  wraps: Record<string, Record<number, Record<string, WrapRecord[]>>>;
  warnings: EncryptionWarning[];
};

export type EncryptionReplayConfig = {
  permissionsConfig?: {
    rootAdmins?: string[];
  };
};

export function createEmptyState(): EncryptionState {
  return {
    scopes: {},
    wraps: {},
    warnings: [],
  };
}

export function getScopeState(
  state: EncryptionState,
  scope: string
): ScopeState {
  return state.scopes[scope] ?? { currentEpoch: 1 };
}

export function addWrap(
  state: EncryptionState,
  record: WrapRecord
): EncryptionState {
  const scopeWraps = state.wraps[record.scope] ?? {};
  const epochWraps = scopeWraps[record.epoch] ?? {};
  const principalWraps = epochWraps[record.principalId] ?? [];

  return {
    ...state,
    wraps: {
      ...state.wraps,
      [record.scope]: {
        ...scopeWraps,
        [record.epoch]: {
          ...epochWraps,
          [record.principalId]: [...principalWraps, record],
        },
      },
    },
  };
}

export function addWarning(
  state: EncryptionState,
  warning: EncryptionWarning
): EncryptionState {
  return {
    ...state,
    warnings: [...state.warnings, warning],
  };
}

import type {
  LedgerAppendInput,
  LedgerArmourContract,
  LedgerContainer,
  LedgerInstance,
  LedgerProtocolContract,
  LedgerReplayEntry,
  LedgerSealContract,
  LedgerStorageAdapter,
  LedgerVerificationResult
} from "@ternent/ledger";

export type ConcordCreateParams = {
  metadata?: Record<string, unknown>;
};

export type ConcordReplayOptions = {
  verify?: boolean;
  decrypt?: boolean;
};

export type ConcordState = {
  ready: boolean;
  integrityValid: boolean;
  stagedCount: number;
  plugins: Record<string, unknown>;
  verification: LedgerVerificationResult | null;
};

export type ConcordCommandResult = {
  commitId?: string;
  entryIds: string[];
  stagedCount: number;
};

export type ConcordCommitInput = {
  metadata?: Record<string, unknown>;
};

export type ConcordCommitResult = {
  commitId: string;
  entryIds: string[];
};

export type ConcordRuntimePolicy = {
  autoCommit?: boolean;
};

export type ConcordIdentityContext = {
  author: string;
  signer?: unknown;
  decryptor?: unknown;
};

export type ConcordCommandContext = {
  now(): string;
  identity: ConcordIdentityContext;
  getPluginState<T = unknown>(pluginId: string): T;
};

export type ConcordProjectionContext = {
  decryptAvailable: boolean;
};

export type ConcordPlugin<PState = unknown> = {
  id: string;
  initialState(): PState;
  commands?: Record<
    string,
    (
      ctx: ConcordCommandContext,
      input: unknown
    ) => Promise<LedgerAppendInput | LedgerAppendInput[]> | LedgerAppendInput | LedgerAppendInput[]
  >;
  project(
    state: PState,
    entry: LedgerReplayEntry,
    ctx: ConcordProjectionContext
  ): PState;
  selectors?: Record<string, (state: PState) => unknown>;
};

export type ConcordReplayAppView = {
  getState(): Readonly<ConcordState>;
  getPluginState<T = unknown>(pluginId: string): T;
};

export type ConcordProjectionReplayContext = {
  app: ConcordReplayAppView;
};

export type ConcordProjectionTarget = {
  name: string;
  reset(): Promise<void> | void;
  beginReplay?(ctx: ConcordProjectionReplayContext): Promise<void> | void;
  applyEntry(
    entry: LedgerReplayEntry,
    ctx: ConcordProjectionReplayContext
  ): Promise<void> | void;
  endReplay?(ctx: ConcordProjectionReplayContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
};

export type CreateConcordAppInput = {
  identity: ConcordIdentityContext;
  storage: LedgerStorageAdapter;
  plugins: ConcordPlugin[];
  now?: () => string;
  protocol?: LedgerProtocolContract;
  seal?: LedgerSealContract;
  armour?: LedgerArmourContract;
  ledger?: LedgerInstance<unknown>;
  projectionTargets?: ConcordProjectionTarget[];
  policy?: ConcordRuntimePolicy;
};

export type ConcordApp = {
  create(params?: ConcordCreateParams): Promise<void>;
  load(): Promise<void>;
  command<TInput = unknown>(
    type: string,
    input: TInput
  ): Promise<ConcordCommandResult>;
  commit(input?: ConcordCommitInput): Promise<ConcordCommitResult>;
  replay(options?: ConcordReplayOptions): Promise<void>;
  recompute(): Promise<void>;
  verify(): Promise<LedgerVerificationResult>;
  exportLedger(): Promise<LedgerContainer>;
  importLedger(container: LedgerContainer): Promise<void>;
  getState(): Readonly<ConcordState>;
  getPluginState<T = unknown>(pluginId: string): T;
  subscribe(listener: (state: Readonly<ConcordState>) => void): () => void;
  destroy(): Promise<void>;
};

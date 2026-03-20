import type {
  LedgerAppendInput,
  LedgerArmourContract,
  LedgerContainer,
  LedgerInstance,
  LedgerProtocolContract,
  LedgerReplayEntry,
  LedgerSealContract,
  LedgerStorageAdapter,
  LedgerVerificationResult,
} from "@ternent/ledger";

import type { SerializedIdentity } from "@ternent/identity";

export type ConcordCreateParams = {
  metadata?: Record<string, unknown>;
};

export type ConcordReplayOptions = {
  verify?: boolean;
  decrypt?: boolean;
  fromEntryId?: string;
  toEntryId?: string;
};

export type ConcordState = {
  ready: boolean;
  integrityValid: boolean;
  stagedCount: number;
  replay: Record<string, unknown>;
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

export type ConcordAppIdentity = {
  author: string;
  signer?: {
    identity: SerializedIdentity;
  };
  decryptor?: {
    identity: SerializedIdentity;
  };
};

export type ConcordCommandContext = {
  now(): string;
  identity: ConcordAppIdentity;
  getReplayState<T = unknown>(pluginId: string): T;
};

export type ConcordReplayPhase =
  | "reset"
  | "beginReplay"
  | "applyEntry"
  | "endReplay";

export type ConcordReplayMetadata = {
  phase: ConcordReplayPhase;
  entryIndex?: number;
  entryCount: number;
  fromEntryId?: string;
  toEntryId?: string;
  isPartial: boolean;
};

export type ConcordReplayContext<TState = unknown> = {
  pluginId: string;
  decryptAvailable: boolean;
  replay: ConcordReplayMetadata;
  getState(): TState;
  setState(next: TState | ((prev: TState) => TState)): void;
};

export type ConcordCommandHandler = (
  ctx: ConcordCommandContext,
  input: unknown,
) =>
  | Promise<LedgerAppendInput | LedgerAppendInput[]>
  | LedgerAppendInput
  | LedgerAppendInput[];

export type ConcordReplayPlugin<TState = unknown> = {
  id: string;
  initialState?: () => TState;
  commands?: Record<string, ConcordCommandHandler>;
  reset?: (ctx: ConcordReplayContext<TState>) => Promise<void> | void;
  beginReplay?: (ctx: ConcordReplayContext<TState>) => Promise<void> | void;
  applyEntry?: (
    entry: LedgerReplayEntry,
    ctx: ConcordReplayContext<TState>,
  ) => Promise<void> | void;
  endReplay?: (ctx: ConcordReplayContext<TState>) => Promise<void> | void;
  destroy?(): Promise<void> | void;
  selectors?: Record<string, (state: TState) => unknown>;
};

export type CreateConcordAppInput = {
  identity: ConcordAppIdentity;
  storage?: LedgerStorageAdapter;
  plugins: ConcordReplayPlugin[];
  now?: () => string;
  protocol?: LedgerProtocolContract;
  seal?: LedgerSealContract;
  armour?: LedgerArmourContract;
  ledger?: LedgerInstance<LedgerReplayEntry[]>;
  policy?: ConcordRuntimePolicy;
};

export type ConcordApp = {
  create(params?: ConcordCreateParams): Promise<void>;
  load(): Promise<void>;
  command<TInput = unknown>(
    type: string,
    input: TInput,
  ): Promise<ConcordCommandResult>;
  commit(input?: ConcordCommitInput): Promise<ConcordCommitResult>;
  replay(options?: ConcordReplayOptions): Promise<void>;
  recompute(): Promise<void>;
  verify(): Promise<LedgerVerificationResult>;
  exportLedger(): Promise<LedgerContainer>;
  importLedger(container: LedgerContainer): Promise<void>;
  getState(): Readonly<ConcordState>;
  getReplayState<T = unknown>(pluginId: string): T;
  subscribe(listener: (state: Readonly<ConcordState>) => void): () => void;
  destroy(): Promise<void>;
};

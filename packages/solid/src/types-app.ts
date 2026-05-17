import type {
  ConcordApp,
  ConcordCommandResult,
  ConcordCommitInput,
  ConcordCommitResult,
  ConcordReplayOptions,
  ConcordReplayPlugin,
  ConcordRuntimePolicy,
  ConcordState,
} from "@ternent/concord";
import type { SerializedIdentity } from "@ternent/identity";
import type {
  LedgerArmourContract,
  LedgerProtocolContract,
  LedgerSealContract,
  LedgerStorageAdapter,
  LedgerVerificationResult,
  LedgerInstance,
  LedgerReplayEntry,
} from "@ternent/ledger";
import type { ResolveSolidIdentityInput } from "./types-identity.js";
import type {
  SolidConcordAccessReport,
  SolidConcordResources,
  SolidProfileOptions,
  SolidSessionLike,
} from "./types-profile.js";

export type CreateSolidStorageOptions = {
  contentType?: string;
};

export type CreateSolidConcordAppOptions = ResolveSolidIdentityInput & {
  session: SolidSessionLike;
  ledgerUrl?: string;
  plugins: ConcordReplayPlugin[];
  storageOptions?: CreateSolidStorageOptions;
  encryption?: boolean;
  now?: () => string;
  protocol?: LedgerProtocolContract;
  seal?: LedgerSealContract;
  armour?: LedgerArmourContract;
  ledger?: LedgerInstance<LedgerReplayEntry[]>;
  policy?: ConcordRuntimePolicy;
  profile?: SolidProfileOptions;
};

export type CreateSolidConcordAppResult = {
  app: ConcordApp;
  identity: SerializedIdentity;
  storage: LedgerStorageAdapter;
  resources?: SolidConcordResources;
  accessReport?: SolidConcordAccessReport;
};

export type SolidConcordManagerState = {
  status: "idle" | "loading" | "ready" | "error";
  loading: boolean;
  ready: boolean;
  error: Error | null;
  webId: string | null;
  identity: SerializedIdentity | null;
  app: ConcordApp | null;
  concordState: Readonly<ConcordState> | null;
  lastCommit: ConcordCommitResult | null;
  lastVerification: LedgerVerificationResult | null;
};

export type SolidConcordManager = {
  getState(): Readonly<SolidConcordManagerState>;
  subscribe(listener: (state: Readonly<SolidConcordManagerState>) => void): () => void;
  init(): Promise<CreateSolidConcordAppResult>;
  reload(): Promise<void>;
  command<TInput = unknown>(type: string, input: TInput): Promise<ConcordCommandResult>;
  commit(input?: ConcordCommitInput): Promise<ConcordCommitResult>;
  replay(options?: ConcordReplayOptions): Promise<void>;
  verify(): Promise<LedgerVerificationResult>;
  destroy(): Promise<void>;
};

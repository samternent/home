import type {
  ConcordApp,
  ConcordCommandResult,
  ConcordCommitInput,
  ConcordCommitResult,
  ConcordReplayOptions,
  ConcordReplayPlugin,
  ConcordState,
  ConcordRuntimePolicy,
} from "@ternent/concord";
import type { MnemonicWordCount, SerializedIdentity } from "@ternent/identity";
import type {
  LedgerArmourContract,
  LedgerProtocolContract,
  LedgerSealContract,
  LedgerStorageAdapter,
  LedgerVerificationResult,
  LedgerInstance,
  LedgerReplayEntry,
} from "@ternent/ledger";

export type SolidSessionLike = {
  info: {
    webId?: string | null;
    isLoggedIn?: boolean;
  };
  fetch: typeof fetch;
};

export type CreateSolidMnemonicIdentityOptions = {
  words?: MnemonicWordCount;
  passphrase?: string;
  createdAt?: string;
};

export type CreateSolidIdentityFromMnemonicOptions = {
  mnemonic: string;
  passphrase?: string;
  createdAt?: string;
};

export type SolidMnemonicSecret = {
  format: "ternent-solid-mnemonic";
  version: "1";
  createdAt: string;
  webId: string | null;
  keyId: string;
  publicKey: string;
  mnemonic: string;
  mnemonicPassphrase: string | null;
};

export type SolidWalletBackup = {
  format: "ternent-solid-wallet";
  version: "1";
  createdAt: string;
  webId: string | null;
  keyId: string;
  publicKey: string;
  ciphertext: string;
  encryption: {
    scheme: "armour-passphrase";
    encoding: "armor";
  };
};

export type SolidVerificationDocument = {
  format: "ternent-solid-verification";
  version: "1";
  createdAt: string;
  webId: string | null;
  keyId: string;
  publicKey: string;
  algorithm: "Ed25519";
  proofPurpose: "assertionMethod";
};

export type CreateSolidWalletBackupOptions = {
  identity: SerializedIdentity | string;
  passphrase: string;
  webId?: string | null;
  createdAt?: string;
};

export type CreateSolidMnemonicSecretOptions = {
  mnemonic: string;
  mnemonicPassphrase?: string;
  webId?: string | null;
  createdAt?: string;
  identity?: SerializedIdentity;
};

export type RestoreSolidIdentityFromMnemonicSecretOptions = {
  secret: SolidMnemonicSecret | string;
  expectedWebId?: string;
};

export type RestoreSolidIdentityFromBackupOptions = {
  backup: SolidWalletBackup | string;
  passphrase: string;
  expectedWebId?: string;
};

export type CreateSolidStorageOptions = {
  contentType?: string;
};

export type CreateSolidWalletStorageOptions = {
  contentType?: string;
};

export type CreateSolidMnemonicStorageOptions = {
  contentType?: string;
};

export type SolidAccessValidationMode = "off" | "warn" | "strict";

export type SolidProfileOptions = {
  enabled?: boolean;
  discover?: boolean;
  bootstrap?: boolean;
  accessValidation?: SolidAccessValidationMode;
  appPath?: string;
  podRoot?: string;
  preferencesUrl?: string;
  publicTypeIndexUrl?: string;
  privateTypeIndexUrl?: string;
  verificationUrl?: string;
};

export type CreateSolidConcordPathsOptions = {
  appPath?: string;
  podRoot?: string;
  preferencesUrl?: string;
  publicTypeIndexUrl?: string;
  privateTypeIndexUrl?: string;
  verificationUrl?: string;
};

export type SolidConcordPaths = {
  webId: string;
  profileUrl: string;
  podRoot: string;
  settingsRootUrl: string;
  appRootUrl: string;
  systemRootUrl: string;
  systemPrivateRootUrl: string;
  workspaceRootUrl: string;
  workspacePrivateRootUrl: string;
  workspaceSharedRootUrl: string;
  workspacePublicRootUrl: string;
  privateRootUrl: string;
  publicRootUrl: string;
  preferencesUrl: string;
  publicTypeIndexUrl: string;
  privateTypeIndexUrl: string;
  mnemonicUrl: string;
  walletUrl: string;
  ledgerUrl: string;
  peopleUrl: string;
  verificationUrl: string;
};

export type SolidConcordResources = {
  webId: string;
  profileUrl: string;
  podRoot: string | null;
  settingsRootUrl: string | null;
  appRootUrl: string | null;
  systemRootUrl: string | null;
  systemPrivateRootUrl: string | null;
  workspaceRootUrl: string | null;
  workspacePrivateRootUrl: string | null;
  workspaceSharedRootUrl: string | null;
  workspacePublicRootUrl: string | null;
  privateRootUrl: string | null;
  publicRootUrl: string | null;
  preferencesUrl: string | null;
  publicTypeIndexUrl: string | null;
  privateTypeIndexUrl: string | null;
  mnemonicUrl: string | null;
  walletUrl: string | null;
  ledgerUrl: string | null;
  peopleUrl: string | null;
  verificationUrl: string | null;
  seeAlso: string[];
};

export type SolidConcordAccessCheck = {
  name: "mnemonic" | "wallet" | "verification";
  url: string;
  expectedAccess: "private" | "public";
  anonymousRead: "yes" | "no" | "unknown";
  safe: boolean;
  issue: string | null;
};

export type SolidConcordAccessReport = {
  safe: boolean;
  issues: string[];
  checks: SolidConcordAccessCheck[];
};

export type BootstrapSolidConcordProfileOptions = CreateSolidConcordPathsOptions & {
  session: SolidSessionLike;
  mnemonicUrl?: string | null;
  walletUrl?: string | null;
  ledgerUrl?: string | null;
  peopleUrl?: string | null;
  identity?: SerializedIdentity | null;
  createdAt?: string;
};

export type ConcordOsPerson = {
  webId: string;
  label: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
};

export type ConcordOsPeopleRegistry = {
  format: "ternent-concord-os-people";
  version: "1";
  createdAt: string;
  updatedAt: string;
  people: ConcordOsPerson[];
};

export type CreateConcordOsPeopleStorageOptions = {
  contentType?: string;
};

export type SolidWorkspaceScope = "private" | "shared" | "public";
export type SolidWorkspaceEntryKind = "container" | "file";
export type SolidWorkspacePreviewMode = "ledger" | "text" | "image" | "binary";
export type SolidWorkspaceVisibility = "private" | "shared" | "public" | "unknown";
export type SolidWorkspaceAnonymousRead = "yes" | "no" | "unknown";

export type SolidWorkspaceEntry = {
  url: string;
  parentUrl: string | null;
  name: string;
  path: string;
  kind: SolidWorkspaceEntryKind;
  scope: SolidWorkspaceScope;
  contentType: string | null;
  size: number | null;
  lastModified: string | null;
  etag: string | null;
  isLedger: boolean;
};

export type SolidWorkspaceBrowseResult = {
  url: string;
  parentUrl: string | null;
  scope: SolidWorkspaceScope;
  path: string;
  entries: SolidWorkspaceEntry[];
};

export type SolidWorkspaceLedgerSummary = {
  head: string | null;
  commitCount: number;
  entryCount: number;
  valid: boolean;
};

export type SolidWorkspaceReadResult = {
  entry: SolidWorkspaceEntry;
  mode: SolidWorkspacePreviewMode;
  contentType: string | null;
  text: string | null;
  blob: Blob | null;
  ledger: SolidWorkspaceLedgerSummary | null;
};

export type SolidWorkspaceAccessGrant = {
  webId: string;
  read: boolean;
  append: boolean;
  write: boolean;
  control: boolean;
};

export type SolidWorkspaceAccessSummary = {
  url: string;
  scope: SolidWorkspaceScope;
  visibility: SolidWorkspaceVisibility;
  publicRead: SolidWorkspaceAnonymousRead;
  grants: SolidWorkspaceAccessGrant[];
  warnings: string[];
};

export type SolidWorkspaceAccessInput = {
  publicRead?: boolean;
  agents?: string[];
};

export type SolidWorkspaceWriteOptions = SolidWorkspaceAccessInput & {
  contentType?: string;
};

export type CreateSolidWorkspaceOptions = CreateSolidConcordPathsOptions & {
  session: SolidSessionLike;
  paths?: SolidConcordPaths;
  now?: () => string;
};

export type SolidWorkspace = {
  paths: SolidConcordPaths;
  ensure(): Promise<void>;
  list(url?: string): Promise<SolidWorkspaceBrowseResult>;
  stat(url: string): Promise<SolidWorkspaceEntry | null>;
  createFolder(
    parentUrl: string,
    name: string,
    options?: SolidWorkspaceWriteOptions,
  ): Promise<SolidWorkspaceEntry>;
  createLedger(
    parentUrl: string,
    name: string,
    input: SolidWorkspaceWriteOptions & { identity: SerializedIdentity },
  ): Promise<SolidWorkspaceEntry>;
  uploadFile(
    parentUrl: string,
    name: string,
    data: Blob | ArrayBuffer | string,
    options?: SolidWorkspaceWriteOptions,
  ): Promise<SolidWorkspaceEntry>;
  rename(
    url: string,
    nextName: string,
    options?: SolidWorkspaceWriteOptions,
  ): Promise<SolidWorkspaceEntry>;
  move(
    url: string,
    parentUrl: string,
    nextName?: string,
    options?: SolidWorkspaceWriteOptions,
  ): Promise<SolidWorkspaceEntry>;
  delete(url: string): Promise<void>;
  read(url: string): Promise<SolidWorkspaceReadResult>;
  inspectAccess(url: string): Promise<SolidWorkspaceAccessSummary>;
  applyAccess(url: string, input: SolidWorkspaceAccessInput): Promise<SolidWorkspaceAccessSummary>;
};

export type SolidIdentityCacheStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type SolidIdentityCacheLike = {
  name: string;
  key: string;
  load(): Promise<SerializedIdentity | null>;
  save(identity: SerializedIdentity): Promise<void>;
  clear(): Promise<void>;
};

export type CreateSolidIdentityCacheOptions = {
  key?: string;
  webId?: string;
  session?: SolidSessionLike;
  storage?: SolidIdentityCacheStorageLike;
  namespace?: string;
};

export type ResolveSolidIdentityInput = {
  identity?: SerializedIdentity;
  cache?: SolidIdentityCacheLike;
  mnemonic?: string;
  mnemonicPassphrase?: string;
  mnemonicSecret?: SolidMnemonicSecret | string;
  mnemonicUrl?: string;
  mnemonicContentType?: string;
  walletBackup?: SolidWalletBackup | string;
  walletUrl?: string;
  walletPassphrase?: string;
  walletContentType?: string;
  createdAt?: string;
  expectedWebId?: string;
};

export type ProvisionSolidIdentityOptions = {
  session: SolidSessionLike;
  words?: MnemonicWordCount;
  mnemonicPassphrase?: string;
  createdAt?: string;
  webId?: string | null;
  walletPassphrase?: string;
  walletUrl?: string;
  walletContentType?: string;
  mnemonicUrl?: string;
  mnemonicContentType?: string;
  cache?: SolidIdentityCacheLike;
  profile?: SolidProfileOptions;
};

export type ProvisionSolidIdentityResult = {
  identity: SerializedIdentity;
  mnemonic: string;
  mnemonicSecret: SolidMnemonicSecret;
  walletBackup: SolidWalletBackup;
  resources?: SolidConcordResources;
  accessReport?: SolidConcordAccessReport;
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

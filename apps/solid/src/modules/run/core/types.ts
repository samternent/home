import type { ComputedRef } from "vue";
import type {
  RunIdentityBootstrapCandidate,
  RunIdentityRecord,
  RunIdentityStatus,
} from "@/modules/run/identity";
import type {
  RunMountDescriptor,
  RunStorageProviderRecord,
  RunWorkspaceScope,
} from "@/modules/run/storage/types";
import type { RunExplorerSurface, RunTerminalSurface } from "@/modules/run/surfaces";

export type RunSurfaceId =
  | "core"
  | "explorer"
  | "terminal"
  | "identity";

export type RunCoreMount = RunMountDescriptor;

export type RunCoreResourceKind = "ledger" | "container" | "file";
export type RunVerificationStatus = "verified" | "unverified" | "invalid" | "unknown";

export type RunCoreResourceRecord = {
  id: string;
  mountId: string;
  providerId: string;
  kind: RunCoreResourceKind;
  title: string;
  name: string;
  url: string;
  path: string;
  scope: RunWorkspaceScope | null;
  lastModified: string | null;
  contentType: string | null;
  verificationStatus: RunVerificationStatus;
};

export type RunCoreLedgerRecord = {
  id: string;
  resourceId: string;
  mountId: string;
  providerId: string;
  title: string;
  url: string;
  path: string;
  scope: RunWorkspaceScope | null;
  verificationStatus: RunVerificationStatus;
};

export type RunCoreSelection = {
  activeProviderId: string | null;
  activeMountId: string | null;
  activeBrowseUrl: string | null;
  activeResourceId: string | null;
  activeLedgerId: string | null;
  activeLedgerIds: string[];
  activeScope: RunWorkspaceScope | null;
};

export type RunProjectionTrustPolicy = {
  mode: "strict";
  allowUnverified: false;
};

export type RunProjectionOpenContext = {
  kind: "storage-ledger";
  providerId: string;
  mountId: string;
  ledgerId: string;
  resourceUrl: string;
  capabilities: {
    ledgerStorage: boolean;
    hostableApp: boolean;
    interactive: boolean;
  };
};

export type RunProjectionCandidate = {
  providerId: string;
  mountId: string;
  ledgerId: string;
  resourceUrl: string;
};

export type RunProjectionResolution = {
  candidate: RunProjectionCandidate;
  resolvedAt: string;
  replayReady: boolean;
  issues: string[];
};

export type RunProjectionReadiness = {
  inspectable: boolean;
  verified: boolean;
  interactive: boolean;
};

export type RunProjectionTaskSupport = {
  supported: boolean;
  reason: string | null;
  classification: "empty" | "task-document" | "mixed" | "unsupported";
};

export type RunCoreProjectionState = {
  id: string | null;
  ledgerId: string | null;
  status: "idle" | "resolving" | "ready" | "blocked" | "error";
  candidate: RunProjectionCandidate | null;
  resolution: RunProjectionResolution | null;
  readiness: RunProjectionReadiness;
  taskSupport: RunProjectionTaskSupport;
  inputs: {
    ledgerIds: string[];
    resourceIds: string[];
    trustPolicy: RunProjectionTrustPolicy;
  } | null;
  openContext: RunProjectionOpenContext | null;
  provenance: {
    source: "none" | "workspace-selection";
    includedCommitIds: string[];
    excludedCommitIds: string[];
  };
  verification: {
    status: RunVerificationStatus;
    summary: string;
    details: string[];
  };
  replay: {
    ready: boolean;
    commitCount: number;
    headCommitId: string | null;
  };
};

export type RunSurfaceDescriptor = {
  id: RunSurfaceId;
  label: string;
  available: boolean;
  active: boolean;
  reason: string | null;
};

export type RunAuthFacadeStatus =
  | "anonymous"
  | "authenticating"
  | "authenticated"
  | "error";

export type RunRuntimeFacade = {
  boot: {
    status: ComputedRef<"booting" | "ready" | "error">;
    ready: ComputedRef<boolean>;
  };
  auth: {
    isAuthenticated: ComputedRef<boolean>;
    status: ComputedRef<RunAuthFacadeStatus>;
    issuer: ComputedRef<string | null>;
    providers: readonly string[];
    webId: ComputedRef<string | null>;
    error: ComputedRef<string | null>;
    login(): Promise<void>;
    logout(): Promise<void>;
    setIssuer(next: string): void;
  };
  identity: {
    status: ComputedRef<RunIdentityStatus>;
    ready: ComputedRef<boolean>;
    verificationMode: ComputedRef<"strict">;
    activeIdentity: ComputedRef<RunIdentityRecord | null>;
    identities: ComputedRef<RunIdentityRecord[]>;
    bootstrapCandidates: ComputedRef<RunIdentityBootstrapCandidate[]>;
    createMnemonicIdentity(input?: {
      label?: string;
      words?: 12 | 24;
    }): Promise<{ record: RunIdentityRecord; mnemonic: string }>;
    importMnemonic(input: {
      mnemonic: string;
      label?: string;
      passphrase?: string;
    }): Promise<RunIdentityRecord>;
    importSerializedIdentity(input: {
      serializedIdentity: string;
      label?: string;
    }): Promise<RunIdentityRecord>;
    switchIdentity(identityId: string): Promise<RunIdentityRecord>;
    removeIdentity(identityId: string): Promise<void>;
    exportActiveIdentity(): Promise<string>;
    syncActiveIdentityToProvider(providerId: string): Promise<void>;
    adoptBootstrapCandidate(candidateId: string): Promise<RunIdentityRecord>;
    refreshBootstrapCandidates(): Promise<void>;
    error: ComputedRef<string | null>;
  };
  workspace: {
    providers: ComputedRef<RunStorageProviderRecord[]>;
    mounts: ComputedRef<RunCoreMount[]>;
    resources: ComputedRef<RunCoreResourceRecord[]>;
    ledgers: ComputedRef<RunCoreLedgerRecord[]>;
    selection: ComputedRef<RunCoreSelection>;
    activeProjection: ComputedRef<RunCoreProjectionState>;
  };
  surfaces: {
    available: ComputedRef<RunSurfaceDescriptor[]>;
    active: ComputedRef<RunSurfaceId | null>;
  };
  diagnostics: {
    facts: ComputedRef<Array<{ label: string; value: string }>>;
    summaryLines: ComputedRef<string[]>;
  };
  explorer: RunExplorerSurface;
  terminal: RunTerminalSurface;
  actions: {
    selectScope(scope: RunWorkspaceScope): Promise<void>;
    selectLedger(ledgerId: string): Promise<void>;
  };
  init(): Promise<void>;
};

export type RunCoreRuntime = RunRuntimeFacade;

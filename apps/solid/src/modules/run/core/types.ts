import type { ComputedRef } from "vue";
import type { SolidWorkspaceScope } from "@ternent/solid";
import type { RunExplorerSurface, RunTerminalSurface } from "@/modules/run/surfaces";

export type RunSurfaceId =
  | "core"
  | "explorer"
  | "terminal"
  | "concord-host"
  | "identity";

export type RunCoreMount = {
  id: string;
  label: string;
  scope: SolidWorkspaceScope;
  rootUrl: string;
  writable: boolean;
};

export type RunCoreResourceKind = "ledger" | "container" | "file";
export type RunVerificationStatus = "verified" | "unverified" | "invalid" | "unknown";

export type RunCoreResourceRecord = {
  id: string;
  kind: RunCoreResourceKind;
  title: string;
  name: string;
  url: string;
  path: string;
  scope: SolidWorkspaceScope;
  lastModified: string | null;
  contentType: string | null;
  verificationStatus: RunVerificationStatus;
};

export type RunCoreLedgerRecord = {
  id: string;
  resourceId: string;
  title: string;
  url: string;
  path: string;
  scope: SolidWorkspaceScope;
  verificationStatus: RunVerificationStatus;
};

export type RunCoreSelection = {
  activeResourceId: string | null;
  activeLedgerId: string | null;
  activeLedgerIds: string[];
  activeScope: SolidWorkspaceScope | null;
};

export type RunProjectionTrustPolicy = {
  mode: "strict";
  allowUnverified: false;
};

export type RunProjectionOpenContext = {
  kind: "solid-ledger";
  ledgerId: string;
  resourceUrl: string;
};

export type RunCoreProjectionState = {
  id: string | null;
  ledgerId: string | null;
  status: "idle" | "selected";
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

export type RunIdentityFacadeStatus =
  | "unresolved"
  | "resolving"
  | "verified"
  | "error";

export type RunHostedAppContext = {
  appId: string;
  ledgerId: string;
  projectionId: string | null;
};

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
    status: ComputedRef<RunIdentityFacadeStatus>;
    ready: ComputedRef<boolean>;
    verificationMode: ComputedRef<"strict">;
  };
  workspace: {
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
  apps: {
    active: ComputedRef<RunHostedAppContext | null>;
  };
  diagnostics: {
    facts: ComputedRef<Array<{ label: string; value: string }>>;
    summaryLines: ComputedRef<string[]>;
  };
  explorer: RunExplorerSurface;
  terminal: RunTerminalSurface;
  actions: {
    selectScope(scope: SolidWorkspaceScope): Promise<void>;
    selectLedger(ledgerId: string): Promise<void>;
    openApp(appId?: string): Promise<boolean>;
    closeApp(): Promise<void>;
  };
  init(): Promise<void>;
};

export type RunCoreRuntime = RunRuntimeFacade;

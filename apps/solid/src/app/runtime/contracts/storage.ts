import type { LedgerContainer, LedgerEntryRecord } from "@ternent/ledger";

export type RuntimeStorageProviderId =
  | "local"
  | "filesystem"
  | "solid"
  | "gdrive"
  | "dropbox"
  | "http"
  | "custom";

export type RuntimeStorageCapabilities = {
  supportsLoad: boolean;
  supportsSave: boolean;
  supportsPull: boolean;
  supportsPush: boolean;
  supportsCompareAndSwap: boolean;
  supportsWatch: boolean;
};

export type WorkspaceStorageRef = {
  providerId: RuntimeStorageProviderId | string;
  workspaceId: string;
  pointer: string;
  config?: Record<string, unknown>;
};

export type LedgerHead = {
  entryId: string;
  hash?: string;
  committedAt?: string;
};

export type LedgerSnapshot = {
  workspaceId: string;
  container: LedgerContainer;
  entries: LedgerEntryRecord[];
  heads: LedgerHead[];
  loadedAt: string;
};

export type StoragePullResult = {
  snapshot: LedgerSnapshot;
  remoteHeads: LedgerHead[];
};

export type StoragePushInput = {
  ref: WorkspaceStorageRef;
  snapshot: LedgerSnapshot;
  expectedHeads?: LedgerHead[];
};

export type StoragePushRejectedReason = "head-mismatch" | "unauthorized" | "provider-error";

export type StoragePushResult = {
  accepted: boolean;
  remoteHeads: LedgerHead[];
  rejectedReason?: StoragePushRejectedReason;
};

export type RuntimeStorageProvider = {
  id: string;
  label: string;
  capabilities: RuntimeStorageCapabilities;

  load(ref: WorkspaceStorageRef): Promise<LedgerSnapshot>;
  save?(ref: WorkspaceStorageRef, snapshot: LedgerSnapshot): Promise<void>;

  pull?(ref: WorkspaceStorageRef): Promise<StoragePullResult>;
  push?(input: StoragePushInput): Promise<StoragePushResult>;
};

export type RuntimeConflict = {
  kind:
    | "remote-head-diverged"
    | "staged-entry-invalid-after-pull"
    | "write-after-revoke"
    | "same-aggregate-field-conflict"
    | "provider-head-mismatch";
  entryId?: string;
  aggregateId?: string;
  message: string;
};

export type RuntimeCommitResult =
  | {
      status: "committed";
      committedEntryIds: string[];
      pulledEntryCount: number;
      pushed: boolean;
      remoteHeads: LedgerHead[];
    }
  | {
      status: "rejected";
      reason: "conflict" | "provider-error" | "unsupported";
      conflicts: RuntimeConflict[];
      pulledEntryCount?: number;
      remoteHeads?: LedgerHead[];
    };

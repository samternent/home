import type { ComputedRef } from "vue";
import type { SerializedIdentity } from "@ternent/identity";
import type {
  RunIdentityBootstrapCandidate,
  RunIdentityRecord,
} from "@/modules/run/identity/types";

export type RunWorkspaceScope = "private" | "shared" | "public" | (string & {});

export type RunStorageProviderId =
  | "memory"
  | "local-fs"
  | "indexed-db"
  | "solid"
  | "dropbox"
  | "google-drive"
  | (string & {});

export type RunStorageCapability =
  | "mount"
  | "browse"
  | "stat"
  | "read"
  | "write"
  | "create-folder"
  | "create-ledger"
  | "delete"
  | "provider-auth"
  | "identity-cache"
  | "ledger-storage";

export type RunStorageProviderStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "error";

export type RunStorageProviderManifest = {
  id: RunStorageProviderId;
  label: string;
  capabilities: RunStorageCapability[];
};

export type RunMountDescriptor = {
  id: string;
  providerId: RunStorageProviderId;
  label: string;
  rootUrl: string;
  writable: boolean;
  browsable: boolean;
  scope: RunWorkspaceScope | null;
};

export type RunBrowseEntryKind = "container" | "file" | "ledger";

export type RunBrowseEntry = {
  id: string;
  mountId: string;
  providerId: RunStorageProviderId;
  url: string;
  path: string;
  name: string;
  kind: RunBrowseEntryKind;
  contentType: string | null;
  writable: boolean;
  lastModified: string | null;
  scope: RunWorkspaceScope | null;
};

export type RunBrowseResult = {
  mountId: string;
  providerId: RunStorageProviderId;
  url: string;
  path: string;
  parentUrl: string | null;
  scope: RunWorkspaceScope | null;
  entries: RunBrowseEntry[];
};

export type RunSigningIdentityRef = SerializedIdentity;

export type RunCreateFolderInput = {
  mountId: string;
  parentUrl: string;
  name: string;
};

export type RunCreateLedgerInput = {
  mountId: string;
  parentUrl: string;
  name: string;
  signer: RunSigningIdentityRef;
};

export type RunLedgerSealProof = {
  version: string;
  type: "seal-proof";
  algorithm: string;
  createdAt: string;
  subject: {
    kind: "file" | "manifest" | "artifact";
    path: string;
    hash: `sha256:${string}`;
  };
  signer: {
    publicKey: string;
    keyId: string;
  };
  signature: string;
};

export type RunLedgerPayloadRecord =
  | {
      type: "plain";
      data: unknown;
    }
  | {
      type: "encrypted";
      scheme: "age";
      mode: "recipients";
      encoding: "armor" | "binary";
      data: string;
      payloadHash: `sha256:${string}` | string;
    };

export type RunLedgerEntryRecord = {
  entryId: string;
  kind: string;
  authoredAt: string;
  author: string;
  meta: Record<string, unknown> | null;
  payload: RunLedgerPayloadRecord;
  seal: RunLedgerSealProof;
};

export type RunLedgerCommitRecord = {
  commitId: string;
  parentCommitId: string | null;
  committedAt: string;
  metadata: Record<string, unknown> | null;
  entryIds: string[];
  seal: RunLedgerSealProof;
};

export type RunLedgerContainer = {
  format: "concord-ledger";
  version: "1";
  commits: Record<string, RunLedgerCommitRecord>;
  entries: Record<string, RunLedgerEntryRecord>;
  head: string;
};

export type RunLedgerPersistenceSnapshot = {
  container: RunLedgerContainer | null;
  staged: RunLedgerEntryRecord[];
};

export type RunLedgerStorageAdapter = {
  name: string;
  load(): Promise<RunLedgerPersistenceSnapshot | null>;
  save(snapshot: RunLedgerPersistenceSnapshot): Promise<void>;
  clear?(): Promise<void>;
};

export type RunStorageProvider = {
  manifest: RunStorageProviderManifest;
  status: ComputedRef<RunStorageProviderStatus>;
  error: ComputedRef<string | null>;
  mounts: ComputedRef<RunMountDescriptor[]>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  listMounts(): Promise<RunMountDescriptor[]>;
  browse?(mountId: string, url: string): Promise<RunBrowseResult>;
  stat?(mountId: string, url: string): Promise<RunBrowseEntry | null>;
  createFolder?(input: RunCreateFolderInput): Promise<RunBrowseEntry>;
  createLedger?(input: RunCreateLedgerInput): Promise<RunBrowseEntry>;
  createLedgerStorageAdapter?(
    mountId: string,
    resourceUrl: string,
  ): Promise<RunLedgerStorageAdapter | null>;
  listCachedIdentities?(): Promise<RunIdentityBootstrapCandidate[]>;
  readCachedIdentity?(cacheId: string): Promise<RunIdentityRecord | null>;
  writeCachedIdentity?(record: RunIdentityRecord): Promise<void>;
};

export type RunStorageProviderRecord = {
  id: RunStorageProviderId;
  label: string;
  capabilities: RunStorageCapability[];
  status: RunStorageProviderStatus;
  error: string | null;
  provider: RunStorageProvider;
};

import type { SerializedIdentity } from "@ternent/identity";
import type {
  CreateSolidConcordPathsOptions,
  SolidConcordPaths,
  SolidSessionLike,
} from "./types-profile.js";

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

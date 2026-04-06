import type { RunBrowseEntry, RunWorkspaceScope } from "@/modules/run/storage/types";

export type RunServiceResult<T = void> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: string;
    };

export type RunOpenEntryMode = "navigated" | "selected";

export type RunOpenEntryResult = RunServiceResult<{
  entry: RunBrowseEntry;
  mode: RunOpenEntryMode;
}>;

export type RunResolvedEntryResult = RunServiceResult<{
  entry: RunBrowseEntry;
}>;

export type RunWorkspaceActions = {
  navigateToScope(scope: RunWorkspaceScope): Promise<void>;
  navigateUp(): Promise<RunServiceResult<{ url: string }>>;
  resolveTarget(target: string): Promise<RunBrowseEntry | null>;
  navigateTarget(target: string): Promise<RunResolvedEntryResult>;
  navigateEntryByUrl(url: string): Promise<RunResolvedEntryResult>;
  selectTarget(target: string): Promise<RunResolvedEntryResult>;
  selectEntryByUrl(url: string): Promise<RunResolvedEntryResult>;
  openTarget(target: string): Promise<RunOpenEntryResult>;
  openEntryByUrl(url: string): Promise<RunOpenEntryResult>;
  createFolder(name: string): Promise<RunServiceResult<{ entry: RunBrowseEntry }>>;
  createLedger(name: string): Promise<RunServiceResult<{ entry: RunBrowseEntry }>>;
};

export type RunLedgerFileExport = {
  filename: string;
  content: string;
};

export type RunLedgerFileActions = {
  createLocalLedger(): Promise<RunServiceResult<{ entry: RunBrowseEntry }>>;
  importLedgerFile(file: File): Promise<RunServiceResult<{ entry: RunBrowseEntry }>>;
  exportActiveLedger(): Promise<RunServiceResult<RunLedgerFileExport>>;
};

export type RunTerminalLanguageChunk = {
  kind: "output" | "error";
  lines: string[];
};

export type RunTerminalLanguageResult = {
  handled: boolean;
  clear: boolean;
  chunks: RunTerminalLanguageChunk[];
};

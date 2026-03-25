import type { SolidWorkspaceEntry, SolidWorkspaceScope } from "@ternent/solid";

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
  entry: SolidWorkspaceEntry;
  mode: RunOpenEntryMode;
}>;

export type RunWorkspaceActions = {
  navigateToScope(scope: SolidWorkspaceScope): Promise<void>;
  navigateUp(): Promise<RunServiceResult<{ url: string }>>;
  resolveTarget(target: string): Promise<SolidWorkspaceEntry | null>;
  openTarget(target: string): Promise<RunOpenEntryResult>;
  openEntryByUrl(url: string): Promise<RunOpenEntryResult>;
  createFolder(name: string): Promise<RunServiceResult<{ entry: SolidWorkspaceEntry }>>;
  createLedger(name: string): Promise<RunServiceResult<{ entry: SolidWorkspaceEntry }>>;
  openApp(appId?: string): Promise<
    RunServiceResult<{
      appId: string | null;
      ledgerId: string | null;
      projectionId: string | null;
    }>
  >;
  closeApp(): Promise<void>;
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

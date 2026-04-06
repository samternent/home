import type { ComputedRef } from "vue";
import type { RunWorkspaceScope } from "@/modules/run/storage/types";

export type RunExplorerItemKind = "container" | "ledger" | "file";

export type RunExplorerItem = {
  id: string;
  url: string;
  name: string;
  title: string;
  kind: RunExplorerItemKind;
  scope: RunWorkspaceScope | null;
  active: boolean;
  contentType: string | null;
  writable: boolean;
  lastModified: string | null;
};

export type RunExplorerSurface = {
  currentUrl: ComputedRef<string | null>;
  currentPath: ComputedRef<string>;
  parentUrl: ComputedRef<string | null>;
  items: ComputedRef<RunExplorerItem[]>;
  canGoUp: ComputedRef<boolean>;
  navigateItem(url: string): Promise<boolean>;
  selectItem(url: string): Promise<boolean>;
  openTasks(url: string): Promise<boolean>;
  goUp(): Promise<boolean>;
  createFolder(name: string): Promise<boolean>;
  createLedger(name: string): Promise<boolean>;
};

export type RunTerminalEntryKind = "command" | "output" | "error";

export type RunTerminalEntry = {
  id: string;
  kind: RunTerminalEntryKind;
  lines: string[];
};

export type RunTerminalSurface = {
  history: ComputedRef<RunTerminalEntry[]>;
  draft: ComputedRef<string>;
  promptPath: ComputedRef<string>;
  run(input: string): Promise<boolean>;
  setDraft(input: string): void;
  clear(): void;
};

export type RunDashboardLedgerCard = {
  id: string;
  title: string;
  url: string;
  scope: RunWorkspaceScope | null;
  active: boolean;
  verificationSummary: string;
  interactive: boolean;
};

export type RunDashboardSurface = {
  activeLedgerLabel: ComputedRef<string>;
  activeLedgerSummary: ComputedRef<string>;
  recentLedgers: ComputedRef<RunDashboardLedgerCard[]>;
  hasActiveLedger: ComputedRef<boolean>;
  openTasks(url: string): Promise<boolean>;
};

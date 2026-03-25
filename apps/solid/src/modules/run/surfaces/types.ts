import type { ComputedRef } from "vue";
import type { SolidWorkspaceScope } from "@ternent/solid";

export type RunExplorerItemKind = "container" | "ledger" | "file";

export type RunExplorerItem = {
  id: string;
  url: string;
  name: string;
  title: string;
  kind: RunExplorerItemKind;
  scope: SolidWorkspaceScope;
  active: boolean;
};

export type RunExplorerSurface = {
  currentUrl: ComputedRef<string | null>;
  currentPath: ComputedRef<string>;
  parentUrl: ComputedRef<string | null>;
  items: ComputedRef<RunExplorerItem[]>;
  canGoUp: ComputedRef<boolean>;
  openItem(url: string): Promise<boolean>;
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
  run(input: string): Promise<boolean>;
  clear(): void;
};

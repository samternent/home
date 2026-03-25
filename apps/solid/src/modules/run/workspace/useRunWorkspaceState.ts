import { computed, type ComputedRef } from "vue";
import type { SolidWorkspaceScope } from "@ternent/solid";
import { useRunStorageCatalog } from "@/modules/run/storage";
import type { RunCoreSelection } from "@/modules/run/core/types";
import { useRunWorkspaceSource } from "./useRunWorkspaceSource";

export type RunWorkspaceState = {
  selection: ComputedRef<RunCoreSelection>;
  selectScope(scope: SolidWorkspaceScope): Promise<void>;
  selectLedger(ledgerId: string): Promise<void>;
};

let singleton: RunWorkspaceState | null = null;

function createWorkspaceState(): RunWorkspaceState {
  const workspace = useRunWorkspaceSource();
  const storage = useRunStorageCatalog();

  const selection = computed<RunCoreSelection>(() => {
    const selected = workspace.selectedEntry.value;
    return {
      activeResourceId: selected?.url ?? null,
      activeLedgerId: selected?.isLedger ? selected.url : null,
      activeLedgerIds: selected?.isLedger ? [selected.url] : [],
      activeScope: selected?.scope ?? workspace.currentBrowse.value?.scope ?? null,
    };
  });

  return {
    selection,
    async selectScope(scope) {
      await workspace.selectScope(scope);
    },
    async selectLedger(ledgerId) {
      const current = workspace.selectedEntry.value;
      if (current?.url === ledgerId) {
        return;
      }

      const cached =
        storage.ledgers.value.find((ledger) => ledger.id === ledgerId) ?? null;
      if (!cached) {
        return;
      }

      if (workspace.currentScope.value !== cached.scope) {
        await workspace.selectScope(cached.scope);
      }

      const entry =
        (await workspace.lookupEntry(ledgerId)) ??
        workspace.currentBrowse.value?.entries.find((item) => item.url === ledgerId) ??
        null;

      if (!entry) {
        return;
      }

      await workspace.selectEntry(entry);
    },
  };
}

export function useRunWorkspaceState(): RunWorkspaceState {
  if (!singleton) {
    singleton = createWorkspaceState();
  }

  return singleton;
}

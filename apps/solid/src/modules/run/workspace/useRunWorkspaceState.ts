import { computed, type ComputedRef } from "vue";
import { useRunStorageCatalog } from "@/modules/run/storage";
import type { RunCoreSelection } from "@/modules/run/core/types";
import type { RunWorkspaceScope } from "@/modules/run/storage/types";
import { useRunWorkspaceRuntime } from "./useRunWorkspaceRuntime";

export type RunWorkspaceState = {
  selection: ComputedRef<RunCoreSelection>;
  selectScope(scope: RunWorkspaceScope): Promise<void>;
  selectLedger(ledgerId: string): Promise<void>;
};

let singleton: RunWorkspaceState | null = null;

function createWorkspaceState(): RunWorkspaceState {
  const workspace = useRunWorkspaceRuntime();
  const storage = useRunStorageCatalog();

  const selection = computed<RunCoreSelection>(() => {
    return {
      activeProviderId: workspace.selection.value.activeProviderId,
      activeMountId: workspace.selection.value.activeMountId,
      activeBrowseUrl: workspace.selection.value.activeBrowseUrl,
      activeResourceId: workspace.selection.value.activeResourceId,
      activeLedgerId: workspace.selection.value.activeLedgerIds[0] ?? null,
      activeLedgerIds: workspace.selection.value.activeLedgerIds,
      activeScope: workspace.selection.value.activeScope,
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

      if (cached.scope && workspace.selection.value.activeScope !== cached.scope) {
        await workspace.selectScope(cached.scope);
      } else if (
        cached.mountId &&
        workspace.selection.value.activeMountId !== cached.mountId
      ) {
        await workspace.selectMount(cached.mountId);
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

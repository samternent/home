import { computed } from "vue";
import { useRunWorkspaceSource, useRunWorkspaceState } from "@/modules/run/workspace";
import { useRunWorkspaceActions } from "@/modules/run/services";
import type { RunExplorerItem, RunExplorerSurface } from "./types";

let singleton: RunExplorerSurface | null = null;

function createExplorerSurface(): RunExplorerSurface {
  const source = useRunWorkspaceSource();
  const workspace = useRunWorkspaceState();
  const actions = useRunWorkspaceActions();

  const items = computed<RunExplorerItem[]>(() =>
    (source.currentBrowse.value?.entries ?? []).map((entry) => ({
      id: entry.url,
      url: entry.url,
      name: entry.name,
      title: entry.name.replace(/\.json$/i, ""),
      kind: entry.isLedger ? "ledger" : entry.kind,
      scope: entry.scope,
      active: workspace.selection.value.activeResourceId === entry.url,
    })),
  );

  return {
    currentUrl: computed(() => source.currentBrowse.value?.url ?? null),
    currentPath: computed(() => source.currentBrowse.value?.path || "/"),
    parentUrl: computed(() => source.currentBrowse.value?.parentUrl ?? null),
    items,
    canGoUp: computed(() => Boolean(source.currentBrowse.value?.parentUrl)),
    async openItem(url: string) {
      const result = await actions.openEntryByUrl(url);
      return result.ok;
    },
    async goUp() {
      const result = await actions.navigateUp();
      return result.ok;
    },
    async createFolder(name: string) {
      const result = await actions.createFolder(name);
      return result.ok;
    },
    async createLedger(name: string) {
      const result = await actions.createLedger(name);
      return result.ok;
    },
  };
}

export function useRunExplorerSurface(): RunExplorerSurface {
  if (!singleton) {
    singleton = createExplorerSurface();
  }

  return singleton;
}

import { computed } from "vue";
import { useRunTasksRuntime } from "@/modules/run/tasks/useRunTasksRuntime";
import { useRunWorkspaceRuntime, useRunWorkspaceState } from "@/modules/run/workspace";
import { useRunWorkspaceActions } from "@/modules/run/services";
import type { RunExplorerItem, RunExplorerSurface } from "./types";

let singleton: RunExplorerSurface | null = null;

function createExplorerSurface(): RunExplorerSurface {
  const runtime = useRunWorkspaceRuntime();
  const workspace = useRunWorkspaceState();
  const actions = useRunWorkspaceActions();
  const tasks = useRunTasksRuntime();

  const items = computed<RunExplorerItem[]>(() =>
    (runtime.currentBrowse.value?.entries ?? []).map((entry) => ({
      id: entry.url,
      url: entry.url,
      name: entry.name,
      title: entry.name.replace(/\.json$/i, ""),
      kind: entry.kind,
      scope: entry.scope,
      active: workspace.selection.value.activeResourceId === entry.url,
      contentType: entry.contentType,
      writable: entry.writable,
      lastModified: entry.lastModified,
    })),
  );

  return {
    currentUrl: computed(() => runtime.currentBrowse.value?.url ?? null),
    currentPath: computed(() => runtime.currentBrowse.value?.path || "/"),
    parentUrl: computed(() => runtime.currentBrowse.value?.parentUrl ?? null),
    items,
    canGoUp: computed(() => Boolean(runtime.currentBrowse.value?.parentUrl)),
    async navigateItem(url: string) {
      const result = await actions.navigateEntryByUrl(url);
      return result.ok;
    },
    async selectItem(url: string) {
      const result = await actions.selectEntryByUrl(url);
      return result.ok;
    },
    async openTasks(url: string) {
      return await tasks.openTasksForLedger(url);
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
      if (!result.ok) {
        return false;
      }

      await actions.selectEntryByUrl(result.value.entry.url);
      return true;
    },
  };
}

export function useRunExplorerSurface(): RunExplorerSurface {
  if (!singleton) {
    singleton = createExplorerSurface();
  }

  return singleton;
}

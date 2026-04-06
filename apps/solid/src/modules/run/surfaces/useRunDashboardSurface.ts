import { computed } from "vue";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunStorageCatalog } from "@/modules/run/storage";
import { useRunTasksRuntime } from "@/modules/run/tasks/useRunTasksRuntime";
import { useRunWorkspaceState } from "@/modules/run/workspace";
import type { RunDashboardSurface } from "./types";

let singleton: RunDashboardSurface | null = null;

function createRunDashboardSurface(): RunDashboardSurface {
  const projection = useRunProjectionState();
  const storage = useRunStorageCatalog();
  const workspace = useRunWorkspaceState();
  const tasks = useRunTasksRuntime();

  const recentLedgers = computed(() => {
    const resourcesByLedgerUrl = new Map(
      storage.resources.value.map((resource) => [resource.url, resource]),
    );

    return storage.ledgers.value
      .slice()
      .sort((left, right) => {
        const leftModified = resourcesByLedgerUrl.get(left.url)?.lastModified ?? "";
        const rightModified = resourcesByLedgerUrl.get(right.url)?.lastModified ?? "";
        return rightModified.localeCompare(leftModified);
      })
      .slice(0, 8)
      .map((ledger) => ({
        id: ledger.id,
        title: ledger.title,
        url: ledger.url,
        scope: ledger.scope,
        active: workspace.selection.value.activeLedgerId === ledger.id,
        verificationSummary:
          workspace.selection.value.activeLedgerId === ledger.id
            ? projection.activeProjection.value.verification.summary
            : "Open this ledger in Tasks.",
        interactive:
          workspace.selection.value.activeLedgerId === ledger.id
            ? projection.activeProjection.value.readiness.interactive
            : false,
      }));
  });

  const activeLedger = computed(() => {
    const ledgerId = projection.activeProjection.value.ledgerId;
    if (!ledgerId) {
      return null;
    }

    return storage.ledgers.value.find((ledger) => ledger.id === ledgerId) ?? null;
  });

  return {
    activeLedgerLabel: computed(
      () => activeLedger.value?.title ?? "No document open",
    ),
    activeLedgerSummary: computed(() => {
      const activeProjection = projection.activeProjection.value;
      if (!activeProjection.id) {
        return "Open a ledger in Explorer to jump straight into the active document.";
      }

      if (!activeProjection.readiness.inspectable) {
        return activeProjection.verification.summary;
      }

      return activeProjection.readiness.interactive
        ? "You’re working in a verified task document."
        : "You’re viewing a verified task document. Add identity when you want to make changes.";
    }),
    recentLedgers,
    hasActiveLedger: computed(() => Boolean(projection.activeProjection.value.id)),
    async openTasks(url: string) {
      return await tasks.openTasksForLedger(url);
    },
  };
}

export function useRunDashboardSurface(): RunDashboardSurface {
  if (!singleton) {
    singleton = createRunDashboardSurface();
  }

  return singleton;
}

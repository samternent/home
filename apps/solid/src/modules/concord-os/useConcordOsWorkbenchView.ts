import { computed, ref, watch, type ComputedRef } from "vue";
import type { SolidWorkspaceScope } from "@ternent/solid";
import { useConcordOsAppHost } from "./useConcordOsAppHost";
import { useConcordOsCore } from "./core";
import { useConcordOsLibrary } from "./useConcordOsLibrary";

export type ConcordOsRecentWorkItem = {
  url: string;
  title: string;
  scope: SolidWorkspaceScope;
  appId: string | null;
  appLabel: string | null;
  kind: "active-app" | "ledger";
};

export type ConcordOsWorkbenchView = {
  currentWork: ComputedRef<ConcordOsRecentWorkItem | null>;
  recentWork: ComputedRef<ConcordOsRecentWorkItem[]>;
  ledgerCreationHint: ComputedRef<string>;
  libraryEmptyLabel: ComputedRef<string>;
};

let singleton: ConcordOsWorkbenchView | null = null;

function normalizeTitle(value: string): string {
  return value.replace(/\.json$/i, "");
}

function recordRecent(
  recent: ConcordOsRecentWorkItem[],
  next: ConcordOsRecentWorkItem,
): ConcordOsRecentWorkItem[] {
  const deduped = recent.filter((item) => item.url !== next.url);
  return [next, ...deduped].slice(0, 5);
}

function createWorkbenchView(): ConcordOsWorkbenchView {
  const workspace = useConcordOsCore();
  const library = useConcordOsLibrary();
  const host = useConcordOsAppHost();
  const recentState = ref<ConcordOsRecentWorkItem[]>([]);

  watch(
    () => host.activeTarget.value,
    (target) => {
      if (!target) {
        return;
      }

      recentState.value = recordRecent(recentState.value, {
        url: target.url,
        title: target.title,
        scope: target.scope,
        appId: host.activeAppId.value,
        appLabel: host.activeAppLabel.value,
        kind: "active-app",
      });
    },
    { immediate: true },
  );

  watch(
    () => library.selectedItem.value,
    (item) => {
      if (!item || item.kind !== "ledger") {
        return;
      }

      recentState.value = recordRecent(recentState.value, {
        url: item.entry.url,
        title: item.title,
        scope: item.entry.scope,
        appId: null,
        appLabel: null,
        kind: "ledger",
      });
    },
    { immediate: true },
  );

  const currentWork = computed<ConcordOsRecentWorkItem | null>(() => {
    if (host.activeTarget.value) {
      return {
        url: host.activeTarget.value.url,
        title: host.activeTarget.value.title,
        scope: host.activeTarget.value.scope,
        appId: host.activeAppId.value,
        appLabel: host.activeAppLabel.value,
        kind: "active-app",
      };
    }

    if (library.selectedItem.value?.kind === "ledger") {
      return {
        url: library.selectedItem.value.entry.url,
        title: library.selectedItem.value.title,
        scope: library.selectedItem.value.entry.scope,
        appId: null,
        appLabel: null,
        kind: "ledger",
      };
    }

    return null;
  });

  return {
    currentWork,
    recentWork: computed(() =>
      recentState.value.filter((item) => item.url !== currentWork.value?.url),
    ),
    ledgerCreationHint: computed(() =>
      workspace.identityReady.value
        ? "Creates a Concord ledger at <name>.json and keeps it ready for compatible apps."
        : "Create or restore your Concord identity in Account before creating a ledger.",
    ),
    libraryEmptyLabel: computed(() => {
      if (!workspace.identityReady.value) {
        return "Create your Concord identity first, then start a new ledger here.";
      }

      if (workspace.currentScope.value === "shared") {
        return "No shared ledgers here yet. Create one and manage access from Sharing.";
      }

      if (workspace.currentScope.value === "public") {
        return "No public ledgers here yet. Create one when you want durable work to be openly readable.";
      }

      return "No ledgers here yet. Create one to start durable Concord work.";
    }),
  };
}

export function useConcordOsWorkbenchView(): ConcordOsWorkbenchView {
  if (!singleton) {
    singleton = createWorkbenchView();
  }

  return singleton;
}

export function formatConcordOsScopeLabel(scope: SolidWorkspaceScope): string {
  return normalizeTitle(scope);
}

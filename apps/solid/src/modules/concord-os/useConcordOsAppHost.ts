import { computed, ref, shallowRef, type ComputedRef } from "vue";
import { createConcordApp } from "@ternent/concord/browser";
import type { ConcordApp } from "@ternent/concord";
import {
  createSolidStorage,
  type SolidWorkspaceEntry,
  type SolidWorkspaceLedgerSummary,
  type SolidWorkspaceScope,
} from "@ternent/solid";
import type { Router } from "vue-router";
import { useSolidSession } from "@/modules/solid-session";
import {
  buildConcordOsHostedAppRoute,
  createConcordOsOpenTarget,
  getConcordOsHostedApp,
  resolveConcordOsLedgerCompatibility,
  resolveConcordOsTargetUrl,
  type ConcordOsLedgerCompatibility,
  type ConcordOsOpenTarget,
} from "./apps";
import { useConcordOsCore } from "./core";

export type ConcordOsAppHostStatus = "idle" | "loading" | "ready" | "error";

type LoadHostedAppInput = {
  scope: SolidWorkspaceScope;
  appId: string;
  encodedPath: string;
};

export type ConcordOsWorkspaceTab = {
  id: string;
  label: string;
  appId: string;
  appLabel: string;
  target: ConcordOsOpenTarget;
};

export type ConcordOsAppHost = {
  chooserOpen: ComputedRef<boolean>;
  chooserTarget: ComputedRef<ConcordOsOpenTarget | null>;
  chooserApps: ComputedRef<ConcordOsLedgerCompatibility[]>;
  status: ComputedRef<ConcordOsAppHostStatus>;
  error: ComputedRef<string | null>;
  activeApp: ComputedRef<ConcordApp | null>;
  activeAppId: ComputedRef<string | null>;
  activeTarget: ComputedRef<ConcordOsOpenTarget | null>;
  activeAppLabel: ComputedRef<string | null>;
  tabs: ComputedRef<ConcordOsWorkspaceTab[]>;
  activeTabId: ComputedRef<string | null>;
  openChooser(
    entry: SolidWorkspaceEntry,
    ledgerSummary?: SolidWorkspaceLedgerSummary | null,
  ): void;
  closeChooser(): void;
  openChosenApp(router: Router, appId: string, target?: ConcordOsOpenTarget | null): Promise<void>;
  loadHostedApp(input: LoadHostedAppInput): Promise<void>;
  activateTab(router: Router, tabId: string): Promise<void>;
  closeTab(router: Router, tabId: string): Promise<void>;
  backToLibrary(router: Router): Promise<void>;
  destroyActiveApp(): Promise<void>;
};

let singleton: ConcordOsAppHost | null = null;

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown ConcordOS host error.");
}

function createTabId(target: ConcordOsOpenTarget, appId: string) {
  return `${appId}:${target.scope}:${target.url}`;
}

function createHost(): ConcordOsAppHost {
  const solid = useSolidSession();
  const workspace = useConcordOsCore();
  const chooserOpenState = ref(false);
  const chooserTargetState = ref<ConcordOsOpenTarget | null>(null);
  const statusState = ref<ConcordOsAppHostStatus>("idle");
  const errorState = ref<string | null>(null);
  const activeAppIdState = ref<string | null>(null);
  const activeTargetState = ref<ConcordOsOpenTarget | null>(null);
  const activeAppState = shallowRef<ConcordApp | null>(null);
  const tabsState = ref<ConcordOsWorkspaceTab[]>([]);
  const activeTabIdState = ref<string | null>(null);

  function upsertTab(target: ConcordOsOpenTarget, appId: string) {
    const definition = getConcordOsHostedApp(appId);
    if (!definition) {
      return null;
    }

    const id = createTabId(target, appId);
    const nextTab: ConcordOsWorkspaceTab = {
      id,
      label: `${target.title} · ${definition.label}`,
      appId,
      appLabel: definition.label,
      target,
    };

    const existingIndex = tabsState.value.findIndex((tab) => tab.id === id);
    if (existingIndex >= 0) {
      tabsState.value.splice(existingIndex, 1, nextTab);
    } else {
      tabsState.value = [...tabsState.value, nextTab];
    }

    activeTabIdState.value = id;
    return nextTab;
  }

  async function destroyActiveApp() {
    const current = activeAppState.value;
    activeAppState.value = null;
    activeAppIdState.value = null;
    activeTargetState.value = null;

    if (!current) {
      return;
    }

    await current.destroy().catch(() => undefined);
  }

  async function loadHostedApp(input: LoadHostedAppInput) {
    errorState.value = null;
    statusState.value = "loading";

    await destroyActiveApp();

    try {
      const session = solid.session.value;
      const paths = workspace.paths.value;
      const identity = workspace.identity.value;
      if (!session || !paths || !identity) {
        throw new Error("Solid session, workspace paths, and Concord identity are required.");
      }

      const definition = getConcordOsHostedApp(input.appId);
      if (!definition) {
        throw new Error(`Unknown hosted app: ${input.appId}`);
      }

      const targetUrl = resolveConcordOsTargetUrl(paths, input.scope, input.encodedPath);
      const entry = await workspace.lookupEntry(targetUrl);
      if (!entry || entry.kind !== "file" || !entry.isLedger) {
        throw new Error("The selected workspace resource is not an openable Concord ledger.");
      }

      const target = createConcordOsOpenTarget(entry);
      const compatibility = resolveConcordOsLedgerCompatibility(target).find(
        (candidate) => candidate.appId === definition.id,
      );
      if (!compatibility?.supported) {
        throw new Error(compatibility?.reason || "This ledger is not supported by the requested app.");
      }

      const app = await createConcordApp({
        identity,
        storage: createSolidStorage(session, entry.url),
        plugins: definition.createPlugins(),
      });

      await app.load();
      upsertTab(target, definition.id);
      activeAppState.value = app;
      activeAppIdState.value = definition.id;
      activeTargetState.value = target;
      statusState.value = "ready";
    } catch (error) {
      await destroyActiveApp();
      errorState.value = normalizeMessage(error);
      statusState.value = "error";
    }
  }

  return {
    chooserOpen: computed(() => chooserOpenState.value),
    chooserTarget: computed(() => chooserTargetState.value),
    chooserApps: computed(() =>
      chooserTargetState.value
        ? resolveConcordOsLedgerCompatibility(chooserTargetState.value)
        : [],
    ),
    status: computed(() => statusState.value),
    error: computed(() => errorState.value),
    activeApp: computed(() => activeAppState.value),
    activeAppId: computed(() => activeAppIdState.value),
    activeTarget: computed(() => activeTargetState.value),
    activeAppLabel: computed(() => {
      if (!activeAppIdState.value) {
        return null;
      }

      return getConcordOsHostedApp(activeAppIdState.value)?.label ?? null;
    }),
    tabs: computed(() => tabsState.value),
    activeTabId: computed(() => activeTabIdState.value),
    openChooser(entry, ledgerSummary = null) {
      chooserTargetState.value = createConcordOsOpenTarget(entry, ledgerSummary);
      chooserOpenState.value = true;
    },
    closeChooser() {
      chooserOpenState.value = false;
      chooserTargetState.value = null;
    },
    async openChosenApp(router, appId, target = chooserTargetState.value) {
      if (!target) {
        return;
      }

      chooserOpenState.value = false;
      chooserTargetState.value = null;
      upsertTab(target, appId);
      await router.push(buildConcordOsHostedAppRoute(target, appId));
    },
    loadHostedApp,
    async activateTab(router, tabId) {
      const tab = tabsState.value.find((candidate) => candidate.id === tabId);
      if (!tab) {
        return;
      }

      activeTabIdState.value = tab.id;
      await router.push(buildConcordOsHostedAppRoute(tab.target, tab.appId));
    },
    async closeTab(router, tabId) {
      const index = tabsState.value.findIndex((candidate) => candidate.id === tabId);
      if (index < 0) {
        return;
      }

      const wasActive = activeTabIdState.value === tabId;
      tabsState.value = tabsState.value.filter((candidate) => candidate.id !== tabId);

      if (!wasActive) {
        return;
      }

      const fallback = tabsState.value[index] ?? tabsState.value[index - 1] ?? null;
      if (!fallback) {
        activeTabIdState.value = null;
        await destroyActiveApp();
        await router.push("/app/library");
        return;
      }

      activeTabIdState.value = fallback.id;
      await router.push(buildConcordOsHostedAppRoute(fallback.target, fallback.appId));
    },
    async backToLibrary(router) {
      await router.push("/app/library");
    },
    destroyActiveApp,
  };
}

export function useConcordOsAppHost(): ConcordOsAppHost {
  if (!singleton) {
    singleton = createHost();
  }

  return singleton;
}

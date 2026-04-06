import { createConcordApp } from "@ternent/concord/browser";
import type {
  ConcordApp,
  ConcordReplayPlugin,
  ConcordState,
} from "@ternent/concord";
import { computed, ref, shallowRef, watch, type ComputedRef } from "vue";
import { useRunIdentityService } from "@/modules/run/identity";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunWorkspaceActions } from "@/modules/run/services/useRunWorkspaceActions";
import { useRunProviderRegistry } from "@/modules/run/workspace";
import { warmTaskCrypto } from "./crypto";
import { createEmptyTaskProjection } from "./state";
import { taskPlugin } from "./plugin";
import type { RunTasksMode, TaskProjection } from "./types";

export type RunTasksRuntimeStatus = "idle" | "loading" | "ready" | "error";
export type RunTasksRuntimeTransition =
  | "idle"
  | "loading-ledger"
  | "switching-identity";

export type RunTasksRuntime = {
  mode: ComputedRef<RunTasksMode>;
  status: ComputedRef<RunTasksRuntimeStatus>;
  transition: ComputedRef<RunTasksRuntimeTransition>;
  error: ComputedRef<string | null>;
  reason: ComputedRef<string | null>;
  activeLedgerId: ComputedRef<string | null>;
  ready: ComputedRef<boolean>;
  state: ComputedRef<Readonly<ConcordState> | null>;
  projection: ComputedRef<TaskProjection>;
  app: ComputedRef<ConcordApp | null>;
  ensureReady(): Promise<boolean>;
  reset(): Promise<void>;
  openTasksForLedger(url: string): Promise<boolean>;
};

let singleton: RunTasksRuntime | null = null;

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown Tasks runtime error.");
}

async function yieldToHost(): Promise<void> {
  if (typeof requestAnimationFrame === "function") {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    return;
  }

  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, 0);
  });
}

function createRunTasksRuntime(): RunTasksRuntime {
  const identity = useRunIdentityService();
  const projectionState = useRunProjectionState();
  const providerRegistry = useRunProviderRegistry();
  const workspaceActions = useRunWorkspaceActions();
  const statusState = ref<RunTasksRuntimeStatus>("idle");
  const transitionState = ref<RunTasksRuntimeTransition>("idle");
  const errorState = ref<string | null>(null);
  const appState = shallowRef<ConcordApp | null>(null);
  const snapshotState = shallowRef<Readonly<ConcordState> | null>(null);
  const runtimeKeyState = ref<string | null>(null);
  const activeResourceUrlState = ref<string | null>(null);
  const activeHeadCommitIdState = ref<string | null>(null);
  let unsubscribe: (() => void) | null = null;
  let syncPromise: Promise<boolean> | null = null;

  const mode = computed<RunTasksMode>(() => {
    const projection = projectionState.activeProjection.value;

    if (!projection.id || !projection.readiness.inspectable) {
      return "unavailable";
    }

    if (!projection.taskSupport.supported) {
      return "unavailable";
    }

    return projection.readiness.interactive ? "interactive" : "inspect";
  });

  const reason = computed(() => {
    const projection = projectionState.activeProjection.value;

    if (!projection.id) {
      return "Open a ledger to view Tasks.";
    }

    if (!projection.readiness.inspectable) {
      return projection.verification.summary;
    }

    if (!projection.taskSupport.supported) {
      return (
        projection.taskSupport.reason
        ?? "Tasks is not available for the current ledger."
      );
    }

    if (mode.value === "inspect") {
      return "You’re viewing this task document. Add identity to make changes.";
    }

    return null;
  });

  const projection = computed<TaskProjection>(() => {
    const snapshot = snapshotState.value;

    if (!snapshot) {
      return createEmptyTaskProjection();
    }

    try {
      const replayState = snapshot.replay.tasks;
      return (replayState as TaskProjection) ?? createEmptyTaskProjection();
    } catch {
      return createEmptyTaskProjection();
    }
  });

  function resolveDesiredKey(): string | null {
    const currentProjection = projectionState.activeProjection.value;
    const resourceUrl = currentProjection.openContext?.resourceUrl ?? null;
    const headCommitId = currentProjection.replay.headCommitId ?? "head:none";

    if (
      !currentProjection.id
      || currentProjection.status !== "ready"
      || !currentProjection.readiness.inspectable
      || !currentProjection.taskSupport.supported
      || !resourceUrl
    ) {
      return null;
    }

    const identityKey =
      currentProjection.readiness.interactive
        ? identity.activeIdentity.value?.id ?? "interactive-missing"
        : "inspect";

    return `${resourceUrl}::${headCommitId}::${mode.value}::${identityKey}`;
  }

  function detachActiveApp(options?: {
    preserveSnapshot?: boolean;
    destroy?: boolean;
  }) {
    const currentApp = appState.value;

    unsubscribe?.();
    unsubscribe = null;
    appState.value = null;
    runtimeKeyState.value = null;

    if (!options?.preserveSnapshot) {
      snapshotState.value = null;
    }

    if (options?.destroy && currentApp) {
      void currentApp.destroy().catch(() => undefined);
    }
  }

  function attachApp(
    app: ConcordApp,
    cacheKey: string,
    resourceUrl: string,
    headCommitId: string | null,
  ) {
    unsubscribe?.();
    unsubscribe = null;
    appState.value = app;
    runtimeKeyState.value = cacheKey;
    activeResourceUrlState.value = resourceUrl;
    activeHeadCommitIdState.value = headCommitId;
    snapshotState.value = app.getState();
    unsubscribe = app.subscribe((nextState) => {
      snapshotState.value = nextState;
    });
    statusState.value = "ready";
    transitionState.value = "idle";
  }

  async function createAndLoadApp(
    resourceUrl: string,
  ): Promise<ConcordApp> {
    const currentProjection = projectionState.activeProjection.value;
    const openContext = currentProjection.openContext;
    const provider = openContext
      ? providerRegistry.getProvider(openContext.providerId)
      : null;

    if (!openContext?.capabilities.ledgerStorage || !provider?.createLedgerStorageAdapter) {
      throw new Error("Tasks storage is unavailable for the current ledger.");
    }

    const storage = await provider.createLedgerStorageAdapter(
      openContext.mountId,
      resourceUrl,
    );

    if (!storage) {
      throw new Error("Provider did not return a ledger storage adapter.");
    }

    const activeIdentity =
      mode.value === "interactive"
        ? identity.activeIdentity.value?.identity
        : undefined;

    const app = await createConcordApp({
      identity: activeIdentity,
      storage,
      plugins: [taskPlugin({ activeIdentity }) as ConcordReplayPlugin],
    });

    try {
      await app.load();
      return app;
    } catch (error) {
      await app.destroy().catch(() => undefined);
      throw error;
    }
  }

  async function syncRuntime(force = false): Promise<boolean> {
    if (syncPromise) {
      return await syncPromise;
    }

    syncPromise = (async () => {
      const currentProjection = projectionState.activeProjection.value;
      const resourceUrl = currentProjection.openContext?.resourceUrl ?? null;
      const desiredKey = resolveDesiredKey();
      const nextHeadCommitId = currentProjection.replay.headCommitId ?? null;

      if (!desiredKey || !resourceUrl) {
        errorState.value = null;
        statusState.value = currentProjection.id ? "error" : "idle";
        transitionState.value = "idle";
        detachActiveApp();
        activeResourceUrlState.value = null;
        activeHeadCommitIdState.value = null;
        return false;
      }

      if (!force && appState.value && runtimeKeyState.value === desiredKey) {
        errorState.value = null;
        statusState.value = "ready";
        transitionState.value = "idle";
        return true;
      }

      const sameLedgerTransition =
        activeResourceUrlState.value === resourceUrl
        && activeHeadCommitIdState.value === nextHeadCommitId
        && snapshotState.value !== null;

      statusState.value = "loading";
      transitionState.value = sameLedgerTransition
        ? "switching-identity"
        : "loading-ledger";
      errorState.value = null;

      const warmCryptoPromise =
        currentProjection.readiness.interactive
          ? warmTaskCrypto().catch(() => undefined)
          : Promise.resolve();

      await yieldToHost();
      await warmCryptoPromise;

      detachActiveApp({ preserveSnapshot: sameLedgerTransition });

      try {
        const app = await createAndLoadApp(resourceUrl);
        attachApp(app, desiredKey, resourceUrl, nextHeadCommitId);
        return true;
      } catch (error) {
        errorState.value = normalizeMessage(error);
        statusState.value = "error";
        transitionState.value = "idle";
        detachActiveApp({ preserveSnapshot: false, destroy: true });
        return false;
      }
    })();

    try {
      return await syncPromise;
    } finally {
      syncPromise = null;
    }
  }

  async function openTasksForLedger(url: string): Promise<boolean> {
    const selected = await workspaceActions.selectEntryByUrl(url);
    if (!selected.ok) {
      return false;
    }

    let matched = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const currentProjection = projectionState.activeProjection.value;
      if (
        currentProjection.candidate?.resourceUrl === url
        && currentProjection.status !== "resolving"
      ) {
        matched = true;
        break;
      }

      await new Promise((resolve) => {
        globalThis.setTimeout(resolve, 25);
      });
    }

    if (!matched) {
      return false;
    }

    return await syncRuntime();
  }

  watch(
    () =>
      [
        projectionState.activeProjection.value.id,
        projectionState.activeProjection.value.status,
        projectionState.activeProjection.value.readiness.inspectable ? "1" : "0",
        projectionState.activeProjection.value.readiness.interactive ? "1" : "0",
        projectionState.activeProjection.value.taskSupport.supported ? "1" : "0",
        projectionState.activeProjection.value.openContext?.resourceUrl ?? "",
        projectionState.activeProjection.value.replay.headCommitId ?? "",
        identity.activeIdentity.value?.id ?? "",
      ].join("|"),
    () => {
      void syncRuntime();
    },
    { immediate: true, flush: "post" },
  );

  return {
    mode,
    status: computed(() => statusState.value),
    transition: computed(() => transitionState.value),
    error: computed(() => errorState.value),
    reason,
    activeLedgerId: computed(
      () => projectionState.activeProjection.value.ledgerId,
    ),
    ready: computed(
      () => statusState.value === "ready" && Boolean(appState.value),
    ),
    state: computed(() => snapshotState.value),
    projection,
    app: computed(() => appState.value),
    ensureReady() {
      return syncRuntime();
    },
    async reset() {
      errorState.value = null;
      statusState.value = "idle";
      transitionState.value = "idle";
      detachActiveApp({ destroy: true });
      activeResourceUrlState.value = null;
      activeHeadCommitIdState.value = null;
    },
    openTasksForLedger,
  };
}

export function useRunTasksRuntime(): RunTasksRuntime {
  if (!singleton) {
    singleton = createRunTasksRuntime();
  }

  return singleton;
}

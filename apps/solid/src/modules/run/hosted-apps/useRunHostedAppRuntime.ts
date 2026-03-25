import { computed, ref, shallowRef, type ComputedRef } from "vue";
import { createConcordApp } from "@ternent/concord/browser";
import type { ConcordApp } from "@ternent/concord";
import { createSolidStorage } from "@ternent/solid";
import { useSolidSession } from "@/modules/solid-session";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunWorkspaceSource } from "@/modules/run/workspace";
import {
  getRunHostedApp,
  resolveDefaultRunHostedApp,
  resolveRunHostedAppsForProjection,
} from "./apps";

export type RunHostedAppRuntime = {
  activeHostAppId: ComputedRef<string | null>;
  activeHostProjectionId: ComputedRef<string | null>;
  activeHostLedgerId: ComputedRef<string | null>;
  hasActiveHost: ComputedRef<boolean>;
  canHostSelection: ComputedRef<boolean>;
  hostStatusLabel: ComputedRef<string>;
  availableHostIds: ComputedRef<string[]>;
  activateSelectedHost(appId?: string): Promise<boolean>;
  deactivateHost(): Promise<void>;
};

let singleton: RunHostedAppRuntime | null = null;

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error || "Unknown hosted app runtime error.");
}

function createHostedAppRuntime(): RunHostedAppRuntime {
  const workspace = useRunWorkspaceSource();
  const solid = useSolidSession();
  const projectionState = useRunProjectionState();
  const activeHostAppIdState = ref<string | null>(null);
  const activeHostProjectionIdState = ref<string | null>(null);
  const activeHostLedgerIdState = ref<string | null>(null);
  const statusState = ref<"idle" | "loading" | "active" | "error">("idle");
  const errorState = ref<string | null>(null);
  const activeAppState = shallowRef<ConcordApp | null>(null);

  async function destroyActiveHost() {
    const current = activeAppState.value;
    activeAppState.value = null;
    activeHostAppIdState.value = null;
    activeHostProjectionIdState.value = null;
    activeHostLedgerIdState.value = null;

    if (!current) {
      return;
    }

    await current.destroy().catch(() => undefined);
  }

  async function deactivateHost() {
    errorState.value = null;
    statusState.value = "idle";
    await destroyActiveHost();
  }

  async function activateSelectedHost(appId?: string): Promise<boolean> {
    const projection = projectionState.activeProjection.value;
    const openContext = projection.openContext;
    const identity = workspace.identity.value;
    const session = solid.session.value;

    if (!projection.id || !openContext || !identity || !session) {
      return false;
    }

    const definition =
      (appId ? getRunHostedApp(appId) : null) ??
      resolveDefaultRunHostedApp(projection);

    if (!definition) {
      return false;
    }

    statusState.value = "loading";
    errorState.value = null;
    await destroyActiveHost();
    statusState.value = "loading";

    try {
      const app = await createConcordApp({
        identity,
        storage: createSolidStorage(session, openContext.resourceUrl),
        plugins: definition.createPlugins(),
      });

      await app.load();
      activeAppState.value = app;
      activeHostAppIdState.value = definition.id;
      activeHostProjectionIdState.value = projection.id;
      activeHostLedgerIdState.value = openContext.ledgerId;
      statusState.value = "active";
      return true;
    } catch (error) {
      errorState.value = normalizeMessage(error);
      statusState.value = "error";
      await destroyActiveHost();
      return false;
    }
  }

  return {
    activeHostAppId: computed(() => activeHostAppIdState.value),
    activeHostProjectionId: computed(() => activeHostProjectionIdState.value),
    activeHostLedgerId: computed(() => activeHostLedgerIdState.value),
    hasActiveHost: computed(() =>
      Boolean(activeHostLedgerIdState.value && activeHostAppIdState.value),
    ),
    canHostSelection: computed(
      () => resolveRunHostedAppsForProjection(projectionState.activeProjection.value).length > 0,
    ),
    hostStatusLabel: computed(() => {
      if (errorState.value) {
        return "error";
      }
      if (statusState.value === "loading") {
        return "loading";
      }
      if (activeHostLedgerIdState.value && activeHostAppIdState.value) {
        return "active";
      }
      if (projectionState.activeProjection.value.id) {
        return "selection-ready";
      }
      return "idle";
    }),
    availableHostIds: computed(() =>
      resolveRunHostedAppsForProjection(projectionState.activeProjection.value).map(
        (app) => app.id,
      ),
    ),
    activateSelectedHost,
    deactivateHost,
  };
}

export function useRunHostedAppRuntime(): RunHostedAppRuntime {
  if (!singleton) {
    singleton = createHostedAppRuntime();
  }

  return singleton;
}

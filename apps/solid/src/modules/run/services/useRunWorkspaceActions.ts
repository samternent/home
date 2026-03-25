import { useRunHostedAppRuntime } from "@/modules/run/hosted-apps";
import { useRunStorageCatalog } from "@/modules/run/storage";
import { useRunWorkspaceSource, useRunWorkspaceState } from "@/modules/run/workspace";
import type { RunOpenEntryResult, RunServiceResult, RunWorkspaceActions } from "./types";

let singleton: RunWorkspaceActions | null = null;

function createError<T>(error: string): RunServiceResult<T> {
  return {
    ok: false,
    error,
  };
}

function createWorkspaceActions(): RunWorkspaceActions {
  const source = useRunWorkspaceSource();
  const storage = useRunStorageCatalog();
  const workspace = useRunWorkspaceState();
  const hostedApps = useRunHostedAppRuntime();

  async function resolveTarget(target: string) {
    const normalized = target.trim();
    if (!normalized) {
      return null;
    }

    const currentEntries = source.currentBrowse.value?.entries ?? [];
    const currentMatch =
      currentEntries.find((entry) => entry.url === normalized) ??
      currentEntries.find((entry) => entry.name === normalized) ??
      currentEntries.find((entry) => entry.name.replace(/\.json$/i, "") === normalized) ??
      currentEntries.find((entry) => entry.path === normalized);

    if (currentMatch) {
      return currentMatch;
    }

    const ledger = storage.ledgers.value.find(
      (item) =>
        item.id === normalized ||
        item.title === normalized ||
        item.path === normalized,
    );
    if (ledger) {
      return await source.lookupEntry(ledger.url);
    }

    if (/^https?:\/\//.test(normalized)) {
      return await source.lookupEntry(normalized);
    }

    return null;
  }

  async function openEntry(
    entry: NonNullable<Awaited<ReturnType<typeof resolveTarget>>>,
  ): Promise<RunOpenEntryResult> {
    if (entry.kind === "container") {
      await source.navigateTo(entry.url);
      return {
        ok: true,
        value: {
          entry,
          mode: "navigated",
        },
      };
    }

    if (entry.isLedger) {
      await workspace.selectLedger(entry.url);
    } else {
      await source.selectEntry(entry);
    }

    return {
      ok: true,
      value: {
        entry,
        mode: "selected",
      },
    };
  }

  return {
    async navigateToScope(scope) {
      await workspace.selectScope(scope);
    },
    async navigateUp() {
      const parentUrl = source.currentBrowse.value?.parentUrl;
      if (!parentUrl) {
        return createError("Already at the workspace root for this scope.");
      }

      await source.navigateTo(parentUrl);
      return {
        ok: true,
        value: { url: parentUrl },
      };
    },
    resolveTarget,
    async openTarget(target: string) {
      const entry = await resolveTarget(target);
      if (!entry) {
        return createError(`Target not found: ${target}`);
      }

      return await openEntry(entry);
    },
    async openEntryByUrl(url: string) {
      const entry = await resolveTarget(url);
      if (!entry) {
        return createError(`Target not found: ${url}`);
      }

      return await openEntry(entry);
    },
    async createFolder(name: string) {
      const entry = await source.createFolder(name);
      if (!entry) {
        return createError("Folder could not be created.");
      }

      return {
        ok: true,
        value: { entry },
      };
    },
    async createLedger(name: string) {
      const entry = await source.createLedger(name);
      if (!entry) {
        return createError("Ledger could not be created.");
      }

      return {
        ok: true,
        value: { entry },
      };
    },
    async openApp(appId?: string) {
      const ok = await hostedApps.activateSelectedHost(appId);
      if (!ok) {
        return createError("App could not be activated for the current projection.");
      }

      return {
        ok: true,
        value: {
          appId: hostedApps.activeHostAppId.value,
          ledgerId: hostedApps.activeHostLedgerId.value,
          projectionId: hostedApps.activeHostProjectionId.value,
        },
      };
    },
    async closeApp() {
      await hostedApps.deactivateHost();
    },
  };
}

export function useRunWorkspaceActions(): RunWorkspaceActions {
  if (!singleton) {
    singleton = createWorkspaceActions();
  }

  return singleton;
}

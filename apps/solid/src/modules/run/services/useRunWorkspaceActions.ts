import { useRunIdentityService } from "@/modules/run/identity";
import { useRunStorageCatalog } from "@/modules/run/storage";
import { useRunWorkspaceRuntime, useRunWorkspaceState } from "@/modules/run/workspace";
import type { RunBrowseEntry } from "@/modules/run/storage/types";
import type {
  RunOpenEntryResult,
  RunResolvedEntryResult,
  RunServiceResult,
  RunWorkspaceActions,
} from "./types";

let singleton: RunWorkspaceActions | null = null;

function createError<T>(error: string): RunServiceResult<T> {
  return {
    ok: false,
    error,
  };
}

function createWorkspaceActions(): RunWorkspaceActions {
  const runtime = useRunWorkspaceRuntime();
  const storage = useRunStorageCatalog();
  const workspace = useRunWorkspaceState();
  const identity = useRunIdentityService();

  function requireSigningIdentity(): string | null {
    return identity.activeIdentity.value
      ? null
      : "Set an identity before creating ledgers or other signed runtime actions.";
  }

  async function resolveTarget(target: string) {
    const normalized = target.trim();
    if (!normalized) {
      return null;
    }

    const currentEntries = runtime.currentBrowse.value?.entries ?? [];
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
      return await runtime.lookupEntry(ledger.url);
    }

    if (/^https?:\/\//.test(normalized)) {
      return await runtime.lookupEntry(normalized);
    }

    const mount =
      runtime.mounts.value.find((item) => item.id === normalized) ??
      runtime.mounts.value.find((item) => item.label === normalized) ??
      runtime.mounts.value.find((item) => item.scope === normalized);

    if (mount) {
      const mountEntry: RunBrowseEntry = {
        id: mount.rootUrl,
        mountId: mount.id,
        providerId: mount.providerId,
        url: mount.rootUrl,
        path: "/",
        name: mount.label,
        kind: "container",
        contentType: null,
        writable: mount.writable,
        lastModified: null,
        scope: mount.scope,
      };

      return mountEntry;
    }

    return null;
  }

  async function openEntry(entry: RunBrowseEntry): Promise<RunOpenEntryResult> {
    if (entry.kind === "container") {
      await runtime.navigateTo(entry.url);
      return {
        ok: true,
        value: {
          entry,
          mode: "navigated",
        },
      };
    }

    if (entry.kind === "ledger") {
      await workspace.selectLedger(entry.url);
    } else {
      await runtime.selectEntry(entry);
    }

    return {
      ok: true,
      value: {
        entry,
        mode: "selected",
      },
    };
  }

  async function navigateEntry(entry: RunBrowseEntry): Promise<RunResolvedEntryResult> {
    if (entry.kind !== "container") {
      return createError(`Target is not a container: ${entry.name}`);
    }

    await runtime.navigateTo(entry.url);
    return {
      ok: true,
      value: {
        entry,
      },
    };
  }

  async function selectEntry(entry: RunBrowseEntry): Promise<RunResolvedEntryResult> {
    if (entry.kind === "container") {
      return createError(`Target is not selectable: ${entry.name}`);
    }

    if (entry.kind === "ledger") {
      await workspace.selectLedger(entry.url);
    } else {
      await runtime.selectEntry(entry);
    }

    return {
      ok: true,
      value: {
        entry,
      },
    };
  }

  return {
    async navigateToScope(scope) {
      await workspace.selectScope(scope);
    },
    async navigateUp() {
      const parentUrl = runtime.currentBrowse.value?.parentUrl;
      if (!parentUrl) {
        return createError("Already at the workspace root for this scope.");
      }

      await runtime.navigateTo(parentUrl);
      return {
        ok: true,
        value: { url: parentUrl },
      };
    },
    resolveTarget,
    async navigateTarget(target: string) {
      const entry = await resolveTarget(target);
      if (!entry) {
        return createError(`Target not found: ${target}`);
      }

      return await navigateEntry(entry);
    },
    async navigateEntryByUrl(url: string) {
      const entry = await resolveTarget(url);
      if (!entry) {
        return createError(`Target not found: ${url}`);
      }

      return await navigateEntry(entry);
    },
    async selectTarget(target: string) {
      const entry = await resolveTarget(target);
      if (!entry) {
        return createError(`Target not found: ${target}`);
      }

      return await selectEntry(entry);
    },
    async selectEntryByUrl(url: string) {
      const entry = await resolveTarget(url);
      if (!entry) {
        return createError(`Target not found: ${url}`);
      }

      return await selectEntry(entry);
    },
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
      const entry = await runtime.createFolder(name);
      if (!entry) {
        return createError("Folder could not be created.");
      }

      return {
        ok: true,
        value: { entry },
      };
    },
    async createLedger(name: string) {
      const identityError = requireSigningIdentity();
      if (identityError) {
        return createError(identityError);
      }

      const entry = await runtime.createLedger(name, identity.activeIdentity.value!.identity);
      if (!entry) {
        return createError("Ledger could not be created.");
      }

      return {
        ok: true,
        value: { entry },
      };
    },
  };
}

export function useRunWorkspaceActions(): RunWorkspaceActions {
  if (!singleton) {
    singleton = createWorkspaceActions();
  }

  return singleton;
}

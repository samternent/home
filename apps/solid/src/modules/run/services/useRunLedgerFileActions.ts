import { createConcordApp } from "@ternent/concord/browser";
import { computed } from "vue";
import { useRunProjectionState } from "@/modules/run/replay";
import { useRunStorageCatalog } from "@/modules/run/storage";
import { saveBrowserLocalImportedLedger } from "@/modules/run/storage/providers/local/useRunLocalStorageProvider";
import type { RunLedgerContainer } from "@/modules/run/storage/types";
import { supportsTaskProjection } from "@/modules/run/tasks/compatibility";
import { useRunTasksRuntime } from "@/modules/run/tasks/useRunTasksRuntime";
import { useRunProviderRegistry } from "@/modules/run/workspace";
import { useRunWorkspaceRuntime } from "@/modules/run/workspace/useRunWorkspaceRuntime";
import type { RunLedgerFileActions, RunServiceResult } from "./types";
import { useRunWorkspaceActions } from "./useRunWorkspaceActions";

const browserLocalProviderId = "browser-local";

let singleton: RunLedgerFileActions | null = null;

function createError<T>(error: string): RunServiceResult<T> {
  return {
    ok: false,
    error,
  };
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown ledger file action error.");
}

function createTimestampToken(value = new Date()): string {
  return value.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[:.]/g, "-");
}

function ensureJsonFilename(value: string): string {
  const normalized = value.trim().replace(/[/\\]+/g, "-").replace(/\s+/g, "-");
  if (!normalized) {
    return "concord-demo.json";
  }

  return normalized.endsWith(".json") ? normalized : `${normalized}.json`;
}

function deriveImportFilename(fileName: string): string {
  const normalized = fileName.trim().replace(/\.json$/i, "");
  return ensureJsonFilename(normalized || `concord-import-${createTimestampToken()}`);
}

function deriveExportFilename(input: {
  title?: string | null;
  resourceUrl?: string | null;
}): string {
  if (input.title?.trim()) {
    return ensureJsonFilename(input.title);
  }

  const leaf = input.resourceUrl?.split("/").filter(Boolean).pop() ?? "";
  return ensureJsonFilename(leaf || "concord-demo-export");
}

function createRunLedgerFileActions(): RunLedgerFileActions {
  const workspace = useRunWorkspaceRuntime();
  const workspaceActions = useRunWorkspaceActions();
  const providerRegistry = useRunProviderRegistry();
  const projection = useRunProjectionState();
  const tasks = useRunTasksRuntime();
  const storage = useRunStorageCatalog();

  const localMount = computed(
    () => workspace.mounts.value.find((mount) => mount.providerId === browserLocalProviderId) ?? null,
  );

  async function selectLocalMount(): Promise<boolean> {
    const mount = localMount.value;
    if (!mount) {
      return false;
    }

    if (
      workspace.selection.value.activeMountId !== mount.id
      || workspace.selection.value.activeBrowseUrl !== mount.rootUrl
    ) {
      await workspace.selectMount(mount.id);
    }

    return true;
  }

  async function createLocalLedger() {
    if (!(await selectLocalMount())) {
      return createError("Browser-local storage is not available.");
    }

    const name = `concord-demo-${createTimestampToken()}`;
    const result = await workspaceActions.createLedger(name);
    if (!result.ok) {
      return result;
    }

    await workspaceActions.selectEntryByUrl(result.value.entry.url);
    return result;
  }

  async function validateTaskContainer(container: RunLedgerContainer) {
    const app = await createConcordApp({
      plugins: [],
    });

    try {
      await app.importLedger(container);
      const verification = await app.verify();
      if (!verification.committedHistoryValid) {
        return createError<RunLedgerContainer>("Imported concord failed committed-history verification.");
      }

      const exported = await app.exportLedger();
      const taskSupport = supportsTaskProjection(exported);
      if (!taskSupport.supported) {
        return createError<RunLedgerContainer>(
          taskSupport.reason ?? "Imported concord is not task-compatible.",
        );
      }

      return {
        ok: true as const,
        value: exported as RunLedgerContainer,
      };
    } catch (error) {
      return createError<RunLedgerContainer>(normalizeMessage(error));
    } finally {
      await app.destroy().catch(() => undefined);
    }
  }

  async function importLedgerFile(file: File) {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as RunLedgerContainer;
      const validated = await validateTaskContainer(parsed);
      if (!validated.ok) {
        return validated;
      }

      const savedEntry = saveBrowserLocalImportedLedger({
        name: deriveImportFilename(file.name),
        container: validated.value,
      });

      if (!(await selectLocalMount())) {
        return createError("Browser-local storage is not available.");
      }

      const selected = await workspaceActions.selectEntryByUrl(savedEntry.url);
      if (!selected.ok) {
        return selected;
      }

      return {
        ok: true as const,
        value: {
          entry: selected.value.entry,
        },
      };
    } catch (error) {
      return createError(normalizeMessage(error));
    }
  }

  async function loadActiveLedgerContainer(): Promise<RunServiceResult<RunLedgerContainer>> {
    const activeApp = tasks.app.value;
    if (activeApp) {
      if (activeApp.getState().stagedCount > 0) {
        return createError("Commit or discard staged changes before exporting this concord.");
      }

      try {
        return {
          ok: true,
          value: (await activeApp.exportLedger()) as RunLedgerContainer,
        };
      } catch (error) {
        return createError(normalizeMessage(error));
      }
    }

    const openContext = projection.activeProjection.value.openContext;
    if (!openContext?.capabilities.ledgerStorage) {
      return createError("No active concord is available to export.");
    }

    const provider = providerRegistry.getProvider(openContext.providerId);
    if (!provider?.createLedgerStorageAdapter) {
      return createError("The active provider cannot export ledger storage.");
    }

    try {
      const storageAdapter = await provider.createLedgerStorageAdapter(
        openContext.mountId,
        openContext.resourceUrl,
      );

      if (!storageAdapter) {
        return createError("The active concord storage adapter is unavailable.");
      }

      const snapshot = await storageAdapter.load();
      if (!snapshot?.container) {
        return createError("The active concord has no committed ledger snapshot to export.");
      }

      return {
        ok: true,
        value: snapshot.container,
      };
    } catch (error) {
      return createError(normalizeMessage(error));
    }
  }

  return {
    createLocalLedger,
    importLedgerFile,
    async exportActiveLedger() {
      const container = await loadActiveLedgerContainer();
      if (!container.ok) {
        return container;
      }

      const activeLedgerId = projection.activeProjection.value.ledgerId;
      const activeLedger = activeLedgerId
        ? storage.ledgers.value.find((entry) => entry.id === activeLedgerId) ?? null
        : null;

      return {
        ok: true,
        value: {
          filename: deriveExportFilename({
            title: activeLedger?.title ?? null,
            resourceUrl: projection.activeProjection.value.openContext?.resourceUrl ?? null,
          }),
          content: JSON.stringify(container.value, null, 2),
        },
      };
    },
  };
}

export function useRunLedgerFileActions(): RunLedgerFileActions {
  if (!singleton) {
    singleton = createRunLedgerFileActions();
  }

  return singleton;
}

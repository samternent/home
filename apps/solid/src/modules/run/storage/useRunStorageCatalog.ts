import { computed, type ComputedRef } from "vue";
import type {
  RunCoreLedgerRecord,
  RunCoreMount,
  RunCoreResourceRecord,
} from "@/modules/run/core/types";
import { useRunWorkspaceRuntime } from "@/modules/run/workspace";

export type RunStorageCatalog = {
  mounts: ComputedRef<RunCoreMount[]>;
  resources: ComputedRef<RunCoreResourceRecord[]>;
  ledgers: ComputedRef<RunCoreLedgerRecord[]>;
};

let singleton: RunStorageCatalog | null = null;

function createCatalog(): RunStorageCatalog {
  const workspace = useRunWorkspaceRuntime();

  const mounts = computed<RunCoreMount[]>(() => workspace.mounts.value);

  const resources = computed<RunCoreResourceRecord[]>(() => {
    const seen = new Map<string, RunCoreResourceRecord>();

    for (const browse of Object.values(workspace.browseCache.value)) {
      for (const entry of browse.entries) {
        if (seen.has(entry.url)) {
          continue;
        }

        seen.set(entry.url, {
          id: entry.url,
          mountId: entry.mountId,
          providerId: entry.providerId,
          kind: entry.kind,
          title: entry.name.replace(/\.json$/i, ""),
          name: entry.name,
          url: entry.url,
          path: entry.path,
          scope: entry.scope,
          lastModified: entry.lastModified,
          contentType: entry.contentType,
          verificationStatus: "unknown",
        });
      }
    }

    return Array.from(seen.values()).sort((left, right) =>
      left.url.localeCompare(right.url),
    );
  });

  const ledgers = computed<RunCoreLedgerRecord[]>(() =>
    resources.value
      .filter((resource) => resource.kind === "ledger")
      .map((resource) => ({
        id: resource.id,
        resourceId: resource.id,
        mountId: resource.mountId,
        providerId: resource.providerId,
        title: resource.title,
        url: resource.url,
        path: resource.path,
        scope: resource.scope,
        verificationStatus: resource.verificationStatus,
      })),
  );

  return {
    mounts,
    resources,
    ledgers,
  };
}

export function useRunStorageCatalog(): RunStorageCatalog {
  if (!singleton) {
    singleton = createCatalog();
  }

  return singleton;
}

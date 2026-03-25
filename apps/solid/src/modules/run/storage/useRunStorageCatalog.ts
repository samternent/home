import { computed, type ComputedRef } from "vue";
import type {
  RunCoreLedgerRecord,
  RunCoreMount,
  RunCoreResourceRecord,
} from "@/modules/run/core/types";
import { useRunWorkspaceSource } from "@/modules/run/workspace";

export type RunStorageCatalog = {
  mounts: ComputedRef<RunCoreMount[]>;
  resources: ComputedRef<RunCoreResourceRecord[]>;
  ledgers: ComputedRef<RunCoreLedgerRecord[]>;
};

let singleton: RunStorageCatalog | null = null;

function createCatalog(): RunStorageCatalog {
  const workspace = useRunWorkspaceSource();

  const mounts = computed<RunCoreMount[]>(() => {
    const paths = workspace.paths.value;
    if (!paths) {
      return [];
    }

    return [
      {
        id: "private",
        label: "Private",
        scope: "private",
        rootUrl: paths.workspacePrivateRootUrl,
        writable: true,
      },
      {
        id: "shared",
        label: "Shared",
        scope: "shared",
        rootUrl: paths.workspaceSharedRootUrl,
        writable: true,
      },
      {
        id: "public",
        label: "Public",
        scope: "public",
        rootUrl: paths.workspacePublicRootUrl,
        writable: true,
      },
    ];
  });

  const resources = computed<RunCoreResourceRecord[]>(() => {
    const seen = new Map<string, RunCoreResourceRecord>();

    for (const browse of Object.values(workspace.browseCache.value)) {
      for (const entry of browse.entries) {
        if (seen.has(entry.url)) {
          continue;
        }

        seen.set(entry.url, {
          id: entry.url,
          kind: entry.isLedger
            ? "ledger"
            : entry.kind === "container"
              ? "container"
              : "file",
          title: entry.name.replace(/\.json$/i, ""),
          name: entry.name,
          url: entry.url,
          path: entry.path,
          scope: entry.scope,
          lastModified: entry.lastModified,
          contentType: entry.contentType,
          verificationStatus: "verified",
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

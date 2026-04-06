import { computed, ref, watch, type ComputedRef } from "vue";
import { getPodUrlAll } from "@inrupt/solid-client";
import { parseIdentity, validateIdentity } from "@ternent/identity";
import {
  createSolidConcordPaths,
  createSolidStorage,
  createSolidWorkspace,
  discoverSolidConcordResources,
  type SolidConcordPaths,
  type SolidConcordResources,
  type SolidWorkspace,
  type SolidWorkspaceBrowseResult,
  type SolidWorkspaceEntry,
  type SolidWorkspaceScope,
} from "@ternent/solid";
import {
  type RunIdentityBootstrapCandidate,
  type RunIdentityRecord,
} from "@/modules/run/identity";
import { useSolidSession, type SolidSessionController } from "@/modules/solid-session";
import type {
  RunBrowseEntry,
  RunBrowseResult,
  RunCreateFolderInput,
  RunCreateLedgerInput,
  RunMountDescriptor,
  RunStorageProvider,
  RunWorkspaceScope,
} from "@/modules/run/storage/types";

export type RunSolidStorageProvider = RunStorageProvider & {
  selectedPod: ComputedRef<string>;
  paths: ComputedRef<SolidConcordPaths | null>;
  resources: ComputedRef<SolidConcordResources | null>;
  currentBrowse: ComputedRef<RunBrowseResult | null>;
  browseCache: ComputedRef<Record<string, RunBrowseResult>>;
  selectedEntry: ComputedRef<RunBrowseEntry | null>;
  currentScope: ComputedRef<RunWorkspaceScope>;
  init(): Promise<void>;
};

type SolidMountId = SolidWorkspaceScope;

const appPath = "concord";
const podStorageKey = "solid/concord-pod-root";
const identityCacheFileName = "identity-cache.json";

type SolidCachedIdentityPayload = {
  version: "1";
  entries: RunIdentityRecord[];
};

let singleton: RunSolidStorageProvider | null = null;

function canUseBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown Solid provider error.");
}

function normalizeContainerUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function identityCacheUrl(paths: SolidConcordPaths): string {
  return new URL(identityCacheFileName, paths.systemPrivateRootUrl).toString();
}

function normalizeIdentityPayload(value: unknown): SolidCachedIdentityPayload {
  if (!value || typeof value !== "object") {
    return { version: "1", entries: [] };
  }

  const entries = Array.isArray(Reflect.get(value, "entries"))
    ? (Reflect.get(value, "entries") as RunIdentityRecord[])
    : [];

  return {
    version: "1",
    entries,
  };
}

function loadStoredPod(): string {
  if (!canUseBrowser()) {
    return "";
  }

  try {
    return localStorage.getItem(podStorageKey)?.trim() || "";
  } catch {
    return "";
  }
}

function persistPod(url: string) {
  if (!canUseBrowser()) {
    return;
  }

  try {
    localStorage.setItem(podStorageKey, url);
  } catch {
    return;
  }
}

function getScopeRoot(paths: SolidConcordPaths, scope: SolidWorkspaceScope): string {
  if (scope === "shared") {
    return paths.workspaceSharedRootUrl;
  }
  if (scope === "public") {
    return paths.workspacePublicRootUrl;
  }
  return paths.workspacePrivateRootUrl;
}

function getUrlPathSegments(rootUrl: string, targetUrl: string): string[] {
  if (!targetUrl.startsWith(rootUrl)) {
    return [];
  }

  const relative = targetUrl.slice(rootUrl.length);
  return relative.split("/").filter(Boolean);
}

function getMountIdForUrl(
  paths: SolidConcordPaths,
  url: string,
): SolidMountId {
  if (url.startsWith(paths.workspaceSharedRootUrl)) {
    return "shared";
  }
  if (url.startsWith(paths.workspacePublicRootUrl)) {
    return "public";
  }
  return "private";
}

function mapEntry(entry: SolidWorkspaceEntry): RunBrowseEntry {
  return {
    id: entry.url,
    mountId: entry.scope,
    providerId: "solid",
    url: entry.url,
    path: entry.path,
    name: entry.name,
    kind: entry.isLedger ? "ledger" : entry.kind,
    contentType: entry.contentType,
    writable: true,
    lastModified: entry.lastModified,
    scope: entry.scope,
  };
}

function mapBrowseResult(
  paths: SolidConcordPaths,
  browse: SolidWorkspaceBrowseResult,
): RunBrowseResult {
  return {
    mountId: getMountIdForUrl(paths, browse.url),
    providerId: "solid",
    url: browse.url,
    path: browse.path,
    parentUrl: browse.parentUrl,
    scope: browse.scope,
    entries: browse.entries.map(mapEntry),
  };
}

function createMounts(paths: SolidConcordPaths | null): RunMountDescriptor[] {
  if (!paths) {
    return [];
  }

  return [
    {
      id: "private",
      providerId: "solid",
      label: "Private",
      rootUrl: paths.workspacePrivateRootUrl,
      writable: true,
      browsable: true,
      scope: "private",
    },
    {
      id: "shared",
      providerId: "solid",
      label: "Shared",
      rootUrl: paths.workspaceSharedRootUrl,
      writable: true,
      browsable: true,
      scope: "shared",
    },
    {
      id: "public",
      providerId: "solid",
      label: "Public",
      rootUrl: paths.workspacePublicRootUrl,
      writable: true,
      browsable: true,
      scope: "public",
    },
  ];
}

function createSolidStorageProvider(
  solid: SolidSessionController,
): RunSolidStorageProvider {
  const status = ref<"idle" | "connecting" | "ready" | "error">("idle");
  const error = ref<string | null>(null);
  const podUrls = ref<string[]>([]);
  const selectedPod = ref(loadStoredPod());
  const paths = ref<SolidConcordPaths | null>(null);
  const resources = ref<SolidConcordResources | null>(null);
  const workspace = ref<SolidWorkspace | null>(null);
  const currentBrowse = ref<RunBrowseResult | null>(null);
  const browseCache = ref<Record<string, RunBrowseResult>>({});
  const selectedEntry = ref<RunBrowseEntry | null>(null);
  let started = false;

  const mounts = computed(() => createMounts(paths.value));
  const currentScope = computed<RunWorkspaceScope>(
    () => currentBrowse.value?.scope ?? "private",
  );

  function resetProviderState() {
    status.value = "idle";
    error.value = null;
    podUrls.value = [];
    selectedPod.value = loadStoredPod();
    paths.value = null;
    resources.value = null;
    workspace.value = null;
    currentBrowse.value = null;
    browseCache.value = {};
    selectedEntry.value = null;
  }

  function sessionFetch() {
    const session = solid.session.value;
    if (!session?.fetch) {
      throw new Error("A Solid session is required.");
    }

    return session;
  }

  function updateBrowseCache(nextBrowse: RunBrowseResult) {
    browseCache.value = {
      ...browseCache.value,
      [nextBrowse.url]: nextBrowse,
    };
  }

  async function listWorkspace(url: string): Promise<RunBrowseResult> {
    const currentPaths = paths.value;
    if (!workspace.value || !currentPaths) {
      throw new Error("Solid workspace is not ready.");
    }

    const browse = await workspace.value.list(url);
    return mapBrowseResult(currentPaths, browse);
  }

  async function cacheBrowse(url: string) {
    const nextBrowse = await listWorkspace(url);
    updateBrowseCache(nextBrowse);
    return nextBrowse;
  }

  async function ensureTreePathLoaded(url: string) {
    const currentPaths = paths.value;
    if (!workspace.value || !currentPaths) {
      return;
    }

    const scope = getMountIdForUrl(currentPaths, url);
    const scopeRoot = getScopeRoot(currentPaths, scope);
    const segments = getUrlPathSegments(scopeRoot, normalizeContainerUrl(url));
    let current = scopeRoot;

    await cacheBrowse(scopeRoot);

    for (const segment of segments) {
      current = new URL(`${segment}/`, current).toString();
      await cacheBrowse(current);
    }
  }

  async function refreshTree() {
    for (const mount of mounts.value) {
      await cacheBrowse(mount.rootUrl);
    }

    if (currentBrowse.value?.url) {
      await ensureTreePathLoaded(currentBrowse.value.url);
    }
  }

  async function refreshBrowse(url?: string) {
    const currentPaths = paths.value;
    const fallbackUrl =
      url ?? currentBrowse.value?.url ?? currentPaths?.workspacePrivateRootUrl ?? null;

    if (!fallbackUrl) {
      currentBrowse.value = null;
      return null;
    }

    const nextBrowse = await listWorkspace(fallbackUrl);
    currentBrowse.value = nextBrowse;
    updateBrowseCache(nextBrowse);
    await ensureTreePathLoaded(nextBrowse.url);
    return nextBrowse;
  }

  async function loadIdentityCachePayload(): Promise<SolidCachedIdentityPayload> {
    const session = solid.session.value;
    const currentPaths = paths.value;
    if (!session || !currentPaths) {
      return { version: "1", entries: [] };
    }

    const response = await session.fetch(identityCacheUrl(currentPaths), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 404) {
      return { version: "1", entries: [] };
    }

    if (!response.ok) {
      throw new Error(
        `Failed to load Solid identity cache: ${response.status} ${response.statusText}`,
      );
    }

    return normalizeIdentityPayload(await response.json());
  }

  async function saveIdentityCachePayload(payload: SolidCachedIdentityPayload) {
    const session = solid.session.value;
    const currentPaths = paths.value;
    if (!session || !currentPaths) {
      throw new Error("Solid identity cache is unavailable without an active session.");
    }

    const response = await session.fetch(identityCacheUrl(currentPaths), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: `${JSON.stringify(payload, null, 2)}\n`,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to save Solid identity cache: ${response.status} ${response.statusText}`,
      );
    }
  }

  async function mapBootstrapCandidate(
    providerId: string,
    record: RunIdentityRecord,
  ): Promise<RunIdentityBootstrapCandidate> {
    try {
      const validated = await validateIdentity(parseIdentity(record.identity));
      return {
        id: `${providerId}:${validated.keyId}`,
        providerId,
        cacheId: record.id,
        label: record.profile.label,
        createdAt: record.profile.createdAt,
        keyId: validated.keyId,
        publicKey: validated.publicKey,
        valid: true,
        error: null,
      };
    } catch (nextError) {
      return {
        id: `${providerId}:${record.id}`,
        providerId,
        cacheId: record.id,
        label: record.profile?.label ?? `Cached identity ${record.id}`,
        createdAt: record.profile?.createdAt ?? "",
        keyId:
          typeof record.identity?.keyId === "string" ? record.identity.keyId : null,
        publicKey:
          typeof record.identity?.publicKey === "string"
            ? record.identity.publicKey
            : null,
        valid: false,
        error: normalizeMessage(nextError),
      };
    }
  }

  async function loadWorkspaceContext() {
    const session = sessionFetch();
    if (!solid.isAuthenticated.value || !solid.webId.value) {
      return;
    }

    status.value = "connecting";
    error.value = null;

    const nextPaths = await createSolidConcordPaths(session, {
      appPath,
      podRoot: selectedPod.value,
    });

    paths.value = nextPaths;
    resources.value = await discoverSolidConcordResources(session, {
      appPath,
      podRoot: selectedPod.value,
    });
    workspace.value = await createSolidWorkspace({
      session,
      appPath,
      podRoot: selectedPod.value,
      paths: nextPaths,
    });
    await workspace.value.ensure();
    browseCache.value = {};
    await refreshBrowse(nextPaths.workspacePrivateRootUrl);
    await refreshTree();
    selectedEntry.value = null;
    status.value = "ready";
  }

  async function refreshPods() {
    if (!solid.isAuthenticated.value || !solid.webId.value) {
      podUrls.value = [];
      selectedPod.value = "";
      return;
    }

    error.value = null;

    try {
      const session = sessionFetch();
      const pods = await getPodUrlAll(solid.webId.value, {
        fetch: session.fetch,
      });

      podUrls.value = pods;
      const stored = loadStoredPod();
      const nextSelected =
        (selectedPod.value && pods.includes(selectedPod.value) && selectedPod.value) ||
        (stored && pods.includes(stored) && stored) ||
        pods[0] ||
        "";

      selectedPod.value = nextSelected;

      if (nextSelected) {
        persistPod(nextSelected);
        await loadWorkspaceContext();
      } else {
        status.value = "ready";
      }
    } catch (nextError) {
      error.value = `Failed to load pods: ${normalizeMessage(nextError)}`;
      status.value = "error";
    }
  }

  async function initializeProvider() {
    if (!solid.isAuthenticated.value || !solid.webId.value) {
      status.value = "idle";
      return;
    }

    await refreshPods();
  }

  async function syncWorkspaceState(targetUrl?: string) {
    await refreshBrowse(targetUrl ?? currentBrowse.value?.url ?? undefined);
    await refreshTree();
  }

  watch(
    () => [solid.isAuthenticated.value, solid.webId.value] as const,
    async ([isAuthenticated]) => {
      if (!started) {
        return;
      }

      if (!isAuthenticated) {
        resetProviderState();
        return;
      }

      await initializeProvider();
    },
  );

  return {
    manifest: {
      id: "solid",
      label: "Solid",
      capabilities: [
        "provider-auth",
        "mount",
        "browse",
        "stat",
        "create-folder",
        "create-ledger",
        "identity-cache",
        "ledger-storage",
      ],
    },
    status: computed(() => status.value),
    error: computed(() => error.value),
    mounts,
    selectedPod: computed(() => selectedPod.value),
    paths: computed(() => paths.value),
    resources: computed(() => resources.value),
    currentBrowse: computed(() => currentBrowse.value),
    browseCache: computed(() => browseCache.value),
    selectedEntry: computed(() => selectedEntry.value),
    currentScope,
    async init() {
      if (started) {
        return;
      }

      started = true;
      await initializeProvider();
    },
    async connect() {
      started = true;
      await initializeProvider();
    },
    async disconnect() {
      resetProviderState();
    },
    async listMounts() {
      return mounts.value;
    },
    async browse(_mountId: string, url: string) {
      const browse = await refreshBrowse(url);
      if (!browse) {
        throw new Error("Solid workspace is not ready.");
      }

      return browse;
    },
    async stat(_mountId: string, url: string) {
      if (!workspace.value) {
        return null;
      }

      const entry = await workspace.value.stat(url);
      return entry ? mapEntry(entry) : null;
    },
    async createFolder(input: RunCreateFolderInput) {
      const normalized = input.name.trim();
      if (!workspace.value || !normalized) {
        throw new Error("Solid workspace is not ready.");
      }

      const entry = await workspace.value.createFolder(input.parentUrl, normalized);
      await syncWorkspaceState(input.parentUrl);
      return mapEntry(entry);
    },
    async createLedger(input: RunCreateLedgerInput) {
      const normalized = input.name.trim();
      const identity = input.signer;
      if (!workspace.value || !identity || !normalized) {
        throw new Error("A valid active identity is required to create a ledger.");
      }

      const entry = await workspace.value.createLedger(input.parentUrl, normalized, {
        identity,
      });
      await syncWorkspaceState(input.parentUrl);
      return mapEntry(entry);
    },
    async createLedgerStorageAdapter(_mountId: string, resourceUrl: string) {
      const session = solid.session.value;
      if (!session) {
        return null;
      }

      return createSolidStorage(session, resourceUrl);
    },
    async listCachedIdentities() {
      const payload = await loadIdentityCachePayload();
      const candidates = await Promise.all(
        payload.entries.map((record) => mapBootstrapCandidate("solid", record)),
      );

      return candidates.sort((left, right) => left.label.localeCompare(right.label));
    },
    async readCachedIdentity(cacheId: string) {
      const payload = await loadIdentityCachePayload();
      const record = payload.entries.find((entry) => entry.id === cacheId) ?? null;
      if (!record) {
        return null;
      }

      const validated = await validateIdentity(parseIdentity(record.identity));
      return {
        ...record,
        id: validated.keyId,
        identity: validated,
        profile: {
          ...record.profile,
          createdAt: record.profile?.createdAt || validated.createdAt,
          label: record.profile?.label || `Identity ${validated.keyId.slice(0, 8)}`,
        },
      };
    },
    async writeCachedIdentity(record: RunIdentityRecord) {
      const payload = await loadIdentityCachePayload();
      const validated = await validateIdentity(parseIdentity(record.identity));
      const nextRecord: RunIdentityRecord = {
        id: validated.keyId,
        identity: validated,
        profile: {
          label: record.profile.label,
          createdAt: record.profile.createdAt || validated.createdAt,
        },
      };
      const nextEntries = payload.entries.filter((entry) => entry.id !== nextRecord.id);
      nextEntries.push(nextRecord);
      await saveIdentityCachePayload({
        version: "1",
        entries: nextEntries.sort((left, right) =>
          left.profile.label.localeCompare(right.profile.label),
        ),
      });
    },
  };
}

export function useRunSolidStorageProvider(): RunSolidStorageProvider {
  if (!singleton) {
    singleton = createSolidStorageProvider(useSolidSession());
  }

  return singleton;
}

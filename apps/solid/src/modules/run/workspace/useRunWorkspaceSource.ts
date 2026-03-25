import { computed, ref, watch, type ComputedRef } from "vue";
import { getPodUrlAll } from "@inrupt/solid-client";
import type { SerializedIdentity } from "@ternent/identity";
import {
  createSolidConcordPaths,
  createSolidIdentityCache,
  createSolidWorkspace,
  discoverSolidConcordResources,
  provisionSolidIdentity,
  type SolidConcordPaths,
  type SolidConcordResources,
  type SolidWorkspace,
  type SolidWorkspaceBrowseResult,
  type SolidWorkspaceEntry,
  type SolidWorkspaceScope,
} from "@ternent/solid";
import { useSolidSession, type SolidSessionController } from "@/modules/solid-session";

export type RunWorkspaceSourceStatus = "idle" | "loading" | "ready" | "error";

export type RunWorkspaceSource = {
  status: ComputedRef<RunWorkspaceSourceStatus>;
  error: ComputedRef<string | null>;
  selectedPod: ComputedRef<string>;
  paths: ComputedRef<SolidConcordPaths | null>;
  resources: ComputedRef<SolidConcordResources | null>;
  currentBrowse: ComputedRef<SolidWorkspaceBrowseResult | null>;
  browseCache: ComputedRef<Record<string, SolidWorkspaceBrowseResult>>;
  selectedEntry: ComputedRef<SolidWorkspaceEntry | null>;
  identity: ComputedRef<SerializedIdentity | null>;
  identityReady: ComputedRef<boolean>;
  currentScope: ComputedRef<SolidWorkspaceScope>;
  init(): Promise<void>;
  selectScope(scope: SolidWorkspaceScope): Promise<void>;
  navigateTo(url: string): Promise<void>;
  selectEntry(entry: SolidWorkspaceEntry | null): Promise<void>;
  openEntry(entry: SolidWorkspaceEntry): Promise<void>;
  lookupEntry(url: string): Promise<SolidWorkspaceEntry | null>;
  createFolder(name: string): Promise<SolidWorkspaceEntry | null>;
  createLedger(name: string): Promise<SolidWorkspaceEntry | null>;
};

const appPath = "concord";
const podStorageKey = "solid/concord-pod-root";

let singleton: RunWorkspaceSource | null = null;

function canUseBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown run workspace error.");
}

function normalizeContainerUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
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

function createWorkspaceSource(solid: SolidSessionController): RunWorkspaceSource {
  const status = ref<RunWorkspaceSourceStatus>("idle");
  const error = ref<string | null>(null);
  const podUrls = ref<string[]>([]);
  const selectedPod = ref(loadStoredPod());
  const paths = ref<SolidConcordPaths | null>(null);
  const resources = ref<SolidConcordResources | null>(null);
  const workspace = ref<SolidWorkspace | null>(null);
  const currentBrowse = ref<SolidWorkspaceBrowseResult | null>(null);
  const browseCache = ref<Record<string, SolidWorkspaceBrowseResult>>({});
  const selectedEntry = ref<SolidWorkspaceEntry | null>(null);
  const identity = ref<SerializedIdentity | null>(null);
  let started = false;

  const currentScope = computed<SolidWorkspaceScope>(
    () => currentBrowse.value?.scope ?? "private",
  );

  function sessionFetch() {
    const session = solid.session.value;
    if (!session?.fetch) {
      throw new Error("A Solid session is required.");
    }

    return session;
  }

  function updateBrowseCache(nextBrowse: SolidWorkspaceBrowseResult) {
    browseCache.value = {
      ...browseCache.value,
      [nextBrowse.url]: nextBrowse,
    };
  }

  async function cacheBrowse(url: string) {
    if (!workspace.value) {
      return null;
    }

    const nextBrowse = await workspace.value.list(url);
    updateBrowseCache(nextBrowse);
    return nextBrowse;
  }

  async function ensureTreePathLoaded(url: string) {
    if (!workspace.value || !paths.value) {
      return;
    }

    const scope = url.startsWith(paths.value.workspaceSharedRootUrl)
      ? "shared"
      : url.startsWith(paths.value.workspacePublicRootUrl)
        ? "public"
        : "private";
    const scopeRoot = getScopeRoot(paths.value, scope);
    const segments = getUrlPathSegments(scopeRoot, normalizeContainerUrl(url));
    let current = scopeRoot;

    await cacheBrowse(scopeRoot);

    for (const segment of segments) {
      current = new URL(`${segment}/`, current).toString();
      await cacheBrowse(current);
    }
  }

  async function refreshTree() {
    if (!workspace.value || !paths.value) {
      browseCache.value = {};
      return;
    }

    for (const root of [
      paths.value.workspacePrivateRootUrl,
      paths.value.workspaceSharedRootUrl,
      paths.value.workspacePublicRootUrl,
    ]) {
      await cacheBrowse(root);
    }

    if (currentBrowse.value?.url) {
      await ensureTreePathLoaded(currentBrowse.value.url);
    }
  }

  async function refreshBrowse(url?: string) {
    if (!workspace.value) {
      currentBrowse.value = null;
      return;
    }

    const nextBrowse = await workspace.value.list(
      url ?? currentBrowse.value?.url ?? paths.value?.workspacePrivateRootUrl,
    );
    currentBrowse.value = nextBrowse;
    updateBrowseCache(nextBrowse);
    await ensureTreePathLoaded(nextBrowse.url);
  }

  async function ensureIdentity() {
    const session = solid.session.value;
    if (!session) {
      identity.value = null;
      return;
    }

    const cache = createSolidIdentityCache({ session });
    const cached = await cache.load().catch(() => null);
    if (cached) {
      identity.value = cached;
      return;
    }

    const result = await provisionSolidIdentity({
      session,
      cache,
      profile: {
        enabled: true,
        bootstrap: true,
        discover: true,
        accessValidation: "warn",
        appPath,
        podRoot: selectedPod.value || undefined,
      },
    });

    identity.value = result.identity;
    resources.value = result.resources ?? resources.value;
  }

  async function loadWorkspaceContext() {
    const session = sessionFetch();
    if (!solid.isAuthenticated.value || !solid.webId.value) {
      return;
    }

    status.value = "loading";
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
    await ensureIdentity();
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

  async function initializeSource() {
    if (!solid.isAuthenticated.value || !solid.webId.value) {
      status.value = "idle";
      return;
    }

    await refreshPods();
  }

  async function selectScope(scope: SolidWorkspaceScope) {
    if (!paths.value) {
      return;
    }

    await navigateTo(getScopeRoot(paths.value, scope));
  }

  async function navigateTo(url: string) {
    selectedEntry.value = null;
    await refreshBrowse(url);
  }

  async function selectEntry(entry: SolidWorkspaceEntry | null) {
    selectedEntry.value = entry;
  }

  async function openEntry(entry: SolidWorkspaceEntry) {
    if (entry.kind === "container") {
      await navigateTo(entry.url);
      return;
    }

    await selectEntry(entry);
  }

  async function lookupEntry(url: string) {
    if (!workspace.value) {
      return null;
    }

    return await workspace.value.stat(url);
  }

  async function syncWorkspaceState(targetUrl?: string) {
    await refreshBrowse(targetUrl ?? currentBrowse.value?.url ?? undefined);
    await refreshTree();
  }

  async function createFolder(name: string) {
    const normalized = name.trim();
    if (!workspace.value || !currentBrowse.value || !normalized) {
      return null;
    }

    const entry = await workspace.value.createFolder(currentBrowse.value.url, normalized);
    await syncWorkspaceState(currentBrowse.value.url);
    return entry;
  }

  async function createLedger(name: string) {
    const normalized = name.trim();
    if (!workspace.value || !currentBrowse.value || !identity.value || !normalized) {
      return null;
    }

    const entry = await workspace.value.createLedger(currentBrowse.value.url, normalized, {
      identity: identity.value,
    });
    await syncWorkspaceState(currentBrowse.value.url);
    return entry;
  }

  watch(
    () => [solid.isAuthenticated.value, solid.webId.value] as const,
    async ([isAuthenticated]) => {
      if (!started) {
        return;
      }

      if (!isAuthenticated) {
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
        identity.value = null;
        return;
      }

      await initializeSource();
    },
  );

  return {
    status: computed(() => status.value),
    error: computed(() => error.value),
    selectedPod: computed(() => selectedPod.value),
    paths: computed(() => paths.value),
    resources: computed(() => resources.value),
    currentBrowse: computed(() => currentBrowse.value),
    browseCache: computed(() => browseCache.value),
    selectedEntry: computed(() => selectedEntry.value),
    identity: computed(() => identity.value),
    identityReady: computed(() => Boolean(identity.value)),
    currentScope,
    async init() {
      if (started) {
        return;
      }

      started = true;
      await initializeSource();
    },
    selectScope,
    navigateTo,
    selectEntry,
    openEntry,
    lookupEntry,
    createFolder,
    createLedger,
  };
}

export function useRunWorkspaceSource(): RunWorkspaceSource {
  if (!singleton) {
    singleton = createWorkspaceSource(useSolidSession());
  }

  return singleton;
}

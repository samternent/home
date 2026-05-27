import { computed, ref, watch, type ComputedRef } from "vue";
import { getPodUrlAll } from "@inrupt/solid-client";
import type { SerializedIdentity } from "@ternent/identity";
import {
  createConcordOsPeopleStorage,
  createEmptyConcordOsPeopleRegistry,
  createSolidConcordPaths,
  createSolidIdentityCache,
  createSolidWorkspace,
  discoverSolidConcordResources,
  provisionSolidIdentity,
  validateSolidConcordAccess,
  type ConcordOsPeopleRegistry,
  type SolidConcordAccessReport,
  type SolidConcordPaths,
  type SolidConcordResources,
  type SolidWorkspace,
  type SolidWorkspaceAccessSummary,
  type SolidWorkspaceBrowseResult,
  type SolidWorkspaceEntry,
  type SolidWorkspaceReadResult,
  type SolidWorkspaceScope,
} from "@ternent/solid";
import type { TreeNode } from "ternent-ui/primitives";
import { useSolidSession, type SolidSessionController } from "@/modules/solid-session";

export type StoreStatus = "idle" | "loading" | "ready" | "error";

export type ConcordOsCoreStore = {
  status: ComputedRef<StoreStatus>;
  busy: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  podUrls: ComputedRef<string[]>;
  selectedPod: ComputedRef<string>;
  paths: ComputedRef<SolidConcordPaths | null>;
  resources: ComputedRef<SolidConcordResources | null>;
  accessReport: ComputedRef<SolidConcordAccessReport | null>;
  currentBrowse: ComputedRef<SolidWorkspaceBrowseResult | null>;
  browseCache: ComputedRef<Record<string, SolidWorkspaceBrowseResult>>;
  selectedEntry: ComputedRef<SolidWorkspaceEntry | null>;
  preview: ComputedRef<SolidWorkspaceReadResult | null>;
  accessSummary: ComputedRef<SolidWorkspaceAccessSummary | null>;
  people: ComputedRef<ConcordOsPeopleRegistry>;
  identity: ComputedRef<SerializedIdentity | null>;
  identityReady: ComputedRef<boolean>;
  cacheStatus: ComputedRef<"present" | "missing" | "unknown">;
  lastGeneratedMnemonic: ComputedRef<string | null>;
  currentTargetUrl: ComputedRef<string | null>;
  currentScope: ComputedRef<SolidWorkspaceScope>;
  treeNodes: ComputedRef<TreeNode[]>;
  treeSelection: ComputedRef<string[]>;
  init(): Promise<void>;
  refreshPods(): Promise<void>;
  selectPod(url: string): Promise<void>;
  selectScope(scope: SolidWorkspaceScope): Promise<void>;
  navigateTo(url: string): Promise<void>;
  selectEntry(entry: SolidWorkspaceEntry | null): Promise<void>;
  openEntry(entry: SolidWorkspaceEntry): Promise<void>;
  activateTreeNode(url: string): Promise<void>;
  lookupEntry(url: string): Promise<SolidWorkspaceEntry | null>;
  createFolder(name: string): Promise<void>;
  createLedger(name: string): Promise<void>;
  renameSelected(nextName: string): Promise<void>;
  moveSelected(parentUrl: string): Promise<void>;
  deleteSelected(): Promise<void>;
  downloadSelected(): Promise<void>;
  applyAccess(
    url: string,
    input: {
      publicRead?: boolean;
      agents?: string[];
    },
  ): Promise<void>;
  reloadAccess(url?: string | null): Promise<void>;
  upsertPerson(input: {
    webId: string;
    label?: string | null;
    note?: string | null;
  }): Promise<void>;
  deletePerson(webId: string): Promise<void>;
  provisionIdentity(): Promise<void>;
};

const appPath = "concord";
const podStorageKey = "solid/concord-pod-root";

let singleton: ConcordOsCoreStore | null = null;

function canUseBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error || "Unknown Concord OS error.");
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

function buildTreeNodes(
  paths: SolidConcordPaths | null,
  browseCache: Record<string, SolidWorkspaceBrowseResult>,
): TreeNode[] {
  if (!paths) {
    return [];
  }

  function buildNode(url: string, label: string, scope: SolidWorkspaceScope): TreeNode {
    const browse = browseCache[url];
    const children =
      browse?.entries.flatMap((entry) => {
        if (entry.kind === "container") {
          return [buildNode(entry.url, entry.name, entry.scope)];
        }

        if (!entry.isLedger) {
          return [];
        }

        return [
          {
            id: entry.url,
            label: entry.name,
            meta: "ledger",
            badge: "ledger",
          },
        ];
      }) ?? [];

    return {
      id: url,
      label,
      meta: scope,
      badge: browse ? String(browse.entries.length) : undefined,
      children,
    };
  }

  return [
    buildNode(paths.workspacePrivateRootUrl, "Private", "private"),
    buildNode(paths.workspaceSharedRootUrl, "Shared", "shared"),
    buildNode(paths.workspacePublicRootUrl, "Public", "public"),
  ];
}

function createStore(solid: SolidSessionController): ConcordOsCoreStore {
  const status = ref<StoreStatus>("idle");
  const busy = ref(false);
  const error = ref<string | null>(null);
  const podUrls = ref<string[]>([]);
  const selectedPod = ref(loadStoredPod());
  const paths = ref<SolidConcordPaths | null>(null);
  const resources = ref<SolidConcordResources | null>(null);
  const accessReport = ref<SolidConcordAccessReport | null>(null);
  const workspace = ref<SolidWorkspace | null>(null);
  const currentBrowse = ref<SolidWorkspaceBrowseResult | null>(null);
  const browseCache = ref<Record<string, SolidWorkspaceBrowseResult>>({});
  const selectedEntry = ref<SolidWorkspaceEntry | null>(null);
  const preview = ref<SolidWorkspaceReadResult | null>(null);
  const accessSummary = ref<SolidWorkspaceAccessSummary | null>(null);
  const people = ref<ConcordOsPeopleRegistry>(createEmptyConcordOsPeopleRegistry());
  const identity = ref<SerializedIdentity | null>(null);
  const cacheStatus = ref<"present" | "missing" | "unknown">("unknown");
  const lastGeneratedMnemonic = ref<string | null>(null);
  let started = false;

  const currentTargetUrl = computed(
    () => selectedEntry.value?.url ?? currentBrowse.value?.url ?? null,
  );
  const currentScope = computed<SolidWorkspaceScope>(() => currentBrowse.value?.scope ?? "private");
  const treeNodes = computed(() => buildTreeNodes(paths.value, browseCache.value));
  const treeSelection = computed(() => (currentTargetUrl.value ? [currentTargetUrl.value] : []));

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

  async function refreshCache() {
    const session = solid.session.value;
    if (!session) {
      identity.value = null;
      cacheStatus.value = "unknown";
      return;
    }

    try {
      const cache = createSolidIdentityCache({ session });
      const cached = await cache.load();
      identity.value = cached;
      cacheStatus.value = cached ? "present" : "missing";
    } catch {
      identity.value = null;
      cacheStatus.value = "unknown";
    }
  }

  async function loadPeopleRegistry() {
    const session = solid.session.value;
    if (!session || !paths.value) {
      people.value = createEmptyConcordOsPeopleRegistry();
      return;
    }

    const storage = createConcordOsPeopleStorage(session, paths.value.peopleUrl);
    const registry = await storage.load();
    people.value = registry ?? createEmptyConcordOsPeopleRegistry();
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

  async function reloadAccess(url = currentTargetUrl.value) {
    if (!workspace.value || !url) {
      accessSummary.value = null;
      return;
    }

    accessSummary.value = await workspace.value.inspectAccess(url);
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
    preview.value = null;
    await refreshCache();
    await loadPeopleRegistry();

    accessReport.value = resources.value
      ? await validateSolidConcordAccess(resources.value).catch(() => null)
      : null;

    await reloadAccess();
    status.value = "ready";
  }

  async function initializeStore() {
    if (!solid.isAuthenticated.value || !solid.webId.value) {
      status.value = "idle";
      return;
    }

    await refreshPods();
  }

  async function refreshPods() {
    if (!solid.isAuthenticated.value || !solid.webId.value) {
      podUrls.value = [];
      selectedPod.value = "";
      return;
    }

    busy.value = true;
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
    } finally {
      busy.value = false;
    }
  }

  async function selectPod(url: string) {
    selectedPod.value = url;
    persistPod(url);
    await loadWorkspaceContext();
  }

  async function selectScope(scope: SolidWorkspaceScope) {
    if (!paths.value) {
      return;
    }

    await navigateTo(getScopeRoot(paths.value, scope));
  }

  async function navigateTo(url: string) {
    selectedEntry.value = null;
    preview.value = null;
    accessSummary.value = null;
    await refreshBrowse(url);
    await reloadAccess(currentBrowse.value?.url ?? null);
  }

  async function selectEntry(entry: SolidWorkspaceEntry | null) {
    selectedEntry.value = entry;
    preview.value = null;

    if (!workspace.value || !entry) {
      accessSummary.value = null;
      return;
    }

    accessSummary.value = await workspace.value.inspectAccess(entry.url);
    if (entry.kind === "file") {
      preview.value = await workspace.value.read(entry.url);
    }
  }

  async function openEntry(entry: SolidWorkspaceEntry) {
    if (entry.kind === "container") {
      await navigateTo(entry.url);
      return;
    }
    await selectEntry(entry);
  }

  async function activateTreeNode(url: string) {
    if (!workspace.value) {
      return;
    }

    const entry = await workspace.value.stat(url);
    if (!entry) {
      if (url.endsWith("/")) {
        await navigateTo(url);
      }
      return;
    }

    if (entry.kind === "container") {
      await navigateTo(entry.url);
      return;
    }

    if (entry.parentUrl && currentBrowse.value?.url !== entry.parentUrl) {
      await refreshBrowse(entry.parentUrl);
    }
    await selectEntry(entry);
  }

  async function lookupEntry(url: string) {
    if (!workspace.value) {
      return null;
    }

    return await workspace.value.stat(url);
  }

  async function syncWorkspaceState() {
    await refreshBrowse(currentBrowse.value?.url ?? undefined);
    await refreshTree();
    await reloadAccess();
  }

  async function createFolder(name: string) {
    if (!workspace.value || !currentBrowse.value) {
      return;
    }
    busy.value = true;
    try {
      await workspace.value.createFolder(currentBrowse.value.url, name);
      await syncWorkspaceState();
    } finally {
      busy.value = false;
    }
  }

  async function createLedger(name: string) {
    if (!workspace.value || !currentBrowse.value || !identity.value) {
      throw new Error("Create or restore an identity before creating a ledger.");
    }
    busy.value = true;
    try {
      await workspace.value.createLedger(currentBrowse.value.url, name, {
        identity: identity.value,
      });
      await syncWorkspaceState();
    } finally {
      busy.value = false;
    }
  }

  async function renameSelected(nextName: string) {
    if (!workspace.value || !selectedEntry.value) {
      return;
    }
    busy.value = true;
    try {
      const nextEntry = await workspace.value.rename(selectedEntry.value.url, nextName);
      if (nextEntry.parentUrl) {
        await refreshBrowse(nextEntry.parentUrl);
      } else {
        await syncWorkspaceState();
      }
      await refreshTree();
      await selectEntry(nextEntry);
    } finally {
      busy.value = false;
    }
  }

  async function moveSelected(parentUrl: string) {
    if (!workspace.value || !selectedEntry.value) {
      return;
    }
    busy.value = true;
    try {
      const nextEntry = await workspace.value.move(selectedEntry.value.url, parentUrl);
      await refreshTree();
      if (nextEntry.kind === "container") {
        await navigateTo(nextEntry.url);
      } else {
        await refreshBrowse(nextEntry.parentUrl ?? parentUrl);
        await selectEntry(nextEntry);
      }
    } finally {
      busy.value = false;
    }
  }

  async function deleteSelected() {
    if (!workspace.value || !selectedEntry.value) {
      return;
    }
    busy.value = true;
    try {
      await workspace.value.delete(selectedEntry.value.url);
      selectedEntry.value = null;
      preview.value = null;
      await syncWorkspaceState();
    } finally {
      busy.value = false;
    }
  }

  async function downloadSelected() {
    if (!selectedEntry.value || selectedEntry.value.kind !== "file" || !canUseBrowser()) {
      return;
    }

    const previewResult =
      preview.value && preview.value.entry.url === selectedEntry.value.url
        ? preview.value
        : workspace.value
          ? await workspace.value.read(selectedEntry.value.url)
          : null;

    if (!previewResult) {
      return;
    }

    const blob =
      previewResult.blob ??
      new Blob([previewResult.text ?? ""], {
        type: previewResult.contentType ?? "application/octet-stream",
      });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedEntry.value.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function savePeople(nextRegistry: ConcordOsPeopleRegistry) {
    const session = solid.session.value;
    if (!session || !paths.value) {
      return;
    }

    const storage = createConcordOsPeopleStorage(session, paths.value.peopleUrl);
    await storage.save(nextRegistry);
    people.value = nextRegistry;
  }

  async function applyAccess(
    url: string,
    input: {
      publicRead?: boolean;
      agents?: string[];
    },
  ) {
    if (!workspace.value) {
      return;
    }
    busy.value = true;
    try {
      accessSummary.value = await workspace.value.applyAccess(url, input);
      if (input.agents?.length) {
        const now = new Date().toISOString();
        await savePeople({
          ...people.value,
          updatedAt: now,
          people: people.value.people.map((entry) =>
            input.agents?.includes(entry.webId)
              ? {
                  ...entry,
                  updatedAt: now,
                  lastUsedAt: now,
                }
              : entry,
          ),
        });
      }
      if (resources.value) {
        accessReport.value = await validateSolidConcordAccess(resources.value).catch(
          () => accessReport.value,
        );
      }
    } finally {
      busy.value = false;
    }
  }

  async function upsertPerson(input: {
    webId: string;
    label?: string | null;
    note?: string | null;
  }) {
    const webId = input.webId.trim();
    if (!webId) {
      throw new Error("A WebID is required.");
    }

    new URL(webId);
    const now = new Date().toISOString();
    const current = people.value.people.filter((entry) => entry.webId !== webId);
    const existing = people.value.people.find((entry) => entry.webId === webId);
    await savePeople({
      ...people.value,
      updatedAt: now,
      people: [
        ...current,
        {
          webId,
          label: input.label?.trim() || null,
          note: input.note?.trim() || null,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          lastUsedAt: existing?.lastUsedAt ?? null,
        },
      ].sort((left, right) => left.webId.localeCompare(right.webId)),
    });
  }

  async function deletePerson(webId: string) {
    const now = new Date().toISOString();
    await savePeople({
      ...people.value,
      updatedAt: now,
      people: people.value.people.filter((entry) => entry.webId !== webId),
    });
  }

  async function provisionIdentity() {
    const session = sessionFetch();
    busy.value = true;
    error.value = null;
    try {
      const cache = createSolidIdentityCache({ session });
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
      lastGeneratedMnemonic.value = result.mnemonic;
      resources.value = result.resources ?? resources.value;
      accessReport.value = result.accessReport ?? accessReport.value;
      cacheStatus.value = "present";
      await loadPeopleRegistry();
      await reloadAccess();
    } catch (nextError) {
      error.value = `Failed to provision identity: ${normalizeMessage(nextError)}`;
      status.value = "error";
    } finally {
      busy.value = false;
    }
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
        preview.value = null;
        accessSummary.value = null;
        accessReport.value = null;
        people.value = createEmptyConcordOsPeopleRegistry();
        identity.value = null;
        cacheStatus.value = "unknown";
        return;
      }

      await initializeStore();
    },
  );

  return {
    status: computed(() => status.value),
    busy: computed(() => busy.value),
    error: computed(() => error.value),
    podUrls: computed(() => podUrls.value),
    selectedPod: computed(() => selectedPod.value),
    paths: computed(() => paths.value),
    resources: computed(() => resources.value),
    accessReport: computed(() => accessReport.value),
    currentBrowse: computed(() => currentBrowse.value),
    browseCache: computed(() => browseCache.value),
    selectedEntry: computed(() => selectedEntry.value),
    preview: computed(() => preview.value),
    accessSummary: computed(() => accessSummary.value),
    people: computed(() => people.value),
    identity: computed(() => identity.value),
    identityReady: computed(() => Boolean(identity.value)),
    cacheStatus: computed(() => cacheStatus.value),
    lastGeneratedMnemonic: computed(() => lastGeneratedMnemonic.value),
    currentTargetUrl,
    currentScope,
    treeNodes,
    treeSelection,
    async init() {
      if (started) {
        return;
      }
      started = true;
      await initializeStore();
    },
    refreshPods,
    selectPod,
    selectScope,
    navigateTo,
    selectEntry,
    openEntry,
    activateTreeNode,
    lookupEntry,
    createFolder,
    createLedger,
    renameSelected,
    moveSelected,
    deleteSelected,
    downloadSelected,
    applyAccess,
    reloadAccess,
    upsertPerson,
    deletePerson,
    provisionIdentity,
  };
}

export function useConcordOsCore(): ConcordOsCoreStore {
  if (!singleton) {
    singleton = createStore(useSolidSession());
  }
  return singleton;
}

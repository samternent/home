import { computed, ref } from "vue";
import { createConcordApp } from "@ternent/concord/browser";
import { appConfig } from "@/app/config/app.config";
import type {
  RunBrowseEntry,
  RunBrowseResult,
  RunLedgerContainer,
  RunCreateFolderInput,
  RunCreateLedgerInput,
  RunLedgerPersistenceSnapshot,
  RunMountDescriptor,
  RunStorageProvider,
} from "@/modules/run/storage/types";

type LocalWorkspaceNode = {
  url: string;
  parentUrl: string;
  name: string;
  kind: "container" | "ledger";
  contentType: string | null;
  lastModified: string | null;
};

const mountId = "local-browser";
const rootUrl = "local://workspace/";
const storageKey = `${appConfig.appId}/run-local-provider/v1`;
const ledgerStorageKey = `${appConfig.appId}/run-local-provider-ledgers/v1`;

let singleton: RunStorageProvider | null = null;
let fallbackState: LocalWorkspaceNode[] | null = null;
let fallbackLedgerSnapshots: Record<string, RunLedgerPersistenceSnapshot | null> | null = null;

function canUseBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultNodes(): LocalWorkspaceNode[] {
  return [
    {
      url: "local://workspace/scratch/",
      parentUrl: rootUrl,
      name: "scratch",
      kind: "container",
      contentType: null,
      lastModified: nowIso(),
    },
    {
      url: "local://workspace/local-journal.json",
      parentUrl: rootUrl,
      name: "local-journal.json",
      kind: "ledger",
      contentType: "application/json",
      lastModified: nowIso(),
    },
  ];
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown local storage provider error.");
}

function normalizeContainerUrl(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function makeRelativePath(url: string): string {
  if (url === rootUrl) {
    return "/";
  }

  const relative = url.slice(rootUrl.length);
  return `/${decodeURIComponent(relative)}`;
}

function loadNodes(): LocalWorkspaceNode[] {
  if (!canUseBrowser()) {
    if (!fallbackState) {
      fallbackState = defaultNodes();
    }
    return fallbackState.slice();
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      const seeded = defaultNodes();
      localStorage.setItem(storageKey, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultNodes();
  } catch {
    return defaultNodes();
  }
}

function persistNodes(nodes: LocalWorkspaceNode[]) {
  if (!canUseBrowser()) {
    fallbackState = nodes.slice();
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(nodes));
}

function loadLedgerSnapshots(): Record<string, RunLedgerPersistenceSnapshot | null> {
  if (!canUseBrowser()) {
    if (!fallbackLedgerSnapshots) {
      fallbackLedgerSnapshots = {};
    }
    return { ...fallbackLedgerSnapshots };
  }

  try {
    const raw = localStorage.getItem(ledgerStorageKey);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistLedgerSnapshots(
  snapshots: Record<string, RunLedgerPersistenceSnapshot | null>,
) {
  if (!canUseBrowser()) {
    fallbackLedgerSnapshots = { ...snapshots };
    return;
  }

  localStorage.setItem(ledgerStorageKey, JSON.stringify(snapshots));
}

function toBrowseEntry(node: LocalWorkspaceNode): RunBrowseEntry {
  return {
    id: node.url,
    mountId,
    providerId: "browser-local",
    url: node.url,
    path: makeRelativePath(node.url),
    name: node.name,
    kind: node.kind,
    contentType: node.contentType,
    writable: true,
    lastModified: node.lastModified,
    scope: "private",
  };
}

function rootEntry(): RunBrowseEntry {
  return {
    id: rootUrl,
    mountId,
    providerId: "browser-local",
    url: rootUrl,
    path: "/",
    name: "Local workspace",
    kind: "container",
    contentType: null,
    writable: true,
    lastModified: null,
    scope: "private",
  };
}

function sanitizeSegment(name: string): string {
  return encodeURIComponent(name.trim().replace(/\/+/g, " ").replace(/\s+/g, " "));
}

function buildUrl(parentUrl: string, name: string, kind: "container" | "ledger"): string {
  const baseName = kind === "ledger" && !name.endsWith(".json") ? `${name}.json` : name;
  const segment = sanitizeSegment(baseName);
  const nextUrl = new URL(segment, normalizeContainerUrl(parentUrl)).toString();
  return kind === "container" ? normalizeContainerUrl(nextUrl) : nextUrl;
}

function createUniqueLedgerName(name: string, nodes: LocalWorkspaceNode[]): string {
  const normalized = name.trim() || "concord-demo";
  const baseName = normalized.replace(/\.json$/i, "");
  const existing = new Set(nodes.map((node) => node.name.toLowerCase()));
  let attempt = 0;

  while (attempt < 10_000) {
    const candidate = attempt === 0 ? `${baseName}.json` : `${baseName}-${attempt + 1}.json`;
    if (!existing.has(candidate.toLowerCase())) {
      return candidate;
    }
    attempt += 1;
  }

  return `${baseName}-${Date.now()}.json`;
}

export function saveBrowserLocalImportedLedger(input: {
  name: string;
  container: RunLedgerContainer;
}): RunBrowseEntry {
  const nodes = loadNodes();
  const ledgerName = createUniqueLedgerName(input.name, nodes);
  const timestamp = nowIso();
  const url = buildUrl(rootUrl, ledgerName, "ledger");
  const nextNode: LocalWorkspaceNode = {
    url,
    parentUrl: rootUrl,
    name: ledgerName,
    kind: "ledger",
    contentType: "application/json",
    lastModified: timestamp,
  };

  nodes.push(nextNode);
  persistNodes(nodes);

  const snapshots = loadLedgerSnapshots();
  snapshots[url] = {
    container: structuredClone(input.container),
    staged: [],
  };
  persistLedgerSnapshots(snapshots);

  return toBrowseEntry(nextNode);
}

function createLocalStorageProvider(): RunStorageProvider {
  const status = ref<"idle" | "connecting" | "ready" | "error">("idle");
  const error = ref<string | null>(null);
  const mounts = computed<RunMountDescriptor[]>(() => [
    {
      id: mountId,
      providerId: "browser-local",
      label: "Local",
      rootUrl,
      writable: true,
      browsable: true,
      scope: "private",
    },
  ]);

  function findNode(url: string): LocalWorkspaceNode | null {
    return loadNodes().find((node) => node.url === url) ?? null;
  }

  function createLedgerStorageAdapter(resourceUrl: string) {
    return {
      name: `browser-local:${resourceUrl}`,
      async load() {
        const snapshots = loadLedgerSnapshots();
        return snapshots[resourceUrl] ?? null;
      },
      async save(snapshot: RunLedgerPersistenceSnapshot) {
        const snapshots = loadLedgerSnapshots();
        snapshots[resourceUrl] = structuredClone(snapshot);
        persistLedgerSnapshots(snapshots);
      },
      async clear() {
        const snapshots = loadLedgerSnapshots();
        delete snapshots[resourceUrl];
        persistLedgerSnapshots(snapshots);
      },
    };
  }

  return {
    manifest: {
      id: "browser-local",
      label: "Local",
      capabilities: [
        "mount",
        "browse",
        "stat",
        "create-folder",
        "create-ledger",
        "write",
        "ledger-storage",
      ],
    },
    status: computed(() => status.value),
    error: computed(() => error.value),
    mounts,
    async connect() {
      try {
        loadNodes();
        status.value = "ready";
        error.value = null;
      } catch (nextError) {
        status.value = "error";
        error.value = normalizeMessage(nextError);
      }
    },
    async disconnect() {
      status.value = "ready";
      error.value = null;
    },
    async listMounts() {
      return mounts.value;
    },
    async browse(_mountId: string, url: string) {
      const normalizedUrl = url === rootUrl ? rootUrl : normalizeContainerUrl(url);
      if (normalizedUrl !== rootUrl) {
        const container = findNode(normalizedUrl);
        if (!container || container.kind !== "container") {
          throw new Error(`Local path is not a container: ${url}`);
        }
      }

      const entries = loadNodes()
        .filter((node) => node.parentUrl === normalizedUrl)
        .map(toBrowseEntry)
        .sort((left, right) => left.url.localeCompare(right.url));

      return {
        mountId,
        providerId: "browser-local",
        url: normalizedUrl,
        path: makeRelativePath(normalizedUrl),
        parentUrl: normalizedUrl === rootUrl ? null : findNode(normalizedUrl)?.parentUrl ?? rootUrl,
        scope: "private",
        entries,
      } satisfies RunBrowseResult;
    },
    async stat(_mountId: string, url: string) {
      if (url === rootUrl) {
        return rootEntry();
      }

      const node = findNode(url);
      return node ? toBrowseEntry(node) : null;
    },
    async createFolder(input: RunCreateFolderInput) {
      const normalized = input.name.trim();
      if (!normalized) {
        throw new Error("Folder name is required.");
      }

      const url = buildUrl(input.parentUrl, normalized, "container");
      const existing = findNode(url);
      if (existing) {
        return toBrowseEntry(existing);
      }

      const nextNode: LocalWorkspaceNode = {
        url,
        parentUrl: normalizeContainerUrl(input.parentUrl),
        name: normalized,
        kind: "container",
        contentType: null,
        lastModified: nowIso(),
      };

      const nodes = loadNodes();
      nodes.push(nextNode);
      persistNodes(nodes);
      return toBrowseEntry(nextNode);
    },
    async createLedger(input: RunCreateLedgerInput) {
      const normalized = input.name.trim();
      if (!normalized) {
        throw new Error("Ledger name is required.");
      }

      const ledgerName = normalized.endsWith(".json") ? normalized : `${normalized}.json`;
      const url = buildUrl(input.parentUrl, ledgerName, "ledger");
      const existing = findNode(url);
      if (existing) {
        return toBrowseEntry(existing);
      }

      const nextNode: LocalWorkspaceNode = {
        url,
        parentUrl: normalizeContainerUrl(input.parentUrl),
        name: ledgerName,
        kind: "ledger",
        contentType: "application/json",
        lastModified: nowIso(),
      };

      const nodes = loadNodes();
      nodes.push(nextNode);
      persistNodes(nodes);
      const storage = createLedgerStorageAdapter(url);
      const app = await createConcordApp({
        identity: input.signer,
        storage,
        plugins: [],
      });
      try {
        await app.load();
      } finally {
        await app.destroy();
      }
      return toBrowseEntry(nextNode);
    },
    async createLedgerStorageAdapter(_mountId: string, resourceUrl: string) {
      const node = findNode(resourceUrl);
      if (!node || node.kind !== "ledger") {
        return null;
      }

      return createLedgerStorageAdapter(resourceUrl);
    },
  };
}

export function useRunLocalStorageProvider(): RunStorageProvider {
  if (!singleton) {
    singleton = createLocalStorageProvider();
  }

  return singleton;
}

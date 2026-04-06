import { computed, ref, watch } from "vue";
import type {
  RunBrowseEntry,
  RunBrowseResult,
  RunMountDescriptor,
  RunSigningIdentityRef,
  RunWorkspaceScope,
} from "@/modules/run/storage/types";
import type {
  RunMountRegistry,
  RunProviderRegistry,
  RunWorkspaceRuntime,
} from "./types";
import { useRunMountRegistry } from "./useRunMountRegistry";
import { useRunProviderRegistry } from "./useRunProviderRegistry";

let singleton: RunWorkspaceRuntime | null = null;
const workspaceSessionStorageKey = "run.workspace.session.v1";

type PersistedWorkspaceSession = {
  activeMountId: string | null;
  activeBrowseUrl: string | null;
  selectedEntryUrl: string | null;
};

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown workspace runtime error.");
}

function sortMountsBySpecificity(mounts: RunMountDescriptor[]): RunMountDescriptor[] {
  return mounts.slice().sort((left, right) => right.rootUrl.length - left.rootUrl.length);
}

function canUseBrowserStorage(): boolean {
  return typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined";
}

function loadPersistedWorkspaceSession(): PersistedWorkspaceSession | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const raw = localStorage.getItem(workspaceSessionStorageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceSession> | null;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      activeMountId:
        typeof parsed.activeMountId === "string" ? parsed.activeMountId : null,
      activeBrowseUrl:
        typeof parsed.activeBrowseUrl === "string" ? parsed.activeBrowseUrl : null,
      selectedEntryUrl:
        typeof parsed.selectedEntryUrl === "string" ? parsed.selectedEntryUrl : null,
    };
  } catch {
    return null;
  }
}

function persistWorkspaceSession(input: PersistedWorkspaceSession) {
  if (!canUseBrowserStorage()) {
    return;
  }

  localStorage.setItem(workspaceSessionStorageKey, JSON.stringify(input));
}

export function createRunWorkspaceRuntime(
  providerRegistry: RunProviderRegistry = useRunProviderRegistry(),
  mountRegistry: RunMountRegistry = useRunMountRegistry(),
): RunWorkspaceRuntime {
  const status = ref<"idle" | "loading" | "ready" | "error">("idle");
  const error = ref<string | null>(null);
  const activeProviderId = ref<string | null>(null);
  const activeMountId = ref<string | null>(null);
  const activeBrowseUrl = ref<string | null>(null);
  const browseCacheState = ref<Record<string, RunBrowseResult>>({});
  const selectedEntryState = ref<RunBrowseEntry | null>(null);
  const initialPersistedSession = loadPersistedWorkspaceSession();
  let started = false;

  function persistCurrentSession() {
    persistWorkspaceSession({
      activeMountId: activeMountId.value,
      activeBrowseUrl: activeBrowseUrl.value,
      selectedEntryUrl: selectedEntryState.value?.url ?? null,
    });
  }

  function clearActiveBrowse() {
    activeProviderId.value = null;
    activeMountId.value = null;
    activeBrowseUrl.value = null;
    selectedEntryState.value = null;
    if (started) {
      persistCurrentSession();
    }
  }

  function getActiveMount() {
    return mountRegistry.getMount(activeMountId.value);
  }

  function getActiveProvider() {
    return mountRegistry.getMountProvider(activeMountId.value);
  }

  function updateBrowseCache(nextBrowse: RunBrowseResult) {
    browseCacheState.value = {
      ...browseCacheState.value,
      [nextBrowse.url]: nextBrowse,
    };
  }

  function findMountForUrl(url: string): RunMountDescriptor | null {
    for (const mount of sortMountsBySpecificity(mountRegistry.browsableMounts.value)) {
      if (url.startsWith(mount.rootUrl)) {
        return mount;
      }
    }

    return null;
  }

  async function browseMount(
    mount: RunMountDescriptor,
    url: string,
  ): Promise<RunBrowseResult> {
    const provider = providerRegistry.getProvider(mount.providerId);
    if (!provider?.browse) {
      throw new Error(`Provider ${mount.providerId} cannot browse mounts.`);
    }

    const nextBrowse = await provider.browse(mount.id, url);
    activeProviderId.value = mount.providerId;
    activeMountId.value = mount.id;
    activeBrowseUrl.value = nextBrowse.url;
    updateBrowseCache(nextBrowse);
    persistCurrentSession();
    return nextBrowse;
  }

  async function refreshCurrentBrowse() {
    const mount = getActiveMount();
    if (!mount || !activeBrowseUrl.value) {
      return null;
    }

    return await browseMount(mount, activeBrowseUrl.value);
  }

  async function selectMount(mountId: string) {
    const mount = mountRegistry.getMount(mountId);
    if (!mount) {
      return;
    }

    selectedEntryState.value = null;
    await browseMount(mount, mount.rootUrl);
  }

  async function selectScope(scope: RunWorkspaceScope) {
    const mount =
      mountRegistry.mounts.value.find((item) => item.scope === scope) ??
      mountRegistry.mounts.value.find((item) => item.id === scope);

    if (!mount) {
      return;
    }

    await selectMount(mount.id);
  }

  async function navigateTo(url: string) {
    const mount = findMountForUrl(url) ?? getActiveMount();
    if (!mount) {
      return;
    }

    selectedEntryState.value = null;
    await browseMount(mount, url);
  }

  async function selectEntry(entry: RunBrowseEntry | null) {
    selectedEntryState.value = entry;
    persistCurrentSession();
  }

  async function openEntry(entry: RunBrowseEntry) {
    if (entry.kind === "container") {
      await navigateTo(entry.url);
      return;
    }

    await selectEntry(entry);
  }

  async function lookupEntry(url: string) {
    for (const browse of Object.values(browseCacheState.value)) {
      const cached = browse.entries.find((entry) => entry.url === url);
      if (cached) {
        return cached;
      }
    }

    const mount = findMountForUrl(url);
    const provider = mount ? providerRegistry.getProvider(mount.providerId) : null;
    if (!mount || !provider?.stat) {
      return null;
    }

    return await provider.stat(mount.id, url);
  }

  async function createFolder(name: string) {
    const normalized = name.trim();
    const browse = currentBrowse.value;
    const mount = getActiveMount();
    const provider = getActiveProvider();

    if (!normalized || !browse || !mount || !provider?.createFolder) {
      return null;
    }

    const entry = await provider.createFolder({
      mountId: mount.id,
      parentUrl: browse.url,
      name: normalized,
    });
    await refreshCurrentBrowse();
    return entry;
  }

  async function createLedger(name: string, signer: RunSigningIdentityRef) {
    const normalized = name.trim();
    const browse = currentBrowse.value;
    const mount = getActiveMount();
    const provider = getActiveProvider();

    if (!normalized || !browse || !mount || !provider?.createLedger) {
      return null;
    }

    const entry = await provider.createLedger({
      mountId: mount.id,
      parentUrl: browse.url,
      name: normalized,
      signer,
    });
    await refreshCurrentBrowse();
    return entry;
  }

  async function reset() {
    selectedEntryState.value = null;
    activeProviderId.value = null;
    activeMountId.value = null;
    activeBrowseUrl.value = null;
    browseCacheState.value = {};
    persistCurrentSession();

    await mountRegistry.refresh();

    const firstMount = mountRegistry.browsableMounts.value[0] ?? null;
    if (!firstMount) {
      return;
    }

    await browseMount(firstMount, firstMount.rootUrl);
  }

  watch(
    () =>
      mountRegistry.mounts.value
        .map((mount) => `${mount.providerId}:${mount.id}:${mount.rootUrl}:${mount.scope ?? ""}`)
        .join("|"),
    () => {
      const activeMount = getActiveMount();
      if (!activeMount) {
        clearActiveBrowse();
      }

      if (started && !activeMountId.value && mountRegistry.browsableMounts.value[0]) {
        void browseMount(
          mountRegistry.browsableMounts.value[0],
          mountRegistry.browsableMounts.value[0].rootUrl,
        ).catch((nextError) => {
          error.value = normalizeMessage(nextError);
          status.value = "error";
        });
      }
    },
    { immediate: true },
  );

  const currentBrowse = computed(() =>
    activeBrowseUrl.value ? browseCacheState.value[activeBrowseUrl.value] ?? null : null,
  );

  return {
    status: computed(() => status.value),
    error: computed(() => error.value),
    providers: computed(() => providerRegistry.providers.value),
    mounts: computed(() => mountRegistry.mounts.value),
    currentBrowse,
    browseCache: computed(() => browseCacheState.value),
    selectedEntry: computed(() => selectedEntryState.value),
    selection: computed(() => {
      const selected = selectedEntryState.value;
      const browse = currentBrowse.value;
      const activeMount = getActiveMount();

      return {
        activeProviderId: activeProviderId.value,
        activeMountId: activeMountId.value,
        activeBrowseUrl: activeBrowseUrl.value,
        activeResourceId: selected?.url ?? null,
        activeLedgerIds: selected?.kind === "ledger" ? [selected.url] : [],
        activeScope: selected?.scope ?? browse?.scope ?? activeMount?.scope ?? null,
      };
    }),
    availableCapabilities: computed(
      () => getActiveProvider()?.manifest.capabilities ?? [],
    ),
    hasBrowsableMounts: computed(() => mountRegistry.browsableMounts.value.length > 0),
    async init() {
      if (started) {
        return;
      }

      started = true;
      status.value = "loading";
      error.value = null;

      try {
        await providerRegistry.connectAll();
        await mountRegistry.refresh();

        const persistedSession = initialPersistedSession ?? loadPersistedWorkspaceSession();
        const restoredMount =
          (persistedSession?.activeMountId
            ? mountRegistry.getMount(persistedSession.activeMountId)
            : null) ?? null;
        const firstMount = mountRegistry.browsableMounts.value[0] ?? null;
        const initialMount = restoredMount ?? firstMount;

        if (initialMount) {
          const initialUrl =
            persistedSession?.activeBrowseUrl?.startsWith(initialMount.rootUrl)
              ? persistedSession.activeBrowseUrl
              : initialMount.rootUrl;

          const initialBrowse = await browseMount(initialMount, initialUrl);

          if (persistedSession?.selectedEntryUrl) {
            const restoredEntry =
              initialBrowse.entries.find(
                (entry) => entry.url === persistedSession.selectedEntryUrl,
              ) ??
              (await lookupEntry(persistedSession.selectedEntryUrl)) ??
              currentBrowse.value?.entries.find(
                (entry) => entry.url === persistedSession.selectedEntryUrl,
              ) ??
              null;

            if (restoredEntry) {
              await selectEntry(restoredEntry);
            }
          }
        }

        status.value = "ready";
      } catch (nextError) {
        error.value = normalizeMessage(nextError);
        status.value = "error";
      }
    },
    selectMount,
    selectScope,
    navigateTo,
    selectEntry,
    openEntry,
    lookupEntry,
    createFolder,
    createLedger,
    reset,
  };
}

export function useRunWorkspaceRuntime(): RunWorkspaceRuntime {
  if (!singleton) {
    singleton = createRunWorkspaceRuntime();
  }

  return singleton;
}

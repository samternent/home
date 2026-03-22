import { computed, ref } from "vue";
import type { PixpaxCollectionCatalog } from "@ternent/pixpax-core";
import {
  fetchPublicCollectionBundle,
  fetchPublicCollectionCatalog,
  type PixpaxPublicCollectionBundle,
  type PixpaxPublicCollectionSummary,
} from "@/modules/api/client";
import { usePixbookSession } from "@/modules/pixbook/usePixbookSession";
import { appConfig } from "@/app/config/app.config";

const catalogState = ref<PixpaxPublicCollectionSummary[]>([]);
const loadingCatalogState = ref(false);
const bundleState = ref<Record<string, PixpaxPublicCollectionBundle>>({});
const catalogCacheKey = `${appConfig.appId}/collections/catalog`;

function createBundleKey(collectionId: string, version: string) {
  return `${collectionId}::${version || "latest"}`;
}

function createBundleCacheKey(collectionId: string, version: string) {
  return `${appConfig.appId}/collections/bundle/${createBundleKey(collectionId, version)}`;
}

function readCachedJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function writeCachedJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function toReplayCatalog(bundle: PixpaxPublicCollectionBundle): PixpaxCollectionCatalog {
  return {
    collectionId: bundle.collectionId,
    collectionVersion: bundle.resolvedVersion,
    cards: bundle.cards.map((card) => ({
      cardId: card.cardId,
      seriesId: card.seriesId ?? null,
      role: card.role ?? null,
      renderPayload: card.renderPayload ?? null,
    })),
  };
}

export function usePixpaxCollections() {
  const pixbook = usePixbookSession();

  const collections = computed(() => catalogState.value);
  const primaryCollection = computed(() => catalogState.value[0] || null);

  const refreshCatalog = async () => {
    loadingCatalogState.value = true;
    try {
      catalogState.value = await fetchPublicCollectionCatalog();
      writeCachedJson(catalogCacheKey, catalogState.value);
      return catalogState.value;
    } finally {
      loadingCatalogState.value = false;
    }
  };

  const loadCatalog = async () => {
    try {
      return await refreshCatalog();
    } catch (error) {
      const cached = readCachedJson<PixpaxPublicCollectionSummary[]>(catalogCacheKey);
      if (cached?.length) {
        catalogState.value = cached;
        return cached;
      }
      throw error;
    }
  };

  const refreshBundle = async (collectionId: string, version = "") => {
    const key = createBundleKey(collectionId, version);
    const bundle = await fetchPublicCollectionBundle(collectionId, version);
    bundleState.value = {
      ...bundleState.value,
      [key]: bundle,
      [createBundleKey(collectionId, bundle.resolvedVersion)]: bundle,
    };
    writeCachedJson(createBundleCacheKey(collectionId, version), bundle);
    writeCachedJson(createBundleCacheKey(collectionId, bundle.resolvedVersion), bundle);
    await pixbook.registerCatalogs([toReplayCatalog(bundle)]);
    return bundle;
  };

  const loadBundle = async (collectionId: string, version = "") => {
    const key = createBundleKey(collectionId, version);
    if (bundleState.value[key]) {
      return bundleState.value[key];
    }

    const cached = readCachedJson<PixpaxPublicCollectionBundle>(
      createBundleCacheKey(collectionId, version),
    );
    if (cached) {
      bundleState.value = {
        ...bundleState.value,
        [key]: cached,
        [createBundleKey(collectionId, cached.resolvedVersion)]: cached,
      };
      await pixbook.registerCatalogs([toReplayCatalog(cached)]);
      void refreshBundle(collectionId, version).catch(() => undefined);
      return cached;
    }

    return refreshBundle(collectionId, version);
  };

  const loadPrimaryBundle = async () => {
    const currentPrimary = primaryCollection.value;
    if (currentPrimary) {
      return await loadBundle(currentPrimary.collectionId, currentPrimary.resolvedVersion);
    }

    const catalog = await loadCatalog();
    const nextPrimary = catalog[0] || null;
    if (!nextPrimary) {
      return null;
    }
    return await loadBundle(nextPrimary.collectionId, nextPrimary.resolvedVersion);
  };

  return {
    collections,
    primaryCollection,
    loadingCatalog: computed(() => loadingCatalogState.value),
    bundlesByKey: computed(() => bundleState.value),
    loadCatalog,
    loadBundle,
    loadPrimaryBundle,
  };
}

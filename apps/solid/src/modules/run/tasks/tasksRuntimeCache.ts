import type { ConcordApp, ConcordState } from "@ternent/concord";

export type CachedRunTasksRuntime = {
  app: ConcordApp;
  snapshot: Readonly<ConcordState>;
  cachedAt: number;
};

const MAX_CACHED_RUNTIMES = 6;
const runtimeCache = new Map<string, CachedRunTasksRuntime>();

function trimCache(exceptKey: string | null = null) {
  const entries = [...runtimeCache.entries()]
    .filter(([key]) => key !== exceptKey)
    .sort((left, right) => left[1].cachedAt - right[1].cachedAt);

  while (runtimeCache.size > MAX_CACHED_RUNTIMES && entries.length > 0) {
    const [cacheKey, entry] = entries.shift() as [string, CachedRunTasksRuntime];
    runtimeCache.delete(cacheKey);
    void entry.app.destroy().catch(() => undefined);
  }
}

export function readCachedRunTasksRuntime(
  cacheKey: string,
): CachedRunTasksRuntime | null {
  const cached = runtimeCache.get(cacheKey) ?? null;
  if (!cached) {
    return null;
  }

  cached.cachedAt = Date.now();
  return cached;
}

export function writeCachedRunTasksRuntime(
  cacheKey: string,
  value: CachedRunTasksRuntime,
) {
  runtimeCache.set(cacheKey, {
    ...value,
    cachedAt: Date.now(),
  });
  trimCache(cacheKey);
}

export async function destroyCachedRunTasksRuntime(cacheKey: string) {
  const cached = runtimeCache.get(cacheKey);
  if (!cached) {
    return;
  }

  runtimeCache.delete(cacheKey);
  await cached.app.destroy().catch(() => undefined);
}

export async function clearCachedRunTasksRuntimes() {
  const cachedEntries = [...runtimeCache.values()];
  runtimeCache.clear();

  await Promise.all(
    cachedEntries.map((entry) => entry.app.destroy().catch(() => undefined)),
  );
}

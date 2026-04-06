import { createConcordApp } from "@ternent/concord/browser";
import { computed, ref, watch, type ComputedRef } from "vue";
import type { ConcordState } from "@ternent/concord";
import { useRunProjectionState } from "@/modules/run/replay";
import type {
  RunLedgerCommitRecord,
  RunLedgerContainer,
  RunLedgerEntryRecord,
} from "@/modules/run/storage/types";
import { useRunTasksRuntime } from "@/modules/run/tasks/useRunTasksRuntime";
import { useRunProviderRegistry } from "@/modules/run/workspace";

type LedgerVerificationResult = NonNullable<ConcordState["verification"]>;

export type RunLedgerAuditStatus = "idle" | "loading" | "ready" | "error";

export type RunLedgerAuditCommitRow = RunLedgerCommitRecord & {
  invalid: boolean;
  onHeadChain: boolean;
  isHead: boolean;
};

export type RunLedgerAuditEntryRow = RunLedgerEntryRecord & {
  invalid: boolean;
  commitIds: string[];
  onHeadChain: boolean;
};

export type RunLedgerAuditSurface = {
  status: ComputedRef<RunLedgerAuditStatus>;
  error: ComputedRef<string | null>;
  container: ComputedRef<RunLedgerContainer | null>;
  verification: ComputedRef<LedgerVerificationResult | null>;
  commits: ComputedRef<RunLedgerAuditCommitRow[]>;
  entries: ComputedRef<RunLedgerAuditEntryRow[]>;
  available: ComputedRef<boolean>;
  lastVerifiedAt: ComputedRef<string | null>;
  refresh(): Promise<boolean>;
};

let singleton: RunLedgerAuditSurface | null = null;

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown ledger audit error.");
}

function createHeadCommitOrder(container: RunLedgerContainer): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  let currentId: string | null = container.head;

  while (currentId && !seen.has(currentId) && container.commits[currentId]) {
    ordered.push(currentId);
    seen.add(currentId);
    currentId = container.commits[currentId]?.parentCommitId ?? null;
  }

  return ordered;
}

function sortIsoDescending(left: string, right: string): number {
  return right.localeCompare(left);
}

function createCommitRows(
  container: RunLedgerContainer | null,
  verification: LedgerVerificationResult | null,
): RunLedgerAuditCommitRow[] {
  if (!container) {
    return [];
  }

  const headChain = createHeadCommitOrder(container);
  const chainSet = new Set(headChain);
  const orphanCommitIds = Object.keys(container.commits)
    .filter((commitId) => !chainSet.has(commitId))
    .sort((left, right) =>
      sortIsoDescending(
        container.commits[left]?.committedAt ?? "",
        container.commits[right]?.committedAt ?? "",
      ),
    );

  const invalidCommitIds = new Set(verification?.invalidCommitIds ?? []);

  return [...headChain, ...orphanCommitIds]
    .map((commitId) => container.commits[commitId])
    .filter((commit): commit is RunLedgerCommitRecord => Boolean(commit))
    .map((commit) => ({
      ...commit,
      invalid: invalidCommitIds.has(commit.commitId),
      onHeadChain: chainSet.has(commit.commitId),
      isHead: commit.commitId === container.head,
    }));
}

function createEntryRows(
  container: RunLedgerContainer | null,
  verification: LedgerVerificationResult | null,
): RunLedgerAuditEntryRow[] {
  if (!container) {
    return [];
  }

  const headChain = createHeadCommitOrder(container);
  const chainSet = new Set(headChain);
  const entryCommitIds = new Map<string, string[]>();

  for (const commit of Object.values(container.commits)) {
    for (const entryId of commit.entryIds) {
      const current = entryCommitIds.get(entryId) ?? [];
      current.push(commit.commitId);
      entryCommitIds.set(entryId, current);
    }
  }

  const invalidEntryIds = new Set(verification?.invalidEntryIds ?? []);

  return Object.values(container.entries)
    .map((entry) => ({
      ...entry,
      invalid: invalidEntryIds.has(entry.entryId),
      commitIds: entryCommitIds.get(entry.entryId) ?? [],
      onHeadChain: (entryCommitIds.get(entry.entryId) ?? []).some((commitId) => chainSet.has(commitId)),
    }))
    .sort((left, right) => sortIsoDescending(left.authoredAt, right.authoredAt));
}

async function verifyContainer(
  container: RunLedgerContainer,
): Promise<LedgerVerificationResult> {
  const app = await createConcordApp({
    plugins: [],
  });

  try {
    await app.importLedger(container);
    return await app.verify();
  } finally {
    await app.destroy().catch(() => undefined);
  }
}

function createRunLedgerAuditSurface(): RunLedgerAuditSurface {
  const projection = useRunProjectionState();
  const tasks = useRunTasksRuntime();
  const providerRegistry = useRunProviderRegistry();
  const statusState = ref<RunLedgerAuditStatus>("idle");
  const errorState = ref<string | null>(null);
  const containerState = ref<RunLedgerContainer | null>(null);
  const verificationState = ref<LedgerVerificationResult | null>(null);
  const lastVerifiedAtState = ref<string | null>(null);
  let refreshToken = 0;

  async function refresh(): Promise<boolean> {
    const token = ++refreshToken;
    const openContext = projection.activeProjection.value.openContext;
    const activeApp = tasks.app.value;

    if (!openContext && !activeApp) {
      containerState.value = null;
      verificationState.value = null;
      errorState.value = null;
      statusState.value = "idle";
      lastVerifiedAtState.value = null;
      return false;
    }

    statusState.value = "loading";
    errorState.value = null;

    try {
      let container: RunLedgerContainer | null = null;
      let verification: LedgerVerificationResult | null = null;

      if (activeApp) {
        container = (await activeApp.exportLedger()) as RunLedgerContainer;
        verification = await verifyContainer(container);
      } else if (openContext?.capabilities.ledgerStorage) {
        const provider = providerRegistry.getProvider(openContext.providerId);
        if (!provider?.createLedgerStorageAdapter) {
          throw new Error("Active provider cannot load ledger storage for audit.");
        }

        const storage = await provider.createLedgerStorageAdapter(
          openContext.mountId,
          openContext.resourceUrl,
        );

        if (!storage) {
          throw new Error("Active ledger storage adapter is unavailable.");
        }

        const snapshot = await storage.load();
        if (!snapshot?.container) {
          throw new Error("Active ledger has no committed snapshot.");
        }

        container = snapshot.container;
        verification = await verifyContainer(container);
      }

      if (token !== refreshToken) {
        return false;
      }

      containerState.value = container;
      verificationState.value = verification;
      lastVerifiedAtState.value = new Date().toISOString();
      statusState.value = "ready";
      return true;
    } catch (error) {
      if (token !== refreshToken) {
        return false;
      }

      containerState.value = null;
      verificationState.value = null;
      lastVerifiedAtState.value = null;
      errorState.value = normalizeMessage(error);
      statusState.value = "error";
      return false;
    }
  }

  watch(
    () => [
      projection.activeProjection.value.ledgerId ?? "",
      projection.activeProjection.value.openContext?.resourceUrl ?? "",
      tasks.state.value,
    ] as const,
    () => {
      void refresh();
    },
    { immediate: true },
  );

  return {
    status: computed(() => statusState.value),
    error: computed(() => errorState.value),
    container: computed(() => containerState.value),
    verification: computed(() => verificationState.value),
    commits: computed(() => createCommitRows(containerState.value, verificationState.value)),
    entries: computed(() => createEntryRows(containerState.value, verificationState.value)),
    available: computed(() => Boolean(projection.activeProjection.value.ledgerId || tasks.app.value)),
    lastVerifiedAt: computed(() => lastVerifiedAtState.value),
    refresh,
  };
}

export function useRunLedgerAuditSurface(): RunLedgerAuditSurface {
  if (!singleton) {
    singleton = createRunLedgerAuditSurface();
  }

  return singleton;
}

import { createConcordApp } from "@ternent/concord/browser";
import { computed, ref, type ComputedRef, watch } from "vue";
import type {
  RunCoreProjectionState,
  RunProjectionCandidate,
  RunProjectionOpenContext,
  RunProjectionReadiness,
  RunProjectionResolution,
  RunProjectionTaskSupport,
  RunVerificationStatus,
} from "@/modules/run/core";
import { useRunIdentityService } from "@/modules/run/identity";
import { useRunStorageCatalog } from "@/modules/run/storage";
import { supportsTaskProjection } from "@/modules/run/tasks/compatibility";
import { useRunProviderRegistry, useRunWorkspaceState } from "@/modules/run/workspace";

export type RunProjectionState = {
  activeProjection: ComputedRef<RunCoreProjectionState>;
};

let singleton: RunProjectionState | null = null;

function createProjectionReadiness(
  input: Partial<RunProjectionReadiness> = {},
): RunProjectionReadiness {
  return {
    inspectable: input.inspectable ?? false,
    verified: input.verified ?? false,
    interactive: input.interactive ?? false,
  };
}

function createIdleProjectionState(): RunCoreProjectionState {
  return {
    id: null,
    ledgerId: null,
    status: "idle",
    candidate: null,
    resolution: null,
    readiness: createProjectionReadiness(),
    taskSupport: {
      supported: false,
      reason: "Open a ledger to view Tasks.",
      classification: "unsupported",
    },
    inputs: null,
    openContext: null,
    provenance: {
      source: "none",
      includedCommitIds: [],
      excludedCommitIds: [],
    },
    verification: {
      status: "unknown",
      summary: "No active projection.",
      details: [],
    },
    replay: {
      ready: false,
      commitCount: 0,
      headCommitId: null,
    },
  };
}

function createCandidateProjectionState(
  candidate: RunProjectionCandidate,
  input: Pick<
    RunCoreProjectionState,
    | "status"
    | "verification"
    | "resolution"
    | "openContext"
    | "replay"
    | "readiness"
    | "taskSupport"
  >,
): RunCoreProjectionState {
  return {
    id: `projection:${candidate.ledgerId}`,
    ledgerId: candidate.ledgerId,
    status: input.status,
    candidate,
    resolution: input.resolution,
    readiness: input.readiness,
    taskSupport: input.taskSupport,
    inputs: {
      ledgerIds: [candidate.ledgerId],
      resourceIds: [candidate.resourceUrl],
      trustPolicy: {
        mode: "strict",
        allowUnverified: false,
      },
    },
    openContext: input.openContext,
    provenance: {
      source: "workspace-selection",
      includedCommitIds: [],
      excludedCommitIds: [],
    },
    verification: input.verification,
    replay: input.replay,
  };
}

function createBlockedOpenContext(
  candidate: RunProjectionCandidate,
  ledgerStorage: boolean,
): RunProjectionOpenContext {
  return {
    kind: "storage-ledger",
    providerId: candidate.providerId,
    mountId: candidate.mountId,
    ledgerId: candidate.ledgerId,
    resourceUrl: candidate.resourceUrl,
    capabilities: {
      ledgerStorage,
      hostableApp: false,
      interactive: false,
    },
  };
}

function createProjectionTaskSupport(
  supported: boolean,
  reason: string | null,
  classification: RunProjectionTaskSupport["classification"] = "unsupported",
): RunProjectionTaskSupport {
  return {
    supported,
    reason,
    classification,
  };
}

function mapVerificationStatus(valid: boolean): RunVerificationStatus {
  return valid ? "verified" : "invalid";
}

function applyInteractiveReadiness(
  projection: RunCoreProjectionState,
  hasIdentity: boolean,
  canWrite: boolean,
): RunCoreProjectionState {
  const interactive = projection.readiness.inspectable && hasIdentity && canWrite;
  const openContext = projection.openContext
    ? {
        ...projection.openContext,
        capabilities: {
          ...projection.openContext.capabilities,
          interactive,
        },
      }
    : null;

  return {
    ...projection,
    readiness: {
      ...projection.readiness,
      interactive,
    },
    openContext,
  };
}

export function createRunProjectionState(): RunProjectionState {
  const identity = useRunIdentityService();
  const providerRegistry = useRunProviderRegistry();
  const storage = useRunStorageCatalog();
  const workspaceState = useRunWorkspaceState();
  const activeProjectionState = ref<RunCoreProjectionState>(createIdleProjectionState());
  let resolutionToken = 0;

  async function resolveProjection() {
    const token = ++resolutionToken;
    const activeLedgerId = workspaceState.selection.value.activeLedgerIds[0] ?? null;
    const ledger =
      (activeLedgerId
        ? storage.ledgers.value.find((item) => item.id === activeLedgerId)
        : null) ?? null;

    if (!activeLedgerId || !ledger) {
      activeProjectionState.value = createIdleProjectionState();
      return;
    }

    const candidate: RunProjectionCandidate = {
      providerId: ledger.providerId,
      mountId: ledger.mountId,
      ledgerId: activeLedgerId,
      resourceUrl: ledger.url,
    };

    activeProjectionState.value = createCandidateProjectionState(candidate, {
      status: "resolving",
      resolution: null,
      openContext: null,
      verification: {
        status: "unknown",
        summary: "Resolving replay and verification context.",
        details: [],
      },
      readiness: createProjectionReadiness(),
      taskSupport: createProjectionTaskSupport(
        false,
        "Tasks is still resolving for the selected ledger.",
      ),
      replay: {
        ready: false,
        commitCount: 0,
        headCommitId: null,
      },
    });

    const provider = providerRegistry.getProvider(candidate.providerId);
    if (!provider?.createLedgerStorageAdapter) {
      if (token !== resolutionToken) {
        return;
      }

      activeProjectionState.value = createCandidateProjectionState(candidate, {
        status: "blocked",
        resolution: {
          candidate,
          resolvedAt: new Date().toISOString(),
          replayReady: false,
          issues: ["Selected provider cannot supply a replayable ledger storage adapter."],
        },
        openContext: createBlockedOpenContext(candidate, false),
        verification: {
          status: "unknown",
          summary: "Selected ledger cannot be replayed through this provider yet.",
          details: ["Missing ledger-storage provider capability."],
        },
        readiness: createProjectionReadiness(),
        taskSupport: createProjectionTaskSupport(
          false,
          "Tasks requires a replayable ledger storage capability.",
        ),
        replay: {
          ready: false,
          commitCount: 0,
          headCommitId: null,
        },
      });
      return;
    }

    try {
      const storageAdapter = await provider.createLedgerStorageAdapter(
        candidate.mountId,
        candidate.resourceUrl,
      );

      if (!storageAdapter) {
        throw new Error("Provider did not return a ledger storage adapter.");
      }

      const snapshot = await storageAdapter.load();
      if (!snapshot?.container) {
        throw new Error("Selected ledger has no committed snapshot to replay.");
      }

      const app = await createConcordApp({
        plugins: [],
      });

      try {
        await app.importLedger(snapshot.container);
        const verification = await app.verify();

        if (token !== resolutionToken) {
          return;
        }

        const valid = verification.committedHistoryValid;
        const details = [
          ...verification.invalidCommitIds.map((commitId) => `invalid commit ${commitId}`),
          ...verification.invalidEntryIds.map((entryId) => `invalid entry ${entryId}`),
        ];
        const resolution: RunProjectionResolution = {
          candidate,
          resolvedAt: new Date().toISOString(),
          replayReady: valid,
          issues: details,
        };
        const taskSupport = valid
          ? supportsTaskProjection(snapshot.container)
          : {
              supported: false,
              reason: "Tasks requires a verified replay result.",
              classification: "unsupported" as const,
            };

        activeProjectionState.value = createCandidateProjectionState(candidate, {
          status: valid ? "ready" : "error",
          resolution,
          openContext: {
            kind: "storage-ledger",
            providerId: candidate.providerId,
            mountId: candidate.mountId,
            ledgerId: candidate.ledgerId,
            resourceUrl: candidate.resourceUrl,
            capabilities: {
              ledgerStorage: true,
              hostableApp: valid,
              interactive: false,
            },
          },
          verification: {
            status: mapVerificationStatus(valid),
            summary: valid
              ? "Selected ledger verified and replay context is ready."
              : "Selected ledger failed committed-history verification.",
            details,
          },
          readiness: createProjectionReadiness({
            inspectable: valid,
            verified: valid,
            interactive: false,
          }),
          taskSupport: createProjectionTaskSupport(
            taskSupport.supported,
            taskSupport.reason,
            taskSupport.classification,
          ),
          replay: {
            ready: valid,
            commitCount: Object.keys(snapshot.container.commits ?? {}).length,
            headCommitId: snapshot.container.head ?? null,
          },
        });
      } finally {
        await app.destroy();
      }
    } catch (error) {
      if (token !== resolutionToken) {
        return;
      }

      activeProjectionState.value = createCandidateProjectionState(candidate, {
        status: "error",
        resolution: {
          candidate,
          resolvedAt: new Date().toISOString(),
          replayReady: false,
          issues: [error instanceof Error ? error.message : String(error)],
        },
        openContext: createBlockedOpenContext(candidate, true),
        verification: {
          status: "unknown",
          summary: "Projection could not be resolved from verified replay.",
          details: [error instanceof Error ? error.message : String(error)],
        },
        readiness: createProjectionReadiness(),
        taskSupport: createProjectionTaskSupport(
          false,
          "Tasks requires a verified replay result.",
        ),
        replay: {
          ready: false,
          commitCount: 0,
          headCommitId: null,
        },
      });
    }
  }

  watch(
    () => [
      workspaceState.selection.value.activeResourceId,
      workspaceState.selection.value.activeLedgerIds.join("|"),
      providerRegistry.providers.value.map((record) => `${record.id}:${record.status}`).join("|"),
    ] as const,
    () => {
      void resolveProjection();
    },
    { immediate: true },
  );

  return {
    activeProjection: computed(() => {
      const projection = activeProjectionState.value;
      const providerId = projection.openContext?.providerId ?? null;
      const provider = providerId ? providerRegistry.getProvider(providerId) : null;

      return applyInteractiveReadiness(
        projection,
        Boolean(identity.activeIdentity.value),
        Boolean(provider?.manifest.capabilities.includes("write")),
      );
    }),
  };
}

export function useRunProjectionState(): RunProjectionState {
  if (!singleton) {
    singleton = createRunProjectionState();
  }

  return singleton;
}

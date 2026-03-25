import { computed, type ComputedRef } from "vue";
import type { RunCoreProjectionState } from "@/modules/run/core";
import { useRunStorageCatalog } from "@/modules/run/storage";
import { useRunWorkspaceState } from "@/modules/run/workspace";

export type RunProjectionState = {
  activeProjection: ComputedRef<RunCoreProjectionState>;
};

let singleton: RunProjectionState | null = null;

function createProjectionState(): RunProjectionState {
  const storage = useRunStorageCatalog();
  const workspaceState = useRunWorkspaceState();

  return {
    activeProjection: computed<RunCoreProjectionState>(() => {
      const activeLedgerIds = workspaceState.selection.value.activeLedgerIds;
      const activeLedgerId = activeLedgerIds[0] ?? null;
      const ledger =
        (activeLedgerId
          ? storage.ledgers.value.find((item) => item.id === activeLedgerId)
          : null) ?? null;

      if (ledger && activeLedgerId) {
        return {
          id: `projection:${activeLedgerId}`,
          ledgerId: activeLedgerId,
          status: "selected",
          inputs: {
            ledgerIds: activeLedgerIds,
            resourceIds: [workspaceState.selection.value.activeResourceId ?? activeLedgerId],
            trustPolicy: {
              mode: "strict",
              allowUnverified: false,
            },
          },
          openContext: {
            kind: "solid-ledger",
            ledgerId: activeLedgerId,
            resourceUrl: ledger.url,
          },
          provenance: {
            source: "workspace-selection",
            includedCommitIds: [],
            excludedCommitIds: [],
          },
          verification: {
            status: ledger.verificationStatus,
            summary:
              ledger.verificationStatus === "verified"
                ? "Selected ledger is verified."
                : "Selected ledger verification is unresolved.",
          },
        };
      }

      return {
        id: null,
        ledgerId: null,
        status: "idle",
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
        },
      };
    }),
  };
}

export function useRunProjectionState(): RunProjectionState {
  if (!singleton) {
    singleton = createProjectionState();
  }

  return singleton;
}

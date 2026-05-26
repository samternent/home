import type { LedgerContainer, LedgerStorageAdapter } from "@ternent/ledger";
import type {
  RuntimeStorageCapabilities,
  RuntimeStorageProvider,
  WorkspaceStorageRef,
} from "@/app/runtime/contracts";
import { createLedgerSnapshot } from "./helpers";

const LOCAL_CAPABILITIES: RuntimeStorageCapabilities = {
  supportsLoad: true,
  supportsSave: true,
  supportsPull: false,
  supportsPush: false,
  supportsCompareAndSwap: false,
  supportsWatch: false,
};

export type LocalProviderOptions = {
  storage: LedgerStorageAdapter;
};

export function createLocalRuntimeStorageProvider(
  options: LocalProviderOptions,
): RuntimeStorageProvider {
  return {
    id: "local",
    label: "Local Storage",
    capabilities: LOCAL_CAPABILITIES,
    async load(ref: WorkspaceStorageRef) {
      const snapshot = await options.storage.load();
      const container = snapshot?.container;
      if (!container) {
        throw new Error("No local ledger snapshot is available.");
      }

      return createLedgerSnapshot({
        workspaceId: ref.workspaceId,
        container,
      });
    },
    async save(ref: WorkspaceStorageRef, snapshot) {
      const current = await options.storage.load();
      await options.storage.save({
        container: snapshot.container,
        staged: current?.staged ?? [],
      });
    },
  };
}

export function createDefaultLocalStorageRef(input?: {
  workspaceId?: string;
  pointer?: string;
}): WorkspaceStorageRef {
  return {
    providerId: "local",
    workspaceId: input?.workspaceId ?? "local-workspace",
    pointer: input?.pointer ?? "local://concord",
  };
}

export function cloneContainer(container: LedgerContainer): LedgerContainer {
  return structuredClone(container);
}

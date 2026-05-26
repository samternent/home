import type { PermissionsState } from "./permissions";

export type RuntimeReplayPhase = "system" | "workspace";

export type RuntimeReplayContext = {
  beginReplayPipeline(): void;
  endReplayPipeline(): void;
  clearDecryptedPayloadCache(): void;
  setPhase(phase: RuntimeReplayPhase): void;
  isSystemPhase(): boolean;
  isWorkspacePhase(): boolean;
  rememberDecryptedPayload(entryId: string, payload: unknown): void;
  readDecryptedPayload(entryId: string): unknown | undefined;
  setPermissionsState(state: PermissionsState): void;
  getPermissionsState(): PermissionsState | null;
  getPermissionPrivateKeys(): string[];
};

export function createRuntimeReplayContext(): RuntimeReplayContext {
  let phase: RuntimeReplayPhase = "workspace";
  let permissionsState: PermissionsState | null = null;
  const decryptedPayloadByEntryId = new Map<string, unknown>();

  return {
    beginReplayPipeline() {
      phase = "system";
      decryptedPayloadByEntryId.clear();
    },
    endReplayPipeline() {
      phase = "workspace";
    },
    clearDecryptedPayloadCache() {
      decryptedPayloadByEntryId.clear();
    },
    setPhase(nextPhase) {
      phase = nextPhase;
    },
    isSystemPhase() {
      return phase === "system";
    },
    isWorkspacePhase() {
      return phase === "workspace";
    },
    rememberDecryptedPayload(entryId, payload) {
      decryptedPayloadByEntryId.set(entryId, payload);
    },
    readDecryptedPayload(entryId) {
      return decryptedPayloadByEntryId.get(entryId);
    },
    setPermissionsState(state) {
      permissionsState = state;
    },
    getPermissionsState() {
      return permissionsState;
    },
    getPermissionPrivateKeys() {
      if (!permissionsState) {
        return [];
      }
      return Object.values(permissionsState.localGroupPrivateKeysByPermissionId).filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      );
    },
  };
}

export type AppReplayPhase = RuntimeReplayPhase;
export type AppReplayContext = RuntimeReplayContext;
export const createAppReplayContext = createRuntimeReplayContext;

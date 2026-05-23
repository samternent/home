import type { PermissionsState } from "./permissions";

export type AppReplayPhase = "system" | "full";

export type AppReplayContext = {
  setPhase(phase: AppReplayPhase): void;
  isSystemPhase(): boolean;
  rememberDecryptedPayload(entryId: string, payload: unknown): void;
  readDecryptedPayload(entryId: string): unknown | undefined;
  setPermissionsState(state: PermissionsState): void;
  getPermissionPrivateKeys(): string[];
};

export function createAppReplayContext(): AppReplayContext {
  let phase: AppReplayPhase = "full";
  let permissionsState: PermissionsState | null = null;
  const decryptedPayloadByEntryId = new Map<string, unknown>();

  return {
    setPhase(nextPhase) {
      phase = nextPhase;
    },
    isSystemPhase() {
      return phase === "system";
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

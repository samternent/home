import { ref } from "vue";
import { parseIdentity, validateIdentity } from "@ternent/identity";
import { useIdentitySession, type StoredIdentity } from "./useIdentitySession";

type ImportPayload = {
  serializedIdentity?: unknown;
  id?: string;
  displayName?: unknown;
  fingerprint?: string;
  managedUserId?: unknown;
};

function parsePayload(raw: string): ImportPayload {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Identity import payload is empty");
  }

  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as ImportPayload;
  }

  throw new Error("Unsupported identity payload format. Use a ternent-identity JSON payload.");
}

export function useIdentityImport() {
  const { setIdentity } = useIdentitySession();

  const isImporting = ref(false);
  const error = ref<string | null>(null);

  const importIdentity = async (rawPayload: string): Promise<StoredIdentity> => {
    isImporting.value = true;
    error.value = null;

    try {
      const payload = parsePayload(rawPayload);
      const serializedIdentity = await validateIdentity(
        parseIdentity(payload.serializedIdentity || payload),
      );

      const identity: StoredIdentity = {
        id: payload.id || `identity-${serializedIdentity.keyId.slice(0, 12)}`,
        ...(typeof payload.displayName === "string" && payload.displayName.trim()
          ? { displayName: payload.displayName.trim() }
          : {}),
        fingerprint: payload.fingerprint || serializedIdentity.keyId,
        serializedIdentity,
        ...(typeof payload.managedUserId === "string" || payload.managedUserId === null
          ? { managedUserId: payload.managedUserId ? String(payload.managedUserId).trim() : null }
          : {}),
      };

      setIdentity(identity);
      return identity;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to import identity";
      error.value = message;
      throw new Error(message);
    } finally {
      isImporting.value = false;
    }
  };

  return {
    isImporting,
    error,
    importIdentity,
  };
}

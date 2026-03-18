import { ref } from "vue";
import { parseIdentity, validateIdentity, type SerializedIdentity } from "@ternent/identity";
import { useIdentitySession, type StoredIdentity } from "./useIdentitySession";

type ImportPayload = {
  id?: string;
  fingerprint?: string;
  serializedIdentity?: SerializedIdentity;
  identity?: SerializedIdentity;
};

function parsePayload(raw: string): ImportPayload {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Identity import payload is empty");
  }

  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as ImportPayload;
  }

  throw new Error("Unsupported identity payload format. Use serialized identity JSON.");
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
      const serializedIdentity = parseIdentity(
        payload.serializedIdentity ?? payload.identity ?? payload,
      );
      await validateIdentity(serializedIdentity);
      const fingerprint = payload.fingerprint || serializedIdentity.keyId;

      const identity: StoredIdentity = {
        id: payload.id || `identity-${fingerprint.slice(0, 12)}`,
        fingerprint,
        serializedIdentity,
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

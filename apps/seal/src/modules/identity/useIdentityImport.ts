import { ref } from "vue";
import { parseIdentity, validateIdentity } from "@ternent/identity";
import { useIdentitySession, type StoredIdentity } from "./useIdentitySession";

export function useIdentityImport() {
  const { setIdentity } = useIdentitySession();

  const isImporting = ref(false);
  const error = ref<string | null>(null);

  const importIdentity = async (rawPayload: string): Promise<StoredIdentity> => {
    isImporting.value = true;
    error.value = null;

    try {
      const trimmed = rawPayload.trim();
      if (!trimmed) {
        throw new Error("Identity import payload is empty");
      }
      if (
        trimmed.includes("BEGIN PRIVATE KEY") ||
        trimmed.includes("\"privateKeyPem\"") ||
        trimmed.includes("\"publicKeyPem\"")
      ) {
        throw new Error(
          "Legacy PEM identities are not supported in Seal v2. Import a ternent-identity v2 JSON export."
        );
      }

      const parsed = await validateIdentity(parseIdentity(trimmed));
      const identity: StoredIdentity = {
        id: `identity-${parsed.keyId.slice(0, 12)}`,
        ...parsed,
      };

      setIdentity(identity);
      return identity;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Failed to import identity";
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

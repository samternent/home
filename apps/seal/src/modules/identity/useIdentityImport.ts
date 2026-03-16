import { ref } from "vue";
import {
  deriveKeyIdFromPublicKeyPem,
  importPrivateKeyFromPem,
  importPublicKeyFromPem,
  derivePublicFromPrivatePEM,
} from "ternent-identity";
import { useIdentitySession, type StoredIdentity } from "./useIdentitySession";

type ImportPayload = {
  privateKeyPem: string;
  publicKeyPem?: string;
  id?: string;
  createdAt?: string;
  keyId?: string;
  fingerprint?: string;
};

function parsePayload(raw: string): ImportPayload {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Identity import payload is empty");
  }

  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as ImportPayload;
    if (!parsed.privateKeyPem) {
      throw new Error("Missing privateKeyPem in identity payload");
    }
    return parsed;
  }

  if (trimmed.includes("BEGIN PRIVATE KEY")) {
    return { privateKeyPem: trimmed };
  }

  throw new Error("Unsupported identity payload format. Use JSON or PEM private key text.");
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

      await importPrivateKeyFromPem(payload.privateKeyPem);

      const publicKeyPem = payload.publicKeyPem
        ? payload.publicKeyPem
        : await derivePublicFromPrivatePEM(payload.privateKeyPem);

      await importPublicKeyFromPem(publicKeyPem);

      const keyId =
        payload.keyId ??
        payload.fingerprint ??
        (await deriveKeyIdFromPublicKeyPem(publicKeyPem));

      const identity: StoredIdentity = {
        id: payload.id || `identity-${keyId.slice(0, 12)}`,
        createdAt: payload.createdAt || new Date().toISOString(),
        publicKeyPem,
        privateKeyPem: payload.privateKeyPem,
        keyId,
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

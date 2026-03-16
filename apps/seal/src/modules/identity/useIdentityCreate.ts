import { ref } from "vue";
import {
  createIdentity,
  deriveKeyIdFromPublicKeyPem,
  exportPrivateKeyAsPem,
  exportPublicKeyAsPem,
} from "ternent-identity";
import { useIdentitySession, type StoredIdentity } from "./useIdentitySession";

export function useIdentityCreate() {
  const { setIdentity } = useIdentitySession();

  const isCreating = ref(false);
  const error = ref<string | null>(null);

  const create = async (): Promise<StoredIdentity> => {
    isCreating.value = true;
    error.value = null;

    try {
      const keyPair = await createIdentity();
      const [publicKeyPem, privateKeyPem] = await Promise.all([
        exportPublicKeyAsPem(keyPair.publicKey),
        exportPrivateKeyAsPem(keyPair.privateKey),
      ]);

      const keyId = await deriveKeyIdFromPublicKeyPem(publicKeyPem);
      const identity: StoredIdentity = {
        id: `identity-${keyId.slice(0, 12)}`,
        createdAt: new Date().toISOString(),
        publicKeyPem,
        privateKeyPem,
        keyId,
      };

      setIdentity(identity);
      return identity;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to create identity";
      error.value = message;
      throw new Error(message);
    } finally {
      isCreating.value = false;
    }
  };

  return {
    isCreating,
    error,
    create,
  };
}

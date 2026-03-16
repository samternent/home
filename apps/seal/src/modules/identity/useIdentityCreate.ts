import { ref } from "vue";
import {
  createIdentity,
  createIdentityFromMnemonic,
  generateMnemonic,
  type MnemonicWordCount,
} from "@ternent/identity";
import { useIdentitySession, type StoredIdentity } from "./useIdentitySession";

export function useIdentityCreate() {
  const { setIdentity } = useIdentitySession();

  const isCreating = ref(false);
  const error = ref<string | null>(null);

  const create = async (): Promise<StoredIdentity> => {
    isCreating.value = true;
    error.value = null;

    try {
      const nextIdentity = await createIdentity();
      const storedIdentity: StoredIdentity = {
        id: `identity-${nextIdentity.keyId.slice(0, 12)}`,
        ...nextIdentity,
      };

      setIdentity(storedIdentity);
      return storedIdentity;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Failed to create identity";
      error.value = message;
      throw new Error(message);
    } finally {
      isCreating.value = false;
    }
  };

  const generateMnemonicPhrase = (words: MnemonicWordCount = 12): string => {
    error.value = null;
    return generateMnemonic({ words });
  };

  const createFromMnemonic = async (input: {
    mnemonic: string;
    passphrase?: string;
  }): Promise<StoredIdentity> => {
    isCreating.value = true;
    error.value = null;

    try {
      const nextIdentity = await createIdentityFromMnemonic(input);
      const storedIdentity: StoredIdentity = {
        id: `identity-${nextIdentity.keyId.slice(0, 12)}`,
        ...nextIdentity,
      };

      setIdentity(storedIdentity);
      return storedIdentity;
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Failed to create identity from mnemonic";
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
    generateMnemonicPhrase,
    createFromMnemonic,
  };
}

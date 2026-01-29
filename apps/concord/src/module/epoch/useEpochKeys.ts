import { computed } from "vue";
import { useLocalStorage } from "@vueuse/core";

export type EpochKeyRecord = {
  encryptionKeyId: string;
  privateKey: string;
  createdAt: string;
  label?: string;
};

type EpochKeyStore = Record<string, EpochKeyRecord>;

const STORAGE_KEY = "concords/epochs/privateKeys";

export function useEpochKeys() {
  const keys = useLocalStorage<EpochKeyStore>(STORAGE_KEY, {});

  function storeKey(record: EpochKeyRecord) {
    keys.value = { ...keys.value, [record.encryptionKeyId]: record };
  }

  function getKey(encryptionKeyId: string | null | undefined): string | null {
    if (!encryptionKeyId) return null;
    return keys.value[encryptionKeyId]?.privateKey ?? null;
  }

  function getRecord(
    encryptionKeyId: string | null | undefined
  ): EpochKeyRecord | null {
    if (!encryptionKeyId) return null;
    return keys.value[encryptionKeyId] ?? null;
  }

  const list = computed(() => Object.values(keys.value));

  return {
    keys,
    list,
    storeKey,
    getKey,
    getRecord,
  };
}

import { computed } from "vue";
import { useRunLocalStorageProvider } from "@/modules/run/storage/providers/local/useRunLocalStorageProvider";
import { useRunSolidStorageProvider } from "@/modules/run/storage/providers/solid/useRunSolidStorageProvider";
import type { RunStorageProvider } from "@/modules/run/storage/types";
import type { RunProviderRegistry } from "./types";

let singleton: RunProviderRegistry | null = null;

export function createRunProviderRegistry(
  providers: RunStorageProvider[] = [
    useRunLocalStorageProvider(),
    useRunSolidStorageProvider(),
  ],
): RunProviderRegistry {
  const providerList = providers.slice();

  const records = computed(() =>
    providerList.map((provider) => ({
      id: provider.manifest.id,
      label: provider.manifest.label,
      capabilities: provider.manifest.capabilities,
      status: provider.status.value,
      error: provider.error.value,
      provider,
    })),
  );

  function getProvider(providerId: string | null | undefined): RunStorageProvider | null {
    if (!providerId) {
      return null;
    }

    return records.value.find((record) => record.id === providerId)?.provider ?? null;
  }

  return {
    providers: records,
    getProvider,
    async connectProvider(providerId: string) {
      await getProvider(providerId)?.connect();
    },
    async disconnectProvider(providerId: string) {
      await getProvider(providerId)?.disconnect();
    },
    async connectAll() {
      for (const provider of providerList) {
        await provider.connect();
      }
    },
  };
}

export function useRunProviderRegistry(): RunProviderRegistry {
  if (!singleton) {
    singleton = createRunProviderRegistry();
  }

  return singleton;
}

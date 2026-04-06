import { computed, ref, watch } from "vue";
import type { RunMountDescriptor } from "@/modules/run/storage/types";
import type { RunMountRegistry, RunProviderRegistry } from "./types";
import { useRunProviderRegistry } from "./useRunProviderRegistry";

let singleton: RunMountRegistry | null = null;

function createMountKey(mount: RunMountDescriptor): string {
  return [
    mount.providerId,
    mount.id,
    mount.rootUrl,
    mount.scope ?? "",
    mount.browsable ? "browse" : "no-browse",
  ].join(":");
}

export function createRunMountRegistry(
  providerRegistry: RunProviderRegistry = useRunProviderRegistry(),
): RunMountRegistry {
  const mountsState = ref<RunMountDescriptor[]>([]);

  async function refresh() {
    const nextMounts: RunMountDescriptor[] = [];

    for (const record of providerRegistry.providers.value) {
      const providerMounts = await record.provider.listMounts().catch(() => []);
      nextMounts.push(...providerMounts);
    }

    mountsState.value = nextMounts;
  }

  watch(
    () =>
      providerRegistry.providers.value
        .map(
          (record) =>
            `${record.id}:${record.status}:${record.error ?? ""}:${record.provider.mounts.value
              .map(createMountKey)
              .join(",")}`,
        )
        .join("|"),
    () => {
      void refresh();
    },
    { immediate: true },
  );

  const mounts = computed(() => mountsState.value);
  const browsableMounts = computed(() =>
    mounts.value.filter((mount) => mount.browsable),
  );

  function getMount(mountId: string | null | undefined): RunMountDescriptor | null {
    if (!mountId) {
      return null;
    }

    return mounts.value.find((mount) => mount.id === mountId) ?? null;
  }

  return {
    mounts,
    browsableMounts,
    getMount,
    getMountProvider(mountId) {
      const mount = getMount(mountId);
      return mount ? providerRegistry.getProvider(mount.providerId) : null;
    },
    refresh,
  };
}

export function useRunMountRegistry(): RunMountRegistry {
  if (!singleton) {
    singleton = createRunMountRegistry();
  }

  return singleton;
}

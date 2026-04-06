import { computed } from "vue";
import { useRunCoreRuntime } from "@/modules/run/core";
import { useAppShellIdentityModel } from "@/modules/ui/useAppShellIdentityModel";

let singleton: ReturnType<typeof createAppShellProvidersModel> | null = null;

function createAppShellProvidersModel() {
  const runtime = useRunCoreRuntime();
  const identity = useAppShellIdentityModel();

  const providerInput = computed({
    get: () => runtime.auth.issuer.value ?? "",
    set: (next: string) => runtime.auth.setIssuer(next),
  });

  const providerCards = computed(() =>
    runtime.workspace.providers.value.map((provider) => ({
      ...provider,
      mounts: runtime.workspace.mounts.value.filter((mount) => mount.providerId === provider.id),
      active: runtime.workspace.selection.value.activeProviderId === provider.id,
    })),
  );

  async function handleSyncIdentity(providerId: string) {
    identity.identityError.value = null;
    identity.identityMessage.value = null;

    try {
      await runtime.identity.syncActiveIdentityToProvider(providerId);
      identity.identityMessage.value = `Synced active identity to ${providerId}.`;
    } catch (error) {
      identity.identityError.value = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    runtime,
    providerInput,
    providerCards,
    activeIdentity: identity.activeIdentity,
    matchingBootstrapCandidate: identity.matchingBootstrapCandidate,
    handleSyncIdentity,
  };
}

export function useAppShellProvidersModel() {
  if (!singleton) {
    singleton = createAppShellProvidersModel();
  }

  return singleton;
}

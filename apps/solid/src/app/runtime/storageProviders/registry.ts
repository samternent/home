import type {
  RuntimeStorageCapabilities,
  RuntimeStorageProvider,
  RuntimeStorageProviderId,
  WorkspaceStorageRef,
} from "@/app/runtime/contracts";

export class RuntimeStorageUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeStorageUnsupportedError";
  }
}

export type RuntimeStorageProviderRegistry = {
  register(provider: RuntimeStorageProvider): void;
  get(providerId: string): RuntimeStorageProvider | null;
  require(providerId: string): RuntimeStorageProvider;
  has(providerId: string): boolean;
  list(): RuntimeStorageProvider[];
  getCapabilities(providerId: string): RuntimeStorageCapabilities | null;
  ensureSupports(ref: WorkspaceStorageRef, capability: keyof RuntimeStorageCapabilities): void;
};

export function createRuntimeStorageProviderRegistry(input?: {
  providers?: RuntimeStorageProvider[];
}): RuntimeStorageProviderRegistry {
  const providers = new Map<string, RuntimeStorageProvider>();

  for (const provider of input?.providers ?? []) {
    providers.set(provider.id, provider);
  }

  function require(providerId: string): RuntimeStorageProvider {
    const provider = providers.get(providerId);
    if (!provider) {
      throw new RuntimeStorageUnsupportedError(
        `Storage provider '${providerId}' is not registered.`,
      );
    }
    return provider;
  }

  return {
    register(provider) {
      providers.set(provider.id, provider);
    },
    get(providerId) {
      return providers.get(providerId) ?? null;
    },
    require,
    has(providerId) {
      return providers.has(providerId);
    },
    list() {
      return [...providers.values()];
    },
    getCapabilities(providerId) {
      return providers.get(providerId)?.capabilities ?? null;
    },
    ensureSupports(ref, capability) {
      const provider = require(ref.providerId);
      if (!provider.capabilities[capability]) {
        throw new RuntimeStorageUnsupportedError(
          `Storage provider '${provider.id}' does not support '${capability}'.`,
        );
      }
    },
  };
}

export function isLocalProviderId(providerId: string): providerId is RuntimeStorageProviderId {
  return providerId === "local";
}

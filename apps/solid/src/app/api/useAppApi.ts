import type { LedgerStorageAdapter } from "@ternent/ledger";
import type { SerializedIdentity } from "@ternent/identity";
import type { ConcordState } from "@ternent/concord";
import { readonly, ref, shallowRef } from "vue";
import {
  createIdentityService,
  createApp as createRuntimeApp,
  createConcordLocalStorageAdapter,
  type EncryptedIdentityBlobV2,
  type IdentityOnboardingDraft,
  type IdentityBootstrapMode,
  type IdentityService,
  type AppProjectionPlugin,
  type AppRuntime,
  type LocalStorageLike,
  type StoredIdentitySummary,
} from "@/app/runtime";
import {
  createPermissionsPlugin,
  createUsersPlugin,
  type PermissionCreateInput,
  type PermissionGrantInput,
  type PermissionRecord,
  type PermissionRevokeInput,
  type UserCreateInput,
  type UserEncryptionGroupInput,
  type UserRecord,
  type UserUpdateProfileInput,
} from "@/app/plugins";
import type { AppApi, AppIdentity, AppStatus } from "./types";

export type CreateAppApiOptions = {
  identity?: SerializedIdentity;
  encryptedIdentity?: EncryptedIdentityBlobV2 | string;
  identityBootstrapMode?: IdentityBootstrapMode;
  identityStorage?: LocalStorageLike;
  identityStorageKey?: string;
  devSessionUnlockBypass?: boolean;
  rpName?: string;
  concordStorage?: LocalStorageLike;
  concordStorageKey?: string;
  storage?: LedgerStorageAdapter;
  plugins?: AppProjectionPlugin[];
};

let singleton: AppApi | null = null;
let singletonOptionsForTests: CreateAppApiOptions | null = null;

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createDefaultPlugins(): AppProjectionPlugin[] {
  return [createUsersPlugin(), createPermissionsPlugin()];
}

function createInitialState(plugins: AppProjectionPlugin[]): ConcordState {
  return {
    ready: false,
    integrityValid: false,
    stagedCount: 0,
    replay: Object.fromEntries(
      plugins.map((plugin) => [plugin.plugin.id, plugin.plugin.initialState?.()]),
    ),
    verification: null,
  };
}

function requireSelector(
  plugins: AppProjectionPlugin[],
  pluginId: string,
  selectorId: string,
) {
  const plugin = plugins.find((candidate) => candidate.plugin.id === pluginId);
  if (!plugin) {
    throw new Error(`Unknown plugin id '${pluginId}'.`);
  }

  const selector = plugin.selectors?.[selectorId];
  if (!selector) {
    throw new Error(`Unknown selector '${selectorId}' for plugin '${pluginId}'.`);
  }

  return selector;
}

function buildPermissionActor(activeIdentity: AppIdentity | null) {
  if (!activeIdentity) {
    throw new Error("Active identity is required.");
  }

  return {
    memberId: activeIdentity.identityId,
    memberLabel: activeIdentity.label,
  };
}

/**
 * Creates the Concord-hosted app API used by v2 routes.
 */
export function createAppApi(options?: CreateAppApiOptions): AppApi {
  const plugins = options?.plugins ?? createDefaultPlugins();
  const status = ref<AppStatus>("restoring");
  const state = shallowRef<Readonly<ConcordState>>(createInitialState(plugins));
  const lastError = ref<string | null>(null);
  const activeIdentity = ref<AppIdentity | null>(null);

  let runtime: AppRuntime | null = null;
  let identityService: IdentityService | null = null;
  let bootstrapPromise: Promise<void> | null = null;
  let runtimeSubscription: (() => void) | null = null;

  function ensureIdentityService(): IdentityService {
    if (identityService) {
      return identityService;
    }

    identityService = createIdentityService({
      identity: options?.identity,
      encryptedIdentity: options?.encryptedIdentity,
      identityBootstrapMode: options?.identityBootstrapMode,
      storage: options?.identityStorage,
      storageKey: options?.identityStorageKey,
      devSessionUnlockBypass:
        options?.devSessionUnlockBypass ?? import.meta.env.DEV,
      rpName: options?.rpName,
    });

    return identityService;
  }

  async function teardownRuntime(): Promise<void> {
    if (runtimeSubscription) {
      runtimeSubscription();
      runtimeSubscription = null;
    }

    if (runtime) {
      await runtime.destroy();
      runtime = null;
    }

    bootstrapPromise = null;
    state.value = createInitialState(plugins);
    status.value = "restoring";
    lastError.value = null;
    activeIdentity.value = null;
  }

  async function bootstrap(mode?: IdentityBootstrapMode) {
    if (runtime) {
      return;
    }

    try {
      const resolvedIdentity = await ensureIdentityService().ensureUnlocked(mode);

      activeIdentity.value = {
        identityId: resolvedIdentity.identityId,
        label: resolvedIdentity.label,
      };

      const storage =
        options?.storage ??
        createConcordLocalStorageAdapter({
          storage: options?.concordStorage,
          storageKey: options?.concordStorageKey,
        });

      runtime = await createRuntimeApp({
        identity: resolvedIdentity.identity,
        storage,
        plugins,
      });

      runtimeSubscription = runtime.subscribe((nextState) => {
        state.value = nextState;
      });

      await runtime.load();
      state.value = runtime.getState();
      status.value = "ready";
      lastError.value = null;
    } catch (error) {
      status.value = "error";
      lastError.value = toErrorMessage(error);
      throw error;
    }
  }

  async function ensureRuntime(): Promise<AppRuntime> {
    if (!bootstrapPromise) {
      bootstrapPromise = bootstrap();
    }

    await bootstrapPromise;

    if (!runtime) {
      throw new Error("App runtime is unavailable.");
    }

    return runtime;
  }

  async function executeMutation<T>(task: () => Promise<T>): Promise<T> {
    try {
      const result = await task();
      lastError.value = null;
      return result;
    } catch (error) {
      lastError.value = toErrorMessage(error);
      throw error;
    }
  }

  const api: AppApi = {
    status: readonly(status),
    state: readonly(state),
    lastError: readonly(lastError),
    identity: {
      status: readonly(status),
      activeIdentity: readonly(activeIdentity),
      getActiveIdentity() {
        return activeIdentity.value;
      },
      async ensureActiveIdentity() {
        await ensureRuntime();
        const current = activeIdentity.value;
        if (!current) {
          throw new Error("Active identity is unavailable.");
        }
        return current;
      },
      async ensureUnlocked(mode) {
        if (activeIdentity.value && status.value === "ready") {
          return activeIdentity.value;
        }
        await bootstrap(mode);
        const current = activeIdentity.value;
        if (!current) {
          throw new Error("Active identity is unavailable.");
        }
        return current;
      },
      async lock() {
        await ensureIdentityService().lock();
        await teardownRuntime();
      },
      async createOnboardingDraft(input?: {
        words?: 12 | 24;
        totpIssuer?: string;
        totpAccountName?: string;
      }): Promise<IdentityOnboardingDraft> {
        return await ensureIdentityService().createOnboardingDraft(input);
      },
      async completeOnboarding(input: {
        draft: IdentityOnboardingDraft;
        password: string;
        confirmPassword: string;
        mnemonicConfirmed: boolean;
        mfaEnabled: boolean;
        totpCode?: string;
      }): Promise<AppIdentity> {
        await ensureIdentityService().completeOnboarding(input);
        await teardownRuntime();
        await bootstrap("auto");
        const current = activeIdentity.value;
        if (!current) {
          throw new Error("Active identity is unavailable after onboarding.");
        }
        return current;
      },
      async recoverFromMnemonic(input: {
        mnemonic: string;
        password: string;
        confirmPassword: string;
        mfaEnabled: boolean;
        totpSecretBase32?: string;
        totpCode?: string;
        totpIssuer?: string;
        totpAccountName?: string;
        createdAt?: string;
      }): Promise<AppIdentity> {
        await ensureIdentityService().recoverFromMnemonic(input);
        await teardownRuntime();
        await bootstrap("auto");
        const current = activeIdentity.value;
        if (!current) {
          throw new Error("Active identity is unavailable after recovery.");
        }
        return current;
      },
      async unlockWithPassword(input: {
        password: string;
        totpCode?: string;
      }): Promise<AppIdentity> {
        await ensureIdentityService().unlockWithPassword(input);
        await teardownRuntime();
        await bootstrap("unlock-only");
        const current = activeIdentity.value;
        if (!current) {
          throw new Error("Active identity is unavailable after unlock.");
        }
        return current;
      },
      getStoredIdentitySummary(): StoredIdentitySummary | null {
        return ensureIdentityService().getStoredIdentitySummary();
      },
    },
    users: {
      create(input: UserCreateInput) {
        return api.command("user.create", input);
      },
      updateProfile(input: UserUpdateProfileInput) {
        return api.command("user.updateProfile", input);
      },
      addToEncryptionGroup(input: UserEncryptionGroupInput) {
        return api.command("user.group.add", input);
      },
      removeFromEncryptionGroup(input: UserEncryptionGroupInput) {
        return api.command("user.group.remove", input);
      },
      all() {
        return api.select<UserRecord[]>("users", "all");
      },
      byId(identityId: string) {
        return api.select<UserRecord | null>("users", "byId", identityId);
      },
    },
    permissions: {
      create(input: Omit<PermissionCreateInput, "actor">) {
        const actor = buildPermissionActor(activeIdentity.value);
        return api.command("permission.create", {
          ...input,
          actor,
        } satisfies PermissionCreateInput);
      },
      grant(input: Omit<PermissionGrantInput, "actor">) {
        const actor = buildPermissionActor(activeIdentity.value);
        return api.command("permission.grant", {
          ...input,
          actor,
        } satisfies PermissionGrantInput);
      },
      revoke(input: Omit<PermissionRevokeInput, "actor">) {
        const actor = buildPermissionActor(activeIdentity.value);
        return api.command("permission.revoke", {
          ...input,
          actor,
        } satisfies PermissionRevokeInput);
      },
      all() {
        return api.select<PermissionRecord[]>("permissions", "all");
      },
      byId(permissionId: string) {
        return api.select<PermissionRecord | null>("permissions", "byId", permissionId);
      },
    },
    load() {
      return ensureRuntime().then(() => undefined);
    },
    command(type, input) {
      return executeMutation(async () => {
        const resolvedRuntime = await ensureRuntime();
        return await resolvedRuntime.command(type, input);
      });
    },
    commit(input) {
      return executeMutation(async () => {
        const resolvedRuntime = await ensureRuntime();
        return await resolvedRuntime.commit(input);
      });
    },
    discard() {
      return executeMutation(async () => {
        const resolvedRuntime = await ensureRuntime();
        await resolvedRuntime.discard();
      });
    },
    replay(optionsValue) {
      return executeMutation(async () => {
        const resolvedRuntime = await ensureRuntime();
        await resolvedRuntime.replay(optionsValue);
      });
    },
    getState() {
      return state.value;
    },
    getPluginState<TState = unknown>(pluginId: string): TState {
      return (state.value.replay[pluginId] as TState) ?? ({} as TState);
    },
    select<TValue = unknown>(pluginId: string, selectorId: string, ...args: unknown[]) {
      const selector = requireSelector(plugins, pluginId, selectorId);
      const pluginState = state.value.replay[pluginId] as unknown;
      return selector(pluginState, ...args) as TValue;
    },
    subscribe(listener) {
      const resolved = (nextState: Readonly<ConcordState>) => listener(nextState);
      let closed = false;
      let unsubscribeRuntime: (() => void) | null = null;

      void ensureRuntime()
        .then((resolvedRuntime) => {
          if (closed) {
            return;
          }
          unsubscribeRuntime = resolvedRuntime.subscribe(resolved);
        })
        .catch(() => undefined);

      return () => {
        closed = true;
        if (unsubscribeRuntime) {
          unsubscribeRuntime();
          unsubscribeRuntime = null;
        }
      };
    },
    async destroy() {
      await teardownRuntime();
    },
  };

  return api;
}

/**
 * Returns the singleton v2 app API.
 */
export function useAppApi(): AppApi {
  if (!singleton) {
    singleton = createAppApi(singletonOptionsForTests ?? undefined);
  }

  return singleton;
}

/**
 * Test helper that clears the shared singleton between test cases.
 */
export async function resetAppApiSingletonForTests(): Promise<void> {
  if (singleton) {
    await singleton.destroy();
    singleton = null;
  }
  singletonOptionsForTests = null;
}

/**
 * Test helper to inject bootstrap options into the shared singleton factory.
 */
export function configureAppApiSingletonForTests(
  options: CreateAppApiOptions | null,
): void {
  singletonOptionsForTests = options;
}

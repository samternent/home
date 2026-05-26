import type { ConcordState } from "@ternent/concord";
import { readonly, ref, shallowRef } from "vue";
import { createRuntimePrivacyService, type AppProjectionPlugin } from "@/app/runtime";
import {
  createPermissionsPlugin,
  createProfilesPlugin,
  createRuntimeReplayContext,
  createTasksPlugin,
  createUsersPlugin,
  type RuntimeReplayContext,
} from "@/app/plugins";
import type { AppApi, AppIdentity, AppLedgerContainer, AppStatus } from "./types";
import type { CreateAppApiOptions } from "./options";
import { createUsersApi } from "./sections/users";
import { createProfilesApi } from "./sections/profiles";
import { createPermissionsApi } from "./sections/permissions";
import { createTasksApi } from "./sections/tasks";
import { createIdentityApi } from "./sections/identity";
import {
  buildPermissionActor,
  createInitialState,
  ensureCreatorUserBootstrap,
  requireActiveIdentity,
  requireProjectedUser,
  requireSelector,
  toAppIdentity,
  toErrorMessage,
} from "./core/helpers";
import { createRuntimeLifecycle } from "./core/runtimeLifecycle";

export type { CreateAppApiOptions } from "./options";

let singleton: AppApi | null = null;
let singletonOptionsForTests: CreateAppApiOptions | null = null;

function createDefaultPlugins(replayContext: RuntimeReplayContext): AppProjectionPlugin[] {
  const privacyService = createRuntimePrivacyService();
  return [
    createUsersPlugin(),
    createProfilesPlugin(),
    createPermissionsPlugin({ replayContext }),
    createTasksPlugin({ replayContext, privacyService }),
  ];
}

/**
 * Creates the Concord-hosted app API used by v2 routes.
 */
export function createAppApi(options?: CreateAppApiOptions): AppApi {
  const replayContext = createRuntimeReplayContext();
  const plugins = options?.plugins ?? createDefaultPlugins(replayContext);
  const status = ref<AppStatus>("restoring");
  const state = shallowRef<Readonly<ConcordState>>(createInitialState(plugins));
  const lastError = ref<string | null>(null);
  const activeIdentity = ref<AppIdentity | null>(null);

  const lifecycle = createRuntimeLifecycle({
    options,
    plugins,
    replayContext,
    state,
    status,
    lastError,
    activeIdentity,
    createInitialState,
    toAppIdentity,
    toErrorMessage,
  });

  let api!: AppApi;

  const usersApi = createUsersApi({
    command: (type, input) => api.command(type, input),
    select: (pluginId, selectorId, ...args) => api.select(pluginId, selectorId, ...args),
    getPluginState: (pluginId) => api.getPluginState(pluginId),
    activeIdentity: () => activeIdentity.value,
    requireActiveIdentity,
  });

  const profilesApi = createProfilesApi({
    command: (type, input) => api.command(type, input),
    select: (pluginId, selectorId, ...args) => api.select(pluginId, selectorId, ...args),
    getPluginState: (pluginId) => api.getPluginState(pluginId),
    activeIdentity: () => activeIdentity.value,
    requireActiveIdentity,
  });

  const permissionsApi = createPermissionsApi({
    command: (type, input) => api.command(type, input),
    select: (pluginId, selectorId, ...args) => api.select(pluginId, selectorId, ...args),
    getPluginState: (pluginId) => api.getPluginState(pluginId),
    activeIdentity: () => activeIdentity.value,
    requireActiveIdentity,
    buildPermissionActor,
    requireProjectedUser,
  });

  const tasksApi = createTasksApi({
    command: (type, input) => api.command(type, input),
    select: (pluginId, selectorId, ...args) => api.select(pluginId, selectorId, ...args),
    getPluginState: (pluginId) => api.getPluginState(pluginId),
    activeIdentity: () => activeIdentity.value,
    requireActiveIdentity,
  });

  api = {
    status: readonly(status),
    state: readonly(state),
    lastError: readonly(lastError),
    identity: createIdentityApi({
      status,
      activeIdentity,
      ensureRuntime: lifecycle.ensureRuntime,
      bootstrap: lifecycle.bootstrap,
      teardownRuntime: lifecycle.teardownRuntime,
      ensureIdentityService: lifecycle.ensureIdentityService,
    }),
    users: usersApi,
    profiles: profilesApi,
    permissions: permissionsApi,
    tasks: tasksApi,
    storage: {
      listProviders() {
        return lifecycle.executeMutation(async () => {
          const runtime = await lifecycle.ensureRuntime();
          return runtime.listStorageProviders().map((provider) => ({
            id: provider.id,
            label: provider.label,
            capabilities: { ...provider.capabilities },
          }));
        });
      },
      getActiveRef() {
        return lifecycle.executeMutation(async () => {
          const runtime = await lifecycle.ensureRuntime();
          return runtime.getActiveStorageRef();
        });
      },
      setActiveRef(ref) {
        return lifecycle.executeMutation(async () => {
          const runtime = await lifecycle.ensureRuntime();
          runtime.setActiveStorageRef(ref);
        });
      },
      configureProvider(inputValue) {
        return lifecycle.executeMutation(async () => {
          const runtime = await lifecycle.ensureRuntime();
          runtime.configureStorageSync(inputValue.sync, inputValue.ref);
        });
      },
      getCapabilities(providerId) {
        return lifecycle.executeMutation(async () => {
          const runtime = await lifecycle.ensureRuntime();
          return runtime.getStorageCapabilities(providerId);
        });
      },
    },
    load() {
      return lifecycle.ensureRuntime().then(() => undefined);
    },
    command(type, input) {
      return lifecycle.executeMutation(async () => {
        const runtime = await lifecycle.ensureRuntime();
        return await runtime.commandWithReplay(type, input);
      });
    },
    commit(input) {
      return lifecycle.executeMutation(async () => {
        const runtime = await lifecycle.ensureRuntime();
        return await runtime.commitWithReplay(input);
      });
    },
    discard() {
      return lifecycle.executeMutation(async () => {
        const runtime = await lifecycle.ensureRuntime();
        await runtime.discardWithReplay();
      });
    },
    replay(optionsValue) {
      return lifecycle.executeMutation(async () => {
        const runtime = await lifecycle.ensureRuntime();
        await runtime.replayPipeline({
          replay: optionsValue,
        });
      });
    },
    createLedger(metadata) {
      return lifecycle.executeMutation(async () => {
        const runtime = await lifecycle.ensureRuntime();
        await runtime.concord.create({
          metadata,
        });
        await runtime.replayPipeline();
        await ensureCreatorUserBootstrap(runtime, activeIdentity.value);
      });
    },
    exportLedger() {
      return lifecycle.executeMutation(async () => {
        const runtime = await lifecycle.ensureRuntime();
        return await runtime.concord.exportLedger();
      });
    },
    importLedger(container: AppLedgerContainer) {
      return lifecycle.executeMutation(async () => {
        const runtime = await lifecycle.ensureRuntime();
        await runtime.importWithReplay(container);
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

      void lifecycle
        .ensureRuntime()
        .then((runtime) => {
          if (closed) {
            return;
          }
          unsubscribeRuntime = runtime.subscribe(resolved);
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
      await lifecycle.teardownRuntime();
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
export function configureAppApiSingletonForTests(options: CreateAppApiOptions | null): void {
  singletonOptionsForTests = options;
}

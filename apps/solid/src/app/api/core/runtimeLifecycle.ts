import type { Ref, ShallowRef } from "vue";
import {
  createApp as createRuntimeApp,
  createConcordLocalStorageAdapter,
  createIdentityService,
  type AppProjectionPlugin,
  type AppRuntime,
  type IdentityBootstrapMode,
  type IdentityService,
} from "@/app/runtime";
import type { RuntimeReplayContext } from "@/app/plugins";
import type { AppIdentity, AppStatus } from "@/app/api/types";
import type { ConcordState } from "@ternent/concord";
import type { CreateAppApiOptions } from "@/app/api/options";
import { ensureCreatorUserBootstrap } from "./helpers";

export type RuntimeLifecycleContext = {
  options?: CreateAppApiOptions;
  plugins: AppProjectionPlugin[];
  replayContext: RuntimeReplayContext;
  state: ShallowRef<Readonly<ConcordState>>;
  status: Ref<AppStatus>;
  lastError: Ref<string | null>;
  activeIdentity: Ref<AppIdentity | null>;
  createInitialState: (plugins: AppProjectionPlugin[]) => ConcordState;
  toAppIdentity: (input: { identityId: string; label: string; publicKey: string }) => AppIdentity;
  toErrorMessage: (error: unknown) => string;
};

export type RuntimeLifecycle = {
  ensureIdentityService(): IdentityService;
  teardownRuntime(): Promise<void>;
  bootstrap(mode?: IdentityBootstrapMode): Promise<void>;
  ensureRuntime(): Promise<AppRuntime>;
  executeMutation<T>(task: () => Promise<T>): Promise<T>;
};

export function createRuntimeLifecycle(context: RuntimeLifecycleContext): RuntimeLifecycle {
  let runtime: AppRuntime | null = null;
  let identityService: IdentityService | null = null;
  let bootstrapPromise: Promise<void> | null = null;
  let runtimeSubscription: (() => void) | null = null;

  function ensureIdentityService(): IdentityService {
    if (identityService) {
      return identityService;
    }

    identityService = createIdentityService({
      identity: context.options?.identity,
      encryptedIdentity: context.options?.encryptedIdentity,
      identityBootstrapMode: context.options?.identityBootstrapMode,
      storage: context.options?.identityStorage,
      storageKey: context.options?.identityStorageKey,
      devSessionUnlockBypass: context.options?.devSessionUnlockBypass ?? import.meta.env.DEV,
      rpName: context.options?.rpName,
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
    context.replayContext.endReplayPipeline();
    context.replayContext.clearDecryptedPayloadCache();
    context.state.value = context.createInitialState(context.plugins);
    context.status.value = "restoring";
    context.lastError.value = null;
    context.activeIdentity.value = null;
  }

  async function bootstrap(mode?: IdentityBootstrapMode): Promise<void> {
    if (runtime) {
      return;
    }

    try {
      const resolvedIdentity = await ensureIdentityService().ensureUnlocked(mode);

      context.activeIdentity.value = context.toAppIdentity({
        identityId: resolvedIdentity.identityId,
        label: resolvedIdentity.label,
        publicKey: resolvedIdentity.identity.publicKey,
      });

      const storage =
        context.options?.storage ??
        createConcordLocalStorageAdapter({
          storage: context.options?.concordStorage,
          storageKey: context.options?.concordStorageKey,
        });

      runtime = await createRuntimeApp({
        identity: resolvedIdentity.identity,
        storage,
        plugins: context.plugins,
        replayContext: context.replayContext,
        workspaceStorageRef: context.options?.workspaceStorageRef,
        storageSync: context.options?.storageSync ?? null,
      });

      runtimeSubscription = runtime.subscribe((nextState) => {
        context.state.value = nextState;
      });

      await runtime.loadWithReplayPipeline();
      await ensureCreatorUserBootstrap(runtime, context.activeIdentity.value);

      context.state.value = runtime.getState();
      context.status.value = "ready";
      context.lastError.value = null;
    } catch (error) {
      context.replayContext.endReplayPipeline();
      context.status.value = "error";
      context.lastError.value = context.toErrorMessage(error);
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
      context.lastError.value = null;
      return result;
    } catch (error) {
      context.lastError.value = context.toErrorMessage(error);
      throw error;
    }
  }

  return {
    ensureIdentityService,
    teardownRuntime,
    bootstrap,
    ensureRuntime,
    executeMutation,
  };
}

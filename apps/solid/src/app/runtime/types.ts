import type {
  ConcordApp,
  ConcordAppOptions,
  ConcordCommandResult,
  ConcordCommitInput,
  ConcordReplayPlugin,
  ConcordState,
} from "@ternent/concord";
import type { RuntimeReplayContext } from "@/app/plugins/replayContext";
import type {
  RuntimeCommitResult,
  RuntimeReplayOptions,
  RuntimeReplayResult,
  RuntimeStorageCapabilities,
  RuntimeStorageProvider,
  WorkspaceStorageRef,
} from "@/app/runtime/contracts";
import type { RuntimeStorageProviderRegistry } from "@/app/runtime/storageProviders";

export type AppSelector<TState = unknown> = (state: TState, ...args: unknown[]) => unknown;

export type AppProjectionPlugin<TState = unknown> = {
  plugin: ConcordReplayPlugin<TState>;
  selectors?: Record<string, AppSelector<TState>>;
};

export type RuntimeStorageSyncOptions = {
  providerId: "http";
  baseUrl?: string;
  headers?: Record<string, string>;
  loadMethod?: "GET";
  saveMethod?: "PUT" | "POST";
  pushMethod?: "PUT" | "POST";
  supportsCompareAndSwap?: boolean;
  mode?: "single-writer" | "shared" | "test";
  allowUnsafeSharedPush?: boolean;
};

export type CreateAppInput = Pick<ConcordAppOptions, "identity" | "storage"> & {
  plugins: AppProjectionPlugin[];
  replayContext?: RuntimeReplayContext;
  workspaceStorageRef?: WorkspaceStorageRef;
  storageSync?: RuntimeStorageSyncOptions | null;
};

export type ReplayPipelineOptions = {
  replay?: RuntimeReplayOptions;
  mode?: "workspace" | "load";
};

export type AppRuntime = {
  load(): Promise<void>;
  command<TInput = unknown>(type: string, input: TInput): Promise<ConcordCommandResult>;
  commit(input?: ConcordCommitInput): Promise<RuntimeCommitResult>;
  discard(): Promise<void>;
  replay(options?: RuntimeReplayOptions): Promise<RuntimeReplayResult>;
  replayPipeline(options?: ReplayPipelineOptions): Promise<RuntimeReplayResult>;
  loadWithReplayPipeline(): Promise<RuntimeReplayResult>;
  commandWithReplay<TInput = unknown>(type: string, input: TInput): Promise<ConcordCommandResult>;
  commitWithReplay(input?: ConcordCommitInput): Promise<RuntimeCommitResult>;
  discardWithReplay(): Promise<RuntimeReplayResult>;
  importWithReplay(container: Awaited<ReturnType<ConcordApp["exportLedger"]>>): Promise<RuntimeReplayResult>;
  getState(): Readonly<ConcordState>;
  getPluginState<TState = unknown>(pluginId: string): TState;
  select<TValue = unknown>(pluginId: string, selectorId: string, ...args: unknown[]): TValue;
  subscribe(listener: (state: Readonly<ConcordState>) => void): () => void;
  destroy(): Promise<void>;
  concord: ConcordApp;
  getActiveStorageRef(): WorkspaceStorageRef;
  setActiveStorageRef(ref: WorkspaceStorageRef): void;
  configureStorageSync(config: RuntimeStorageSyncOptions, ref?: WorkspaceStorageRef): void;
  getStorageProvider(providerId: string): RuntimeStorageProvider | null;
  getStorageCapabilities(providerId?: string): RuntimeStorageCapabilities | null;
  listStorageProviders(): RuntimeStorageProvider[];
  storageProviders: RuntimeStorageProviderRegistry;
};

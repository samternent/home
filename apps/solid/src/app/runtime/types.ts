import type {
  ConcordApp,
  ConcordAppOptions,
  ConcordCommandResult,
  ConcordCommitInput,
  ConcordCommitResult,
  ConcordReplayOptions,
  ConcordReplayPlugin,
  ConcordState,
} from "@ternent/concord";
import type { RuntimeReplayContext } from "@/app/plugins/replayContext";

export type AppSelector<TState = unknown> = (state: TState, ...args: unknown[]) => unknown;

export type AppProjectionPlugin<TState = unknown> = {
  plugin: ConcordReplayPlugin<TState>;
  selectors?: Record<string, AppSelector<TState>>;
};

export type CreateAppInput = Pick<ConcordAppOptions, "identity" | "storage"> & {
  plugins: AppProjectionPlugin[];
  replayContext?: RuntimeReplayContext;
};

export type ReplayPipelineOptions = {
  replay?: ConcordReplayOptions;
  mode?: "full" | "load";
};

export type AppRuntime = {
  load(): Promise<void>;
  command<TInput = unknown>(type: string, input: TInput): Promise<ConcordCommandResult>;
  commit(input?: ConcordCommitInput): Promise<ConcordCommitResult>;
  discard(): Promise<void>;
  replay(options?: ConcordReplayOptions): Promise<void>;
  replayPipeline(options?: ReplayPipelineOptions): Promise<void>;
  loadWithReplayPipeline(): Promise<void>;
  commandWithReplay<TInput = unknown>(type: string, input: TInput): Promise<ConcordCommandResult>;
  commitWithReplay(input?: ConcordCommitInput): Promise<ConcordCommitResult>;
  discardWithReplay(): Promise<void>;
  importWithReplay(container: Awaited<ReturnType<ConcordApp["exportLedger"]>>): Promise<void>;
  getState(): Readonly<ConcordState>;
  getPluginState<TState = unknown>(pluginId: string): TState;
  select<TValue = unknown>(pluginId: string, selectorId: string, ...args: unknown[]): TValue;
  subscribe(listener: (state: Readonly<ConcordState>) => void): () => void;
  destroy(): Promise<void>;
  concord: ConcordApp;
};

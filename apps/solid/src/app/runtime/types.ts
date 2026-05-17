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

export type AppSelector<TState = unknown> = (state: TState, ...args: unknown[]) => unknown;

export type AppProjectionPlugin<TState = unknown> = {
  plugin: ConcordReplayPlugin<TState>;
  selectors?: Record<string, AppSelector<TState>>;
};

export type CreateAppInput = Pick<ConcordAppOptions, "identity" | "storage"> & {
  plugins: AppProjectionPlugin[];
};

export type AppRuntime = {
  load(): Promise<void>;
  command<TInput = unknown>(type: string, input: TInput): Promise<ConcordCommandResult>;
  commit(input?: ConcordCommitInput): Promise<ConcordCommitResult>;
  discard(): Promise<void>;
  replay(options?: ConcordReplayOptions): Promise<void>;
  getState(): Readonly<ConcordState>;
  getPluginState<TState = unknown>(pluginId: string): TState;
  select<TValue = unknown>(pluginId: string, selectorId: string, ...args: unknown[]): TValue;
  subscribe(listener: (state: Readonly<ConcordState>) => void): () => void;
  destroy(): Promise<void>;
  concord: ConcordApp;
};

declare module "@ternent/concord" {
  import type { LedgerReplayEntry } from "@ternent/ledger";

  export type ConcordCommandContext = {
    getReplayState<TState = unknown>(pluginId: string): TState;
  };

  export type ConcordApplyContext<TState> = {
    getState(): TState | undefined;
    setState(state: TState): void;
  };

  export type ConcordReplayPlugin<TState> = {
    id: string;
    initialState(): TState;
    commands: Record<
      string,
      (
        ctx: ConcordCommandContext,
        inputValue: any,
      ) => Promise<{ kind: string; payload: any }>
    >;
    applyEntry(
      entry: LedgerReplayEntry,
      ctx: ConcordApplyContext<TState>,
    ): Promise<void> | void;
    selectors?: Record<string, (state: TState) => unknown>;
  };
}

import {
  createLedger,
  type LedgerAppendInput,
  type LedgerCommitResult,
  type LedgerContainer,
  type LedgerDecryptor,
  type LedgerIdentityContext,
  type LedgerReplayEntry,
  type LedgerVerificationResult,
} from "@ternent/ledger";
import type { SerializedIdentity } from "@ternent/identity";
import { ConcordBoundaryError } from "./errors.js";
import type {
  ConcordApp,
  ConcordAppOptions,
  ConcordCommandContext,
  ConcordCommandResult,
  ConcordCommitInput,
  ConcordCommitResult,
  ConcordCreateParams,
  ConcordReplayContext,
  ConcordReplayMetadata,
  ConcordReplayOptions,
  ConcordReplayPlugin,
  ConcordState,
} from "./types.js";

type CommandRegistration = {
  plugin: ConcordReplayPlugin;
  handler: NonNullable<ConcordReplayPlugin["commands"]>[string];
};

type RebuildStateOptions = {
  ready: boolean;
  integrityValid: boolean;
  verification: LedgerVerificationResult | null;
};

type ReplayRange = Pick<
  ConcordReplayMetadata,
  "fromEntryId" | "toEntryId" | "isPartial"
>;

type ReplayDraft = {
  nextState: ConcordState;
  contexts: Map<string, ConcordReplayContext>;
};

function createDefaultNow() {
  return new Date().toISOString();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLedgerReplayEntry(value: unknown): value is LedgerReplayEntry {
  if (!isObject(value)) {
    return false;
  }

  if (
    typeof value.entryId !== "string" ||
    typeof value.kind !== "string" ||
    typeof value.author !== "string" ||
    typeof value.authoredAt !== "string"
  ) {
    return false;
  }

  if (!(value.meta === null || isObject(value.meta))) {
    return false;
  }

  if (!isObject(value.payload) || typeof value.payload.type !== "string") {
    return false;
  }

  return (
    value.payload.type === "plain" ||
    value.payload.type === "encrypted" ||
    value.payload.type === "decrypted"
  );
}

function assertReplayEntries(value: unknown): LedgerReplayEntry[] {
  if (Array.isArray(value) && value.every(isLedgerReplayEntry)) {
    return value;
  }

  throw new ConcordBoundaryError(
    "INVALID_LEDGER_PROJECTION",
    "Concord requires ledger replay output to be LedgerReplayEntry[].",
  );
}

function createInitialReplayState(
  plugins: ConcordReplayPlugin[],
): Record<string, unknown> {
  return Object.fromEntries(
    plugins.map((plugin) => [plugin.id, plugin.initialState?.()]),
  );
}

function assertKnownPlugin(
  pluginsById: Map<string, ConcordReplayPlugin>,
  pluginId: string,
): void {
  if (!pluginsById.has(pluginId)) {
    throw new ConcordBoundaryError(
      "UNKNOWN_PLUGIN",
      `Unknown Concord plugin: ${pluginId}`,
    );
  }
}

function normalizeAppendInputs(
  value: LedgerAppendInput | LedgerAppendInput[],
): LedgerAppendInput[] {
  const inputs = Array.isArray(value) ? value : [value];
  if (inputs.length === 0) {
    throw new ConcordBoundaryError(
      "COMMAND_PRODUCED_NO_ENTRIES",
      "Concord command handlers must return at least one LedgerAppendInput.",
    );
  }
  return inputs;
}

function assertInternalLedgerRequirements(input: ConcordAppOptions): void {
  if (!input.identity) {
    throw new ConcordBoundaryError(
      "INVALID_IDENTITY",
      "Concord requires an identity when creating an internal ledger.",
    );
  }

  resolveAuthorFromIdentity(input.identity);
}

function resolveAuthorFromIdentity(identity: SerializedIdentity): string {
  if (!identity.keyId || typeof identity.keyId !== "string") {
    throw new ConcordBoundaryError(
      "INVALID_IDENTITY",
      "Concord identity is missing a valid keyId.",
    );
  }

  return `did:key:${identity.keyId}`;
}

function resolveSignerFromIdentity(
  identity: SerializedIdentity,
): LedgerIdentityContext["signer"] {
  return { identity };
}

function resolveDecryptorFromIdentity(
  identity: SerializedIdentity,
): LedgerDecryptor | undefined {
  return { identity } as LedgerDecryptor;
}

function resolveLedgerIdentity(identity: SerializedIdentity): LedgerIdentityContext {
  if (!identity) {
    throw new ConcordBoundaryError(
      "INVALID_IDENTITY",
      "Concord requires an identity when creating an internal ledger.",
    );
  }

  return {
    signer: resolveSignerFromIdentity(identity),
    authorResolver: () => resolveAuthorFromIdentity(identity),
    decryptor: resolveDecryptorFromIdentity(identity),
  };
}

function createReplayRange(options?: ConcordReplayOptions): ReplayRange {
  return {
    fromEntryId: options?.fromEntryId,
    toEntryId: options?.toEntryId,
    isPartial: Boolean(options?.fromEntryId || options?.toEntryId),
  };
}

function createReplayMetadata(range: ReplayRange): ConcordReplayMetadata {
  return {
    phase: "reset",
    entryCount: 0,
    fromEntryId: range.fromEntryId,
    toEntryId: range.toEntryId,
    isPartial: range.isPartial,
  };
}

export async function createConcordApp(
  input: ConcordAppOptions,
): Promise<ConcordApp> {
  const plugins = [...input.plugins];
  const now = input.now ?? createDefaultNow;
  const policy = {
    autoCommit: input.policy?.autoCommit ?? false,
  };

  const pluginsById = new Map<string, ConcordReplayPlugin>();
  const commands = new Map<string, CommandRegistration>();

  for (const plugin of plugins) {
    if (pluginsById.has(plugin.id)) {
      throw new ConcordBoundaryError(
        "DUPLICATE_PLUGIN_ID",
        `Duplicate Concord plugin id: ${plugin.id}`,
      );
    }

    pluginsById.set(plugin.id, plugin);

    for (const [commandType, handler] of Object.entries(plugin.commands ?? {})) {
      if (commands.has(commandType)) {
        throw new ConcordBoundaryError(
          "DUPLICATE_COMMAND_TYPE",
          `Duplicate Concord command type: ${commandType}`,
        );
      }

      commands.set(commandType, { plugin, handler });
    }
  }

  if (!input.ledger) {
    assertInternalLedgerRequirements(input);
  }

  const ledger =
    input.ledger ??
    (await createLedger<LedgerReplayEntry[]>({
      identity: resolveLedgerIdentity(input.identity),
      initialProjection: [],
      projector: (entries: LedgerReplayEntry[], entry: LedgerReplayEntry) => [
        ...entries,
        entry,
      ],
      storage: input.storage,
      now,
      protocol: input.protocol,
      seal: input.seal,
      armour: input.armour,
      autoCommit: false,
      replayPolicy: {
        verify: false,
        decrypt: true,
      },
    }));

  let state: ConcordState = {
    ready: false,
    integrityValid: false,
    stagedCount: 0,
    replay: createInitialReplayState(plugins),
    verification: null,
  };

  const listeners = new Set<(value: Readonly<ConcordState>) => void>();

  function getReplayState<T = unknown>(pluginId: string, source = state): T {
    assertKnownPlugin(pluginsById, pluginId);
    return source.replay[pluginId] as T;
  }

  function publish(nextState: ConcordState): void {
    state = nextState;
    for (const listener of listeners) {
      listener(state);
    }
  }

  function createReplayDraft(
    options: RebuildStateOptions,
    range: ReplayRange,
  ): ReplayDraft {
    const nextState: ConcordState = {
      ready: options.ready,
      integrityValid: options.integrityValid,
      stagedCount: ledger.getState().staged.length,
      replay: createInitialReplayState(plugins),
      verification: options.verification,
    };

    const contexts = new Map<string, ConcordReplayContext>();

    for (const plugin of plugins) {
      const metadata = createReplayMetadata(range);
      const context: ConcordReplayContext = {
        pluginId: plugin.id,
        decryptAvailable: Boolean(resolveDecryptorFromIdentity(input.identity)),
        replay: metadata,
        getState() {
          return nextState.replay[plugin.id] as unknown;
        },
        setState(next) {
          const prev = nextState.replay[plugin.id];
          nextState.replay[plugin.id] =
            typeof next === "function"
              ? (next as (value: unknown) => unknown)(prev)
              : next;
        },
      };
      contexts.set(plugin.id, context);
    }

    return { nextState, contexts };
  }

  async function rebuildFromReplayEntries(
    replayEntries: unknown,
    options: RebuildStateOptions,
    range: ReplayRange = createReplayRange(),
  ): Promise<void> {
    const entries = assertReplayEntries(replayEntries);
    const { nextState, contexts } = createReplayDraft(options, range);

    for (const plugin of plugins) {
      const context = contexts.get(plugin.id) as ConcordReplayContext;
      context.replay.phase = "reset";
      context.replay.entryIndex = undefined;
      context.replay.entryCount = entries.length;
      await plugin.reset?.(context as never);
    }

    for (const plugin of plugins) {
      const context = contexts.get(plugin.id) as ConcordReplayContext;
      context.replay.phase = "beginReplay";
      context.replay.entryIndex = undefined;
      context.replay.entryCount = entries.length;
      await plugin.beginReplay?.(context as never);
    }

    // Any ordered replay slice is deterministic, but authoritative full-state
    // reconstruction still requires replay from genesis or a valid checkpoint.
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      for (const plugin of plugins) {
        const context = contexts.get(plugin.id) as ConcordReplayContext;
        context.replay.phase = "applyEntry";
        context.replay.entryIndex = index;
        context.replay.entryCount = entries.length;
        await plugin.applyEntry?.(entry, context as never);
      }
    }

    for (const plugin of plugins) {
      const context = contexts.get(plugin.id) as ConcordReplayContext;
      context.replay.phase = "endReplay";
      context.replay.entryIndex = undefined;
      context.replay.entryCount = entries.length;
      await plugin.endReplay?.(context as never);
    }

    publish(nextState);
  }

  function requireReady(): void {
    if (!state.ready) {
      throw new ConcordBoundaryError(
        "APP_NOT_READY",
        "Concord app must be loaded or created before commands can run.",
      );
    }
  }

  function createCommandContext(): ConcordCommandContext {
    return {
      now,
      identity: input.identity,
      getReplayState<T = unknown>(pluginId: string): T {
        return getReplayState<T>(pluginId);
      },
    };
  }

  function publishIntegrityFailure(
    verification: LedgerVerificationResult,
    resetReplay: boolean,
  ): void {
    publish({
      ready: false,
      integrityValid: false,
      stagedCount: ledger.getState().staged.length,
      replay: resetReplay ? createInitialReplayState(plugins) : state.replay,
      verification,
    });
  }

  async function ensureCommittedHistoryUsable(options?: {
    allowInspectionOnly?: boolean;
    resetReplayOnFailure?: boolean;
  }): Promise<boolean> {
    const verification = await ledger.verify();
    if (verification.committedHistoryValid) {
      return true;
    }

    publishIntegrityFailure(
      verification,
      options?.resetReplayOnFailure ?? true,
    );

    if (options?.allowInspectionOnly) {
      return false;
    }

    throw new ConcordBoundaryError(
      "INVALID_COMMITTED_HISTORY",
      "Concord cannot project runtime state from invalid committed history.",
    );
  }

  async function replay(options?: ConcordReplayOptions): Promise<void> {
    if (!(await ensureCommittedHistoryUsable())) {
      return;
    }

    const replayEntries = await ledger.replay(options);
    await rebuildFromReplayEntries(
      replayEntries,
      {
        ready: state.ready,
        integrityValid: true,
        verification: state.verification,
      },
      createReplayRange(options),
    );
  }

  async function create(params?: ConcordCreateParams): Promise<void> {
    await ledger.create(params);

    if (!(await ensureCommittedHistoryUsable())) {
      return;
    }

    await rebuildFromReplayEntries(await ledger.replay(), {
      ready: true,
      integrityValid: true,
      verification: null,
    });
  }

  async function load(): Promise<void> {
    const loaded = await ledger.loadFromStorage();
    if (!loaded) {
      await ledger.create();
    }

    if (
      !(await ensureCommittedHistoryUsable({
        allowInspectionOnly: true,
        resetReplayOnFailure: true,
      }))
    ) {
      return;
    }

    await rebuildFromReplayEntries(await ledger.replay(), {
      ready: true,
      integrityValid: true,
      verification: null,
    });
  }

  async function command<TInput = unknown>(
    type: string,
    inputValue: TInput,
  ): Promise<ConcordCommandResult> {
    requireReady();

    const registration = commands.get(type);
    if (!registration) {
      throw new ConcordBoundaryError(
        "UNKNOWN_COMMAND",
        `Unknown Concord command type: ${type}`,
      );
    }

    const appendInputs = normalizeAppendInputs(
      await registration.handler(createCommandContext(), inputValue),
    );

    const appendResults = await ledger.appendMany(appendInputs);
    let commitResult: LedgerCommitResult | undefined;

    if (policy.autoCommit) {
      commitResult = await ledger.commit();
    }

    if (!(await ensureCommittedHistoryUsable())) {
      return {
        commitId: commitResult?.commit.commitId,
        entryIds: appendResults.map((result) => result.entry.entryId),
        stagedCount: ledger.getState().staged.length,
      };
    }

    await rebuildFromReplayEntries(await ledger.replay(), {
      ready: true,
      integrityValid: true,
      verification: null,
    });

    return {
      commitId: commitResult?.commit.commitId,
      entryIds: appendResults.map((result) => result.entry.entryId),
      stagedCount: state.stagedCount,
    };
  }

  async function commit(
    input?: ConcordCommitInput,
  ): Promise<ConcordCommitResult> {
    requireReady();

    const result = await ledger.commit(input);

    if (!(await ensureCommittedHistoryUsable())) {
      return {
        commitId: result.commit.commitId,
        entryIds: result.committedEntryIds,
      };
    }

    await rebuildFromReplayEntries(await ledger.replay(), {
      ready: true,
      integrityValid: true,
      verification: null,
    });

    return {
      commitId: result.commit.commitId,
      entryIds: result.committedEntryIds,
    };
  }

  async function recompute(): Promise<void> {
    if (!(await ensureCommittedHistoryUsable())) {
      return;
    }

    const replayEntries = await ledger.recompute();
    await rebuildFromReplayEntries(replayEntries, {
      ready: state.ready,
      integrityValid: true,
      verification: state.verification,
    });
  }

  async function verify(): Promise<LedgerVerificationResult> {
    const verification = await ledger.verify();
    publish({
      ready: state.ready && verification.committedHistoryValid,
      integrityValid: verification.committedHistoryValid,
      stagedCount: state.stagedCount,
      replay: state.replay,
      verification,
    });
    return verification;
  }

  async function exportLedger(): Promise<LedgerContainer> {
    return ledger.export();
  }

  async function importLedger(container: LedgerContainer): Promise<void> {
    await ledger.import(container);

    if (
      !(await ensureCommittedHistoryUsable({
        allowInspectionOnly: true,
        resetReplayOnFailure: true,
      }))
    ) {
      return;
    }

    await rebuildFromReplayEntries(await ledger.replay(), {
      ready: true,
      integrityValid: true,
      verification: null,
    });
  }

  function subscribe(
    listener: (value: Readonly<ConcordState>) => void,
  ): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  async function destroy(): Promise<void> {
    for (const plugin of plugins) {
      await plugin.destroy?.();
    }

    await ledger.destroy();
    publish({
      ready: false,
      integrityValid: false,
      stagedCount: 0,
      replay: createInitialReplayState(plugins),
      verification: null,
    });
    listeners.clear();
  }

  return {
    create,
    load,
    command,
    commit,
    replay,
    recompute,
    verify,
    exportLedger,
    importLedger,
    getState() {
      return state;
    },
    getReplayState<T = unknown>(pluginId: string): T {
      return getReplayState<T>(pluginId);
    },
    subscribe,
    destroy,
  };
}

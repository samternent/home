import {
  createLedger,
  type LedgerAppendInput,
  type LedgerCommitResult,
  type LedgerContainer,
  type LedgerDecryptor,
  type LedgerIdentityContext,
  type LedgerInstance,
  type LedgerReplayEntry,
  type LedgerVerificationResult
} from "@ternent/ledger";
import { ConcordBoundaryError } from "./errors.js";
import type {
  ConcordApp,
  ConcordCommandContext,
  ConcordCommandResult,
  ConcordCommitInput,
  ConcordCommitResult,
  ConcordCreateParams,
  ConcordPlugin,
  ConcordProjectionReplayContext,
  ConcordReplayOptions,
  ConcordState,
  CreateConcordAppInput
} from "./types.js";

type CommandRegistration = {
  plugin: ConcordPlugin;
  handler: NonNullable<ConcordPlugin["commands"]>[string];
};

type RebuildStateOptions = {
  ready: boolean;
  integrityValid: boolean;
  verification: LedgerVerificationResult | null;
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
    "Concord requires ledger replay output to be LedgerReplayEntry[]."
  );
}

function createInitialPluginState(plugins: ConcordPlugin[]): Record<string, unknown> {
  return Object.fromEntries(plugins.map((plugin) => [plugin.id, plugin.initialState()]));
}

function assertKnownPlugin(
  pluginsById: Map<string, ConcordPlugin>,
  pluginId: string
): void {
  if (!pluginsById.has(pluginId)) {
    throw new ConcordBoundaryError(
      "UNKNOWN_PLUGIN",
      `Unknown Concord plugin: ${pluginId}`
    );
  }
}

function normalizeAppendInputs(
  value: LedgerAppendInput | LedgerAppendInput[]
): LedgerAppendInput[] {
  const inputs = Array.isArray(value) ? value : [value];
  if (inputs.length === 0) {
    throw new ConcordBoundaryError(
      "COMMAND_PRODUCED_NO_ENTRIES",
      "Concord command handlers must return at least one LedgerAppendInput."
    );
  }
  return inputs;
}

function assertInternalLedgerRequirements(input: CreateConcordAppInput): void {
  if (typeof input.identity.author !== "string" || input.identity.author.length === 0) {
    throw new ConcordBoundaryError(
      "INVALID_IDENTITY",
      "Concord requires identity.author when creating an internal ledger."
    );
  }

  if (!input.identity.signer) {
    throw new ConcordBoundaryError(
      "INVALID_IDENTITY",
      "Concord requires identity.signer when creating an internal ledger."
    );
  }
}

export async function createConcordApp(
  input: CreateConcordAppInput
): Promise<ConcordApp> {
  const plugins = [...input.plugins];
  const projectionTargets = [...(input.projectionTargets ?? [])];
  const now = input.now ?? createDefaultNow;
  const policy = {
    autoCommit: input.policy?.autoCommit ?? false
  };

  const pluginsById = new Map<string, ConcordPlugin>();
  const commands = new Map<string, CommandRegistration>();
  const projectionTargetNames = new Set<string>();

  for (const plugin of plugins) {
    if (pluginsById.has(plugin.id)) {
      throw new ConcordBoundaryError(
        "DUPLICATE_PLUGIN_ID",
        `Duplicate Concord plugin id: ${plugin.id}`
      );
    }

    pluginsById.set(plugin.id, plugin);

    for (const [commandType, handler] of Object.entries(plugin.commands ?? {})) {
      if (commands.has(commandType)) {
        throw new ConcordBoundaryError(
          "DUPLICATE_COMMAND_TYPE",
          `Duplicate Concord command type: ${commandType}`
        );
      }

      commands.set(commandType, { plugin, handler });
    }
  }

  for (const target of projectionTargets) {
    if (projectionTargetNames.has(target.name)) {
      throw new ConcordBoundaryError(
        "DUPLICATE_PROJECTION_TARGET_NAME",
        `Duplicate Concord projection target name: ${target.name}`
      );
    }

    projectionTargetNames.add(target.name);
  }

  if (!input.ledger) {
    assertInternalLedgerRequirements(input);
  }

  const ledger =
    input.ledger ??
    (await createLedger<LedgerReplayEntry[]>({
      identity: {
        signer: input.identity.signer as LedgerIdentityContext["signer"],
        authorResolver: () => input.identity.author,
        decryptor: input.identity.decryptor as LedgerDecryptor | undefined
      },
      initialProjection: [],
      projector: (entries: LedgerReplayEntry[], entry: LedgerReplayEntry) => [
        ...entries,
        entry
      ],
      storage: input.storage,
      now,
      protocol: input.protocol,
      seal: input.seal,
      armour: input.armour,
      autoCommit: false,
      replayPolicy: {
        verify: false,
        decrypt: true
      }
    }));

  let state: ConcordState = {
    ready: false,
    integrityValid: false,
    stagedCount: 0,
    plugins: createInitialPluginState(plugins),
    verification: null
  };

  const listeners = new Set<(value: Readonly<ConcordState>) => void>();

  function getPluginState<T = unknown>(pluginId: string, source = state): T {
    assertKnownPlugin(pluginsById, pluginId);
    return source.plugins[pluginId] as T;
  }

  function publish(nextState: ConcordState): void {
    state = nextState;
    for (const listener of listeners) {
      listener(state);
    }
  }

  async function rebuildFromEntries(
    entriesValue: unknown,
    options: RebuildStateOptions
  ): Promise<void> {
    const entries = assertReplayEntries(entriesValue);
    const nextState: ConcordState = {
      ready: options.ready,
      integrityValid: options.integrityValid,
      stagedCount: ledger.getState().staged.length,
      plugins: createInitialPluginState(plugins),
      verification: options.verification
    };

    const replayView = {
      getState(): Readonly<ConcordState> {
        return nextState;
      },
      getPluginState<T = unknown>(pluginId: string): T {
        return getPluginState<T>(pluginId, nextState);
      }
    };

    const replayContext: ConcordProjectionReplayContext = {
      app: replayView
    };

    for (const target of projectionTargets) {
      await target.reset();
    }

    for (const target of projectionTargets) {
      await target.beginReplay?.(replayContext);
    }

    for (const entry of entries) {
      for (const plugin of plugins) {
        nextState.plugins[plugin.id] = plugin.project(
          nextState.plugins[plugin.id],
          entry,
          { decryptAvailable: Boolean(input.identity.decryptor) }
        );
      }

      for (const target of projectionTargets) {
        await target.applyEntry(entry, replayContext);
      }
    }

    for (const target of projectionTargets) {
      await target.endReplay?.(replayContext);
    }

    publish(nextState);
  }

  async function rebuildFromReplay(
    replayEntries: unknown,
    options: RebuildStateOptions
  ): Promise<void> {
    await rebuildFromEntries(replayEntries, options);
  }

  function requireReady(): void {
    if (!state.ready) {
      throw new ConcordBoundaryError(
        "APP_NOT_READY",
        "Concord app must be loaded or created before commands can run."
      );
    }
  }

  function createCommandContext(): ConcordCommandContext {
    return {
      now,
      identity: input.identity,
      getPluginState<T = unknown>(pluginId: string): T {
        return getPluginState<T>(pluginId);
      }
    };
  }

  function publishIntegrityFailure(
    verification: LedgerVerificationResult,
    resetPlugins: boolean
  ): void {
    publish({
      ready: false,
      integrityValid: false,
      stagedCount: ledger.getState().staged.length,
      plugins: resetPlugins ? createInitialPluginState(plugins) : state.plugins,
      verification
    });
  }

  async function ensureCommittedHistoryUsable(options?: {
    allowInspectionOnly?: boolean;
    resetPluginsOnFailure?: boolean;
  }): Promise<boolean> {
    const verification = await ledger.verify();
    if (verification.committedHistoryValid) {
      return true;
    }

    publishIntegrityFailure(
      verification,
      options?.resetPluginsOnFailure ?? true
    );

    if (options?.allowInspectionOnly) {
      return false;
    }

    throw new ConcordBoundaryError(
      "INVALID_COMMITTED_HISTORY",
      "Concord cannot project runtime state from invalid committed history."
    );
  }

  async function replay(options?: ConcordReplayOptions): Promise<void> {
    if (!(await ensureCommittedHistoryUsable())) {
      return;
    }

    const replayEntries = await ledger.replay(options);
    await rebuildFromReplay(replayEntries, {
      ready: state.ready,
      integrityValid: true,
      verification: state.verification
    });
  }

  async function create(params?: ConcordCreateParams): Promise<void> {
    await ledger.create(params);

    if (!(await ensureCommittedHistoryUsable())) {
      return;
    }

    await rebuildFromReplay(await ledger.replay(), {
      ready: true,
      integrityValid: true,
      verification: null
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
        resetPluginsOnFailure: true
      }))
    ) {
      return;
    }

    await rebuildFromReplay(await ledger.replay(), {
      ready: true,
      integrityValid: true,
      verification: null
    });
  }

  async function command<TInput = unknown>(
    type: string,
    inputValue: TInput
  ): Promise<ConcordCommandResult> {
    requireReady();

    const registration = commands.get(type);
    if (!registration) {
      throw new ConcordBoundaryError(
        "UNKNOWN_COMMAND",
        `Unknown Concord command type: ${type}`
      );
    }

    const appendInputs = normalizeAppendInputs(
      await registration.handler(createCommandContext(), inputValue)
    );

    const appendResults = await ledger.appendMany(appendInputs);
    let commitResult: LedgerCommitResult | undefined;

    if (policy.autoCommit) {
      commitResult = await ledger.commit();
    }

    if (!(await ensureCommittedHistoryUsable())) {
      return {
        commitId: commitResult?.commit.commitId,
        entryIds: appendResults.map(
          (result: { entry: { entryId: string } }) => result.entry.entryId
        ),
        stagedCount: ledger.getState().staged.length
      };
    }

    await rebuildFromReplay(await ledger.replay(), {
      ready: true,
      integrityValid: true,
      verification: null
    });

    return {
      commitId: commitResult?.commit.commitId,
      entryIds: appendResults.map(
        (result: { entry: { entryId: string } }) => result.entry.entryId
      ),
      stagedCount: state.stagedCount
    };
  }

  async function commit(
    input?: ConcordCommitInput
  ): Promise<ConcordCommitResult> {
    requireReady();

    const result = await ledger.commit(input);

    if (!(await ensureCommittedHistoryUsable())) {
      return {
        commitId: result.commit.commitId,
        entryIds: result.committedEntryIds
      };
    }

    await rebuildFromReplay(await ledger.replay(), {
      ready: true,
      integrityValid: true,
      verification: null
    });

    return {
      commitId: result.commit.commitId,
      entryIds: result.committedEntryIds
    };
  }

  async function recompute(): Promise<void> {
    if (!(await ensureCommittedHistoryUsable())) {
      return;
    }

    const replayEntries = await ledger.recompute();
    await rebuildFromReplay(replayEntries, {
      ready: state.ready,
      integrityValid: true,
      verification: state.verification
    });
  }

  async function verify(): Promise<LedgerVerificationResult> {
    const verification = await ledger.verify();
    publish({
      ready: state.ready && verification.committedHistoryValid,
      integrityValid: verification.committedHistoryValid,
      stagedCount: state.stagedCount,
      plugins: state.plugins,
      verification
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
        resetPluginsOnFailure: true
      }))
    ) {
      return;
    }

    await rebuildFromReplay(await ledger.replay(), {
      ready: true,
      integrityValid: true,
      verification: null
    });
  }

  function subscribe(
    listener: (value: Readonly<ConcordState>) => void
  ): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  async function destroy(): Promise<void> {
    for (const target of projectionTargets) {
      await target.destroy?.();
    }

    await ledger.destroy();
    publish({
      ready: false,
      integrityValid: false,
      stagedCount: 0,
      plugins: createInitialPluginState(plugins),
      verification: null
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
    getPluginState<T = unknown>(pluginId: string): T {
      return getPluginState<T>(pluginId);
    },
    subscribe,
    destroy
  };
}

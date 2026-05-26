import { createConcordApp, type ConcordApp } from "@ternent/concord";
import type { LedgerEntryRecord, LedgerStorageAdapter } from "@ternent/ledger";
import type {
  AppProjectionPlugin,
  AppRuntime,
  AppSelector,
  CreateAppInput,
  RuntimeStorageSyncOptions,
} from "./types";
import type {
  RuntimeCommitResult,
  RuntimeConflict,
  RuntimeReplayOptions,
  RuntimeReplayResult,
  WorkspaceStorageRef,
} from "@/app/runtime/contracts";
import {
  countNewEntries,
  createDefaultLocalStorageRef,
  createHeadsFromContainer,
  createHttpRuntimeStorageProvider,
  createLedgerSnapshot,
  createLocalRuntimeStorageProvider,
  createRuntimeStorageProviderRegistry,
  hasSameHead,
  isHeadIncluded,
} from "@/app/runtime/storageProviders";

type SelectorRegistry = Map<string, Map<string, AppSelector>>;

type StagedEntryConflictInfo = {
  entryId: string;
  kind: string;
  aggregateId?: string;
  fields: string[];
  baseRevision?: string;
  actorIdentityKey?: string;
  permissionId?: string;
};

function createSelectorRegistry(plugins: AppProjectionPlugin[]): SelectorRegistry {
  const registry: SelectorRegistry = new Map();

  for (const plugin of plugins) {
    const pluginRegistry = new Map<string, AppSelector>();

    for (const [selectorId, selector] of Object.entries(plugin.selectors ?? {})) {
      pluginRegistry.set(selectorId, selector);
    }

    registry.set(plugin.plugin.id, pluginRegistry);
  }

  return registry;
}

function requireSelector(
  selectors: SelectorRegistry,
  pluginId: string,
  selectorId: string,
): AppSelector {
  const pluginSelectors = selectors.get(pluginId);
  if (!pluginSelectors) {
    throw new Error(`Unknown plugin id '${pluginId}'.`);
  }

  const selector = pluginSelectors.get(selectorId);
  if (!selector) {
    throw new Error(`Unknown selector '${selectorId}' for plugin '${pluginId}'.`);
  }

  return selector;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readPayload(entry: LedgerEntryRecord): Record<string, unknown> | null {
  if (entry.payload.type !== "plain") {
    return null;
  }

  return isRecord(entry.payload.data) ? entry.payload.data : null;
}

function readText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function mapTaskEntryFields(kind: string): string[] {
  if (kind === "task.rename") {
    return ["title"];
  }
  if (kind === "task.move") {
    return ["columnId"];
  }
  if (kind === "task.assign") {
    return ["assigneeIdentityKey"];
  }
  if (kind === "task.archive") {
    return ["archivedAt"];
  }
  if (kind === "task.create") {
    return ["create"];
  }
  return [];
}

function readConflictInfo(entry: LedgerEntryRecord): StagedEntryConflictInfo | null {
  const payload = readPayload(entry);
  if (!payload) {
    return null;
  }

  const runtimeConflict = isRecord(payload._runtimeConflict)
    ? (payload._runtimeConflict as Record<string, unknown>)
    : null;

  const aggregateId =
    readText(runtimeConflict?.aggregateId) ?? readText(payload.taskId) ?? undefined;
  const actorIdentityKey =
    readText(payload.updatedBy) ?? readText(payload.createdBy) ?? undefined;
  const permissionId = readText(payload.permissionId) ?? readText(payload.audienceId) ?? undefined;

  const fieldsFromMetadata = Array.isArray(runtimeConflict?.fields)
    ? runtimeConflict?.fields.filter((value): value is string => typeof value === "string")
    : [];

  const fields =
    fieldsFromMetadata.length > 0 ? fieldsFromMetadata : mapTaskEntryFields(entry.kind);

  return {
    entryId: entry.entryId,
    kind: entry.kind,
    aggregateId,
    fields,
    baseRevision: readText(runtimeConflict?.baseRevision) ?? undefined,
    actorIdentityKey,
    permissionId,
  };
}

function collectRemoteRevokes(entries: LedgerEntryRecord[]): Array<{ permissionId: string; memberId: string }> {
  const revokes: Array<{ permissionId: string; memberId: string }> = [];

  for (const entry of entries) {
    if (entry.kind !== "permission.revoke") {
      continue;
    }

    const payload = readPayload(entry);
    if (!payload) {
      continue;
    }

    const permissionId = readText(payload.permissionId);
    const memberId = readText(payload.memberId);

    if (permissionId && memberId) {
      revokes.push({ permissionId, memberId });
    }
  }

  return revokes;
}

function conflictsForEntries(input: {
  staged: LedgerEntryRecord[];
  remoteNew: LedgerEntryRecord[];
}): RuntimeConflict[] {
  const conflicts: RuntimeConflict[] = [];
  const stagedInfos = input.staged.map(readConflictInfo).filter(Boolean) as StagedEntryConflictInfo[];
  const remoteInfos = input.remoteNew.map(readConflictInfo).filter(Boolean) as StagedEntryConflictInfo[];

  const revokes = collectRemoteRevokes(input.remoteNew);

  for (const stagedInfo of stagedInfos) {
    if (stagedInfo.kind.startsWith("task.") && stagedInfo.permissionId && stagedInfo.actorIdentityKey) {
      const revoked = revokes.find(
        (revoke) =>
          revoke.permissionId === stagedInfo.permissionId &&
          revoke.memberId === stagedInfo.actorIdentityKey,
      );

      if (revoked) {
        conflicts.push({
          kind: "write-after-revoke",
          entryId: stagedInfo.entryId,
          aggregateId: stagedInfo.aggregateId,
          message:
            "Staged write targets a privacy group where the actor was revoked by remote changes.",
        });
      }
    }

    for (const remoteInfo of remoteInfos) {
      if (!stagedInfo.aggregateId || stagedInfo.aggregateId !== remoteInfo.aggregateId) {
        continue;
      }

      const intersects = stagedInfo.fields.some((field) => remoteInfo.fields.includes(field));
      if (!intersects) {
        continue;
      }

      const hasBase = stagedInfo.baseRevision && remoteInfo.baseRevision;
      const sameBase = !hasBase || stagedInfo.baseRevision === remoteInfo.baseRevision;
      if (!sameBase) {
        continue;
      }

      conflicts.push({
        kind: "same-aggregate-field-conflict",
        entryId: stagedInfo.entryId,
        aggregateId: stagedInfo.aggregateId,
        message:
          "Remote changes modified the same task field from the same base revision as a staged change.",
      });
    }
  }

  return conflicts;
}

async function createReplayResult(concord: ConcordApp): Promise<RuntimeReplayResult> {
  const exported = await concord.exportLedger();
  return {
    committedEntryCount: Object.keys(exported.entries).length,
    stagedEntryCount: concord.getState().stagedCount,
    phases: ["system", "workspace"],
  };
}

function createRejectedResult(input: {
  reason: RuntimeCommitResult extends { status: "rejected"; reason: infer T } ? T : never;
  conflicts: RuntimeConflict[];
  pulledEntryCount?: number;
  remoteHeads?: ReturnType<typeof createHeadsFromContainer>;
}): RuntimeCommitResult {
  return {
    status: "rejected",
    reason: input.reason,
    conflicts: input.conflicts,
    pulledEntryCount: input.pulledEntryCount,
    remoteHeads: input.remoteHeads,
  };
}

function toReplayReason(options?: RuntimeReplayOptions): RuntimeReplayOptions {
  return options ?? { reason: "manual" };
}

function ensureNoPartialReplay(options: RuntimeReplayOptions): void {
  if (options.fromEntryId || options.toEntryId) {
    throw new Error("Partial replay is unsupported in MVP.");
  }
}

function createStorageProviderFromConfig(config: RuntimeStorageSyncOptions) {
  if (config.providerId === "http") {
    return createHttpRuntimeStorageProvider({
      baseUrl: config.baseUrl,
      headers: config.headers,
      loadMethod: config.loadMethod,
      saveMethod: config.saveMethod,
      pushMethod: config.pushMethod,
      supportsCompareAndSwap: config.supportsCompareAndSwap,
      mode: config.mode,
      allowUnsafeSharedPush: config.allowUnsafeSharedPush,
    });
  }

  return null;
}

/**
 * Creates the app-level Concord bridge used by the v2 runtime.
 */
export async function createApp(input: CreateAppInput): Promise<AppRuntime> {
  const selectors = createSelectorRegistry(input.plugins);
  const concord = await createConcordApp({
    identity: input.identity,
    storage: input.storage,
    plugins: input.plugins.map((plugin) => plugin.plugin),
  });
  const replayContext = input.replayContext;
  const storageAdapter = input.storage;
  if (!storageAdapter) {
    throw new Error("Runtime storage adapter is required.");
  }
  const localProvider = createLocalRuntimeStorageProvider({ storage: storageAdapter });
  const storageProviders = createRuntimeStorageProviderRegistry({ providers: [localProvider] });

  const syncedProvider = input.storageSync ? createStorageProviderFromConfig(input.storageSync) : null;
  if (syncedProvider) {
    storageProviders.register(syncedProvider);
  }

  let activeStorageRef: WorkspaceStorageRef =
    input.workspaceStorageRef ??
    createDefaultLocalStorageRef({
      workspaceId: "solid-workspace",
      pointer: "local://concord",
    });

  function assertProviderRegistered(providerId: string): void {
    if (!storageProviders.has(providerId)) {
      throw new Error(`Storage provider '${providerId}' is not registered.`);
    }
  }

  async function replayPipeline(options?: {
    replay?: RuntimeReplayOptions;
    mode?: "workspace" | "load";
  }): Promise<RuntimeReplayResult> {
    const replayOptions = toReplayReason(options?.replay);
    ensureNoPartialReplay(replayOptions);

    if (!replayContext) {
      if (options?.mode === "load") {
        await concord.load();
      } else {
        await concord.replay();
      }
      return await createReplayResult(concord);
    }

    replayContext.beginReplayPipeline();

    try {
      replayContext.setPhase("system");
      if (options?.mode === "load") {
        await concord.load();
      } else {
        await concord.replay();
      }

      replayContext.setPhase("workspace");
      await concord.replay();
    } finally {
      replayContext.endReplayPipeline();
    }

    return await createReplayResult(concord);
  }

  async function getStorageSnapshot() {
    return await storageAdapter.load();
  }

  async function commitWithStorageSync(
    inputValue?: Parameters<typeof concord.commit>[0],
  ): Promise<RuntimeCommitResult> {
    const stateBefore = concord.getState();
    if (stateBefore.stagedCount === 0) {
      return createRejectedResult({
        reason: "unsupported",
        conflicts: [
          {
            kind: "staged-entry-invalid-after-pull",
            message: "No staged entries are available to commit.",
          },
        ],
      });
    }

    const provider = storageProviders.get(activeStorageRef.providerId);
    if (!provider) {
      return createRejectedResult({
        reason: "unsupported",
        conflicts: [
          {
            kind: "staged-entry-invalid-after-pull",
            message: `Storage provider '${activeStorageRef.providerId}' is unavailable.`,
          },
        ],
      });
    }

    let pulledEntryCount = 0;
    let remoteHeads = [] as ReturnType<typeof createHeadsFromContainer>;

    const localSnapshotBeforePull = await getStorageSnapshot();
    const localContainerBeforePull = localSnapshotBeforePull?.container ?? null;
    const stagedBeforePull = localSnapshotBeforePull?.staged ?? [];

    if (provider.capabilities.supportsPull) {
      if (!provider.pull) {
        return createRejectedResult({
          reason: "unsupported",
          conflicts: [
            {
              kind: "staged-entry-invalid-after-pull",
              message: `Storage provider '${provider.id}' does not implement pull.`,
            },
          ],
        });
      }

      try {
        const pulled = await provider.pull(activeStorageRef);
        remoteHeads = pulled.remoteHeads;

        if (localContainerBeforePull && !hasSameHead(localContainerBeforePull, pulled.snapshot.container)) {
          if (!isHeadIncluded(pulled.snapshot.container, localContainerBeforePull.head)) {
            return createRejectedResult({
              reason: "conflict",
              pulledEntryCount: 0,
              remoteHeads,
              conflicts: [
                {
                  kind: "remote-head-diverged",
                  message:
                    "Remote changes diverged from your committed head. Pull and reconcile before committing.",
                },
              ],
            });
          }

          pulledEntryCount = countNewEntries(localContainerBeforePull, pulled.snapshot.container);

          await storageAdapter.save({
            container: pulled.snapshot.container,
            staged: stagedBeforePull,
          });

          await replayPipeline({
            mode: "load",
            replay: { reason: "storage-pull" },
          });

          const remoteNewEntries = pulled.snapshot.entries.filter(
            (entry) => !localContainerBeforePull.entries[entry.entryId],
          );
          const conflicts = conflictsForEntries({
            staged: stagedBeforePull,
            remoteNew: remoteNewEntries,
          });

          if (conflicts.length > 0) {
            return createRejectedResult({
              reason: "conflict",
              conflicts,
              pulledEntryCount,
              remoteHeads,
            });
          }
        }
      } catch (error) {
        if (localSnapshotBeforePull) {
          await storageAdapter.save(localSnapshotBeforePull);
          await replayPipeline({ mode: "load", replay: { reason: "manual" } });
        }

        return createRejectedResult({
          reason: "provider-error",
          conflicts: [
            {
              kind: "staged-entry-invalid-after-pull",
              message: error instanceof Error ? error.message : "Storage pull failed.",
            },
          ],
          pulledEntryCount,
          remoteHeads,
        });
      }
    }

    let committedEntryIds: string[] = [];
    try {
      const committed = await concord.commit(inputValue);
      committedEntryIds = committed.entryIds;
      await replayPipeline({ replay: { reason: "commit" } });
    } catch (error) {
      return createRejectedResult({
        reason: "provider-error",
        conflicts: [
          {
            kind: "staged-entry-invalid-after-pull",
            message: error instanceof Error ? error.message : "Commit failed.",
          },
        ],
        pulledEntryCount,
        remoteHeads,
      });
    }

    let pushed = false;

    if (provider.capabilities.supportsPush) {
      if (!provider.push) {
        return createRejectedResult({
          reason: "unsupported",
          conflicts: [
            {
              kind: "staged-entry-invalid-after-pull",
              message: `Storage provider '${provider.id}' does not implement push.`,
            },
          ],
          pulledEntryCount,
          remoteHeads,
        });
      }

      const localSnapshot = await getStorageSnapshot();
      if (!localSnapshot?.container) {
        return createRejectedResult({
          reason: "provider-error",
          conflicts: [
            {
              kind: "staged-entry-invalid-after-pull",
              message: "Local storage snapshot is unavailable after commit.",
            },
          ],
          pulledEntryCount,
          remoteHeads,
        });
      }

      const snapshot = createLedgerSnapshot({
        workspaceId: activeStorageRef.workspaceId,
        container: localSnapshot.container,
      });

      const expectedHeads =
        remoteHeads.length > 0 ? remoteHeads : createHeadsFromContainer(localSnapshot.container);

      const pushResult = await provider.push({
        ref: activeStorageRef,
        snapshot,
        expectedHeads,
      });

      remoteHeads = pushResult.remoteHeads;

      if (!pushResult.accepted) {
        if (pushResult.rejectedReason === "head-mismatch") {
          return createRejectedResult({
            reason: "conflict",
            conflicts: [
              {
                kind: "provider-head-mismatch",
                message:
                  "Push was rejected because the remote head changed. Pull and retry the commit.",
              },
            ],
            pulledEntryCount,
            remoteHeads,
          });
        }

        return createRejectedResult({
          reason: "provider-error",
          conflicts: [
            {
              kind: "staged-entry-invalid-after-pull",
              message: "Push to storage provider failed.",
            },
          ],
          pulledEntryCount,
          remoteHeads,
        });
      }

      pushed = true;
    }

    if (remoteHeads.length === 0) {
      const latest = await getStorageSnapshot();
      if (latest?.container) {
        remoteHeads = createHeadsFromContainer(latest.container);
      }
    }

    return {
      status: "committed",
      committedEntryIds,
      pulledEntryCount,
      pushed,
      remoteHeads,
    };
  }

  return {
    concord,
    load() {
      return concord.load();
    },
    command(type, payload) {
      return concord.command(type, payload);
    },
    commit(inputValue) {
      return commitWithStorageSync(inputValue);
    },
    discard() {
      return concord.clearStaged();
    },
    replay(options) {
      return replayPipeline({
        replay: options,
      });
    },
    replayPipeline(options) {
      return replayPipeline(options);
    },
    loadWithReplayPipeline() {
      return replayPipeline({
        mode: "load",
        replay: { reason: "load" },
      });
    },
    async commandWithReplay(type, payload) {
      const result = await concord.command(type, payload);
      await replayPipeline({ replay: { reason: "command" } });
      return result;
    },
    async commitWithReplay(inputValue) {
      return await commitWithStorageSync(inputValue);
    },
    async discardWithReplay() {
      await concord.clearStaged();
      return await replayPipeline({ replay: { reason: "discard" } });
    },
    async importWithReplay(container) {
      await concord.importLedger(container);
      return await replayPipeline({ replay: { reason: "import" } });
    },
    getState() {
      return concord.getState();
    },
    getPluginState(pluginId) {
      return concord.getReplayState(pluginId);
    },
    select(pluginId, selectorId, ...args) {
      const selector = requireSelector(selectors, pluginId, selectorId);
      return selector(concord.getReplayState(pluginId), ...args);
    },
    subscribe(listener) {
      return concord.subscribe(listener);
    },
    destroy() {
      return concord.destroy();
    },
    getActiveStorageRef() {
      return { ...activeStorageRef, config: activeStorageRef.config ? { ...activeStorageRef.config } : undefined };
    },
    setActiveStorageRef(ref) {
      assertProviderRegistered(ref.providerId);
      activeStorageRef = {
        ...ref,
        config: ref.config ? { ...ref.config } : undefined,
      };
    },
    configureStorageSync(config, ref) {
      const provider = createStorageProviderFromConfig(config);
      if (!provider) {
        throw new Error(`Unsupported storage provider config '${config.providerId}'.`);
      }
      storageProviders.register(provider);

      if (ref) {
        assertProviderRegistered(ref.providerId);
        activeStorageRef = {
          ...ref,
          config: ref.config ? { ...ref.config } : undefined,
        };
      }
    },
    getStorageProvider(providerId: string) {
      return storageProviders.get(providerId);
    },
    getStorageCapabilities(providerId?: string) {
      const resolvedProviderId = providerId ?? activeStorageRef.providerId;
      return storageProviders.getCapabilities(resolvedProviderId);
    },
    listStorageProviders() {
      return storageProviders.list();
    },
    storageProviders,
  };
}

import { createConcordApp } from "@ternent/concord";
import type { AppProjectionPlugin, AppRuntime, AppSelector, CreateAppInput } from "./types";

type SelectorRegistry = Map<string, Map<string, AppSelector>>;

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

  async function replayPipeline(options?: {
    replay?: Parameters<typeof concord.replay>[0];
    mode?: "full" | "load";
  }): Promise<void> {
    const replayOptions = options?.replay;
    const isPartial = Boolean(replayOptions?.fromEntryId || replayOptions?.toEntryId);
    if (isPartial) {
      throw new Error("Partial replay is unsupported in MVP.");
    }

    if (!replayContext) {
      if (options?.mode === "load") {
        await concord.load();
      } else {
        await concord.replay(replayOptions);
      }
      return;
    }

    replayContext.beginReplayPipeline();

    try {
      replayContext.setPhase("system");
      if (options?.mode === "load") {
        await concord.load();
      } else {
        await concord.replay(replayOptions);
      }

      replayContext.setPhase("workspace");
      await concord.replay(replayOptions);
    } finally {
      replayContext.endReplayPipeline();
    }
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
      return concord.commit(inputValue);
    },
    discard() {
      return concord.clearStaged();
    },
    replay(options) {
      return concord.replay(options);
    },
    replayPipeline(options) {
      return replayPipeline(options);
    },
    loadWithReplayPipeline() {
      return replayPipeline({
        mode: "load",
      });
    },
    async commandWithReplay(type, payload) {
      const result = await concord.command(type, payload);
      await replayPipeline();
      return result;
    },
    async commitWithReplay(inputValue) {
      const result = await concord.commit(inputValue);
      await replayPipeline();
      return result;
    },
    async discardWithReplay() {
      await concord.clearStaged();
      await replayPipeline();
    },
    async importWithReplay(container) {
      await concord.importLedger(container);
      await replayPipeline();
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
  };
}

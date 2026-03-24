import type {
  ConcordApp,
  ConcordCommitInput,
  ConcordCommitResult,
  ConcordReplayOptions,
} from "@ternent/concord";
import type {
  LedgerVerificationResult,
} from "@ternent/ledger";
import {
  createSolidConcordApp,
} from "./app.js";
import {
  getSolidWebId,
} from "./identity.js";
import type {
  CreateSolidConcordAppOptions,
  CreateSolidConcordAppResult,
  SolidConcordManager,
  SolidConcordManagerState,
} from "./types.js";

function createInitialState(webId: string | null): SolidConcordManagerState {
  return {
    status: "idle",
    loading: false,
    ready: false,
    error: null,
    webId,
    identity: null,
    app: null,
    concordState: null,
    lastCommit: null,
    lastVerification: null,
  };
}

function deriveStatusFromConcordState(
  concordState: SolidConcordManagerState["concordState"],
): SolidConcordManagerState["status"] {
  if (!concordState) {
    return "idle";
  }

  if (concordState.ready) {
    return "ready";
  }

  if (!concordState.integrityValid) {
    return "error";
  }

  return "idle";
}

export function createSolidConcordManager(
  options: CreateSolidConcordAppOptions,
): SolidConcordManager {
  let state = createInitialState(
    options.session.info?.webId ? getSolidWebId(options.session) : null,
  );
  let appSubscription: (() => void) | null = null;
  let initPromise: Promise<CreateSolidConcordAppResult> | null = null;
  let currentApp: ConcordApp | null = null;
  const listeners = new Set<
    (nextState: Readonly<SolidConcordManagerState>) => void
  >();

  function publish(
    next:
      | SolidConcordManagerState
      | ((prev: SolidConcordManagerState) => SolidConcordManagerState),
  ) {
    state = typeof next === "function" ? next(state) : next;
    for (const listener of listeners) {
      listener(state);
    }
  }

  function bindApp(result: CreateSolidConcordAppResult) {
    currentApp = result.app;
    appSubscription?.();
    appSubscription = result.app.subscribe((concordState) => {
      const status = deriveStatusFromConcordState(concordState);
      publish((prev) => ({
        ...prev,
        app: result.app,
        identity: result.identity,
        concordState,
        ready: concordState.ready,
        status,
      }));
    });
  }

  async function ensureApp(): Promise<CreateSolidConcordAppResult> {
    if (!initPromise) {
      publish((prev) => ({
        ...prev,
        status: "loading",
        loading: true,
        error: null,
        webId: getSolidWebId(options.session),
      }));

      initPromise = createSolidConcordApp(options)
        .then(async (result) => {
          bindApp(result);
          await result.app.load();
          const concordState = result.app.getState();
          publish((prev) => ({
            ...prev,
            status: deriveStatusFromConcordState(concordState),
            loading: false,
            ready: concordState.ready,
            app: result.app,
            identity: result.identity,
            concordState,
            error: null,
          }));
          return result;
        })
        .catch((error: unknown) => {
          const normalized =
            error instanceof Error ? error : new Error(String(error));
          publish((prev) => ({
            ...prev,
            status: "error",
            loading: false,
            ready: false,
            error: normalized,
          }));
          throw normalized;
        })
        .finally(() => {
          initPromise = null;
        });
    }

    return await initPromise;
  }

  async function resolveApp(): Promise<ConcordApp> {
    if (currentApp) {
      return currentApp;
    }

    const result = await ensureApp();
    return result.app;
  }

  return {
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    init() {
      return ensureApp();
    },
    async reload() {
      const app = await resolveApp();
      publish((prev) => ({
        ...prev,
        status: "loading",
        loading: true,
        error: null,
      }));
      try {
        await app.load();
        const concordState = app.getState();
        publish((prev) => ({
          ...prev,
          status: deriveStatusFromConcordState(concordState),
          loading: false,
          ready: concordState.ready,
          concordState,
        }));
      } catch (error: unknown) {
        const normalized =
          error instanceof Error ? error : new Error(String(error));
        publish((prev) => ({
          ...prev,
          status: "error",
          loading: false,
          ready: false,
          error: normalized,
        }));
        throw normalized;
      }
    },
    async command(type, input) {
      const app = await resolveApp();
      const result = await app.command(type, input);
      publish((prev) => ({
        ...prev,
        concordState: app.getState(),
      }));
      return result;
    },
    async commit(input?: ConcordCommitInput): Promise<ConcordCommitResult> {
      const app = await resolveApp();
      const result = await app.commit(input);
      publish((prev) => ({
        ...prev,
        lastCommit: result,
        concordState: app.getState(),
      }));
      return result;
    },
    async replay(options?: ConcordReplayOptions) {
      const app = await resolveApp();
      await app.replay(options);
      publish((prev) => ({
        ...prev,
        concordState: app.getState(),
      }));
    },
    async verify(): Promise<LedgerVerificationResult> {
      const app = await resolveApp();
      const result = await app.verify();
      publish((prev) => ({
        ...prev,
        lastVerification: result,
        concordState: app.getState(),
      }));
      return result;
    },
    async destroy() {
      appSubscription?.();
      appSubscription = null;

      if (currentApp) {
        await currentApp.destroy();
      }

      currentApp = null;
      publish(createInitialState(options.session.info?.webId ?? null));
    },
  };
}

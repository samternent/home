import { reactive } from "vue";
import {
  createConcordApp,
  type ConcordApp,
  type ConcordPlugin,
} from "@ternent/concord";
import type {
  LedgerArmourContract,
  LedgerContainer,
  LedgerReplayEntry,
  LedgerStorageAdapter,
  LedgerVerificationResult,
} from "@ternent/ledger";
import { createLedger } from "@ternent/ledger";
import { createSealHash } from "@ternent/seal-cli";
import type { SerializedIdentity } from "@ternent/identity";

type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
};

type TodoPluginState = {
  items: Record<string, TodoItem>;
  order: string[];
};

type AuditPluginState = {
  privateNotes: number;
};

type TamperScenario =
  | "none"
  | "entry-payload"
  | "reorder-commit-entries"
  | "break-parent-link"
  | "corrupt-payload-hash"
  | "corrupt-commit-proof";

type TamperAction = {
  id: Exclude<TamperScenario, "none">;
  label: string;
  description: string;
};

type TamperMutationResult = {
  artifact: LedgerContainer;
  highlightedPaths: string[];
};

type DemoState = {
  ready: boolean;
  isBooting: boolean;
  isMutating: boolean;
  pendingTitle: string;
  stagedCount: number;
  todos: TodoItem[];
  baseLedgerArtifact: LedgerContainer | null;
  ledgerArtifact: LedgerContainer | null;
  verification: LedgerVerificationResult | null;
  selectedTamper: TamperScenario;
  highlightedPaths: string[];
  error: string;
};

const demoIdentity: SerializedIdentity = {
  format: "ternent-identity",
  version: "2",
  algorithm: "Ed25519",
  createdAt: "2026-03-16T00:00:00.000Z",
  publicKey: "6IBjlSqvqPfmXohZXC-oqbjX71wHutV9vvrRtw5VrUE",
  keyId: "f34b06f6ffee32599d0e3f49bbee43baf4018ab07378b505da8c778f766096b8",
  material: {
    kind: "seed",
    seed: "u7XruZ6e2gC5owNbLcZEqRFbgD8GPrqjyn-l5-SIz64",
  },
};

const state = reactive<DemoState>({
  ready: false,
  isBooting: false,
  isMutating: false,
  pendingTitle: "",
  stagedCount: 0,
  todos: [],
  baseLedgerArtifact: null,
  ledgerArtifact: null,
  verification: null,
  selectedTamper: "none",
  highlightedPaths: [],
  error: "",
});

let app: ConcordApp | null = null;
let bootstrapPromise: Promise<void> | null = null;
let unsubscribe: (() => void) | null = null;

const storage = createMemoryStorage();
const now = createDemoClock("2026-03-18T09:20:00.000Z");
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const tamperActions: TamperAction[] = [
  {
    id: "entry-payload",
    label: "Tamper entry payload",
    description: "Mutate a committed todo payload and break entry identity.",
  },
  {
    id: "reorder-commit-entries",
    label: "Reorder commit entries",
    description: "Change ordered entry IDs inside a signed commit subject.",
  },
  {
    id: "break-parent-link",
    label: "Break parent link",
    description: "Point a commit at the wrong parent and break the chain.",
  },
  {
    id: "corrupt-payload-hash",
    label: "Corrupt payload hash",
    description: "Invalidate an encrypted entry's payload hash.",
  },
  {
    id: "corrupt-commit-proof",
    label: "Corrupt commit proof",
    description:
      "Modify commit signature material without changing the subject.",
  },
];

function createDemoClock(startIso: string) {
  let tick = 0;
  const base = new Date(startIso).getTime();
  return () => new Date(base + tick++ * 1000).toISOString();
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
}

function hexToBytes(value: string) {
  const normalized = value.startsWith("age-demo:")
    ? value.slice("age-demo:".length)
    : value;
  const bytes = new Uint8Array(normalized.length / 2);

  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }

  return bytes;
}

function createMemoryStorage(): LedgerStorageAdapter & {
  snapshot: { container: LedgerContainer | null; staged: unknown[] } | null;
} {
  return {
    name: "memory",
    snapshot: null,
    async load() {
      return this.snapshot;
    },
    async save(snapshot) {
      this.snapshot = structuredClone(snapshot);
    },
    async clear() {
      this.snapshot = null;
    },
  };
}

const demoArmour: LedgerArmourContract = {
  async encrypt(input) {
    const data = `age-demo:${bytesToHex(input.data)}`;
    return {
      data,
      payloadHash: await createSealHash(textEncoder.encode(data)),
    };
  },
  async decrypt(input) {
    return JSON.parse(
      textDecoder.decode(hexToBytes(input.payload.data)),
    ) as unknown;
  },
};

function createTodoPlugin(): ConcordPlugin<TodoPluginState> {
  return {
    id: "todo",
    initialState() {
      return {
        items: {},
        order: [],
      };
    },
    commands: {
      "todo.create-item": async (
        _ctx,
        input: { id: string; title: string },
      ) => ({
        kind: "todo.item.created",
        meta: {
          pluginId: "todo",
          command: "todo.create-item",
        },
        payload: {
          id: input.id,
          title: input.title,
          completed: false,
        },
      }),
      "todo.complete-item": async (ctx, input: { id: string }) => ({
        kind: "todo.item.completed",
        meta: {
          pluginId: "todo",
          command: "todo.complete-item",
        },
        payload: {
          id: input.id,
          completedAt: ctx.now(),
        },
      }),
    },
    project(currentState, entry) {
      if (
        entry.kind === "todo.item.created" &&
        entry.payload.type === "plain"
      ) {
        const payload = entry.payload.data as {
          id: string;
          title: string;
          completed: boolean;
        };

        return {
          items: {
            ...currentState.items,
            [payload.id]: {
              id: payload.id,
              title: payload.title,
              completed: payload.completed,
              completedAt: null,
            },
          },
          order: currentState.order.includes(payload.id)
            ? currentState.order
            : [...currentState.order, payload.id],
        };
      }

      if (
        entry.kind === "todo.item.completed" &&
        entry.payload.type === "plain"
      ) {
        const payload = entry.payload.data as {
          id: string;
          completedAt: string;
        };
        const item = currentState.items[payload.id];
        if (!item) {
          return currentState;
        }

        return {
          items: {
            ...currentState.items,
            [payload.id]: {
              ...item,
              completed: true,
              completedAt: payload.completedAt,
            },
          },
          order: currentState.order,
        };
      }

      return currentState;
    },
  };
}

function createAuditPlugin(): ConcordPlugin<AuditPluginState> {
  return {
    id: "audit",
    initialState() {
      return {
        privateNotes: 0,
      };
    },
    commands: {
      "audit.write-private-note": async (
        _ctx,
        input: { text: string; recipients: string[] },
      ) => ({
        kind: "audit.private-note.recorded",
        meta: {
          pluginId: "audit",
          command: "audit.write-private-note",
        },
        payload: {
          text: input.text,
        },
        protection: {
          type: "recipients",
          recipients: input.recipients,
          encoding: "armor",
        },
      }),
    },
    project(currentState, entry) {
      if (entry.kind !== "audit.private-note.recorded") {
        return currentState;
      }

      return {
        privateNotes: currentState.privateNotes + 1,
      };
    },
  };
}

function findCommitWithMultipleEntries(container: LedgerContainer) {
  return Object.values(container.commits).find(
    (commit) => commit.entryIds.length > 1,
  );
}

function findCommitWithParent(container: LedgerContainer) {
  return Object.values(container.commits).find(
    (commit) =>
      typeof commit.parentCommitId === "string" &&
      commit.parentCommitId.length > 0,
  );
}

function findEncryptedEntry(container: LedgerContainer) {
  return Object.values(container.entries).find(
    (entry) => entry.payload.type === "encrypted",
  );
}

function applyTamperScenario(
  artifact: LedgerContainer,
  scenario: TamperScenario,
): TamperMutationResult {
  const nextArtifact = structuredClone(artifact);

  if (scenario === "none") {
    return {
      artifact: nextArtifact,
      highlightedPaths: [],
    };
  }

  if (scenario === "entry-payload") {
    const targetEntryId =
      findCommitWithMultipleEntries(nextArtifact)?.entryIds[0] ??
      Object.keys(nextArtifact.entries)[0];
    const targetEntry = targetEntryId
      ? nextArtifact.entries[targetEntryId]
      : null;
    if (!targetEntry || targetEntry.payload.type !== "plain") {
      return {
        artifact: nextArtifact,
        highlightedPaths: [],
      };
    }

    targetEntry.payload = {
      type: "plain",
      data: {
        ...(targetEntry.payload.data as Record<string, unknown>),
        title: "Buy tea instead",
      },
    };

    return {
      artifact: nextArtifact,
      highlightedPaths: [
        `ledger/entries/${targetEntryId}`,
        `ledger/entries/${targetEntryId}/payload`,
        `ledger/entries/${targetEntryId}/payload/data/title`,
      ],
    };
  }

  if (scenario === "reorder-commit-entries") {
    const targetCommit = findCommitWithMultipleEntries(nextArtifact);
    if (!targetCommit) {
      return {
        artifact: nextArtifact,
        highlightedPaths: [],
      };
    }

    targetCommit.entryIds = [...targetCommit.entryIds].reverse();

    return {
      artifact: nextArtifact,
      highlightedPaths: [
        `ledger/commits/${targetCommit.commitId}`,
        `ledger/commits/${targetCommit.commitId}/entryIds`,
      ],
    };
  }

  if (scenario === "break-parent-link") {
    const targetCommit = findCommitWithParent(nextArtifact);
    if (!targetCommit) {
      return {
        artifact: nextArtifact,
        highlightedPaths: [],
      };
    }

    targetCommit.parentCommitId = "commit_missing_parent";

    return {
      artifact: nextArtifact,
      highlightedPaths: [
        `ledger/commits/${targetCommit.commitId}`,
        `ledger/commits/${targetCommit.commitId}/parentCommitId`,
      ],
    };
  }

  if (scenario === "corrupt-payload-hash") {
    const targetEntry = findEncryptedEntry(nextArtifact);
    if (!targetEntry || targetEntry.payload.type !== "encrypted") {
      return {
        artifact: nextArtifact,
        highlightedPaths: [],
      };
    }

    targetEntry.payload = {
      ...targetEntry.payload,
      payloadHash: "sha256:tampered-payload-hash",
    };

    return {
      artifact: nextArtifact,
      highlightedPaths: [
        `ledger/entries/${targetEntry.entryId}`,
        `ledger/entries/${targetEntry.entryId}/payload`,
        `ledger/entries/${targetEntry.entryId}/payload/payloadHash`,
      ],
    };
  }

  const targetCommit =
    findCommitWithParent(nextArtifact) ??
    Object.values(nextArtifact.commits)[0];
  if (!targetCommit) {
    return {
      artifact: nextArtifact,
      highlightedPaths: [],
    };
  }

  targetCommit.seal = {
    ...targetCommit.seal,
    signature: "tampered-commit-signature",
  };

  return {
    artifact: nextArtifact,
    highlightedPaths: [
      `ledger/commits/${targetCommit.commitId}`,
      `ledger/commits/${targetCommit.commitId}/seal`,
      `ledger/commits/${targetCommit.commitId}/seal/signature`,
    ],
  };
}

async function verifyArtifact(
  artifact: LedgerContainer,
): Promise<LedgerVerificationResult> {
  const ledger = await createLedger<LedgerReplayEntry[]>({
    identity: demoIdentity,
    initialProjection: [],
    projector: (entries, entry) => [...entries, entry],
    replayPolicy: {
      verify: false,
      decrypt: false,
    },
  });

  try {
    await ledger.load(artifact);
    return await ledger.verify();
  } finally {
    await ledger.destroy();
  }
}

function syncProjectedState() {
  if (!app) {
    state.ready = false;
    state.todos = [];
    return;
  }

  const appState = app.getState();
  const todoState = app.getPluginState<TodoPluginState>("todo");

  state.ready = appState.ready && appState.integrityValid;
  state.stagedCount = appState.stagedCount;
  state.todos = todoState.order
    .map((id) => todoState.items[id])
    .filter((item): item is TodoItem => Boolean(item));
}

async function refreshArtifactAndVerification() {
  if (!app) return;

  const baseLedgerArtifact = await app.exportLedger();
  const mutation = applyTamperScenario(
    baseLedgerArtifact,
    state.selectedTamper,
  );
  const verification = await verifyArtifact(mutation.artifact);

  state.baseLedgerArtifact = baseLedgerArtifact;
  state.highlightedPaths = mutation.highlightedPaths;
  state.ledgerArtifact = mutation.artifact;
  state.verification = verification;
}

function nextTodoId() {
  const highest = state.todos.reduce((max, todo) => {
    const numeric = Number(todo.id.replace(/^todo_/, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);

  return `todo_${String(highest + 1).padStart(3, "0")}`;
}

async function seedInitialTodos() {
  if (!app || state.todos.length > 0) {
    return;
  }

  await app.command("todo.create-item", {
    id: "todo_001",
    title: "Buy milk",
  });
  await app.command("todo.create-item", {
    id: "todo_002",
    title: "Review portable ledger",
  });
  await app.commit({
    metadata: {
      message: "Seed landing demo todos",
    },
  });

  await app.command("todo.complete-item", {
    id: "todo_002",
  });
  await app.command("audit.write-private-note", {
    text: "Landing demo integrity check",
    recipients: ["age1demoportableledgerartifact"],
  });
  await app.commit({
    metadata: {
      message: "Complete review and store private audit note",
    },
  });
}

async function initializeDemo() {
  if (app) {
    return;
  }

  state.isBooting = true;
  state.error = "";

  try {
    app = await createConcordApp({
      identity: demoIdentity,
      storage,
      armour: demoArmour,
      plugins: [createTodoPlugin(), createAuditPlugin()],
    });

    unsubscribe?.();
    unsubscribe = app.subscribe(() => {
      syncProjectedState();
    });

    if (storage.snapshot) {
      await app.load();
    } else {
      await app.create({
        metadata: {
          appId: "concord-landing-demo",
          runtime: "concord",
          surface: "landing-page",
        },
      });
    }

    syncProjectedState();
    await seedInitialTodos();
    syncProjectedState();
    await refreshArtifactAndVerification();
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
  } finally {
    state.isBooting = false;
  }
}

async function ensureStarted() {
  bootstrapPromise ??= initializeDemo();
  await bootstrapPromise;
}

async function addTodo() {
  const title = state.pendingTitle.trim();
  if (!title || state.isMutating) {
    return;
  }

  await ensureStarted();
  if (!app) {
    return;
  }

  state.isMutating = true;
  state.error = "";

  try {
    await app.command("todo.create-item", {
      id: nextTodoId(),
      title,
    });
    state.pendingTitle = "";
    syncProjectedState();
    await refreshArtifactAndVerification();
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
  } finally {
    state.isMutating = false;
  }
}

async function commitStaged() {
  if (state.stagedCount === 0 || state.isMutating) {
    return;
  }

  await ensureStarted();
  if (!app) {
    return;
  }

  state.isMutating = true;
  state.error = "";

  try {
    await app.commit({
      metadata: {
        message:
          state.stagedCount === 1
            ? "Commit staged todo change"
            : `Commit ${state.stagedCount} staged todo changes`,
      },
    });
    syncProjectedState();
    await refreshArtifactAndVerification();
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
  } finally {
    state.isMutating = false;
  }
}

async function completeTodo(id: string, checked: boolean | "indeterminate") {
  if (checked !== true || state.isMutating) {
    return;
  }

  await ensureStarted();
  if (!app) {
    return;
  }

  const todo = state.todos.find((item) => item.id === id);
  if (!todo || todo.completed) {
    return;
  }

  state.isMutating = true;
  state.error = "";

  try {
    await app.command("todo.complete-item", { id });
    syncProjectedState();
    await refreshArtifactAndVerification();
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
  } finally {
    state.isMutating = false;
  }
}

async function setTamperScenario(nextScenario: TamperScenario) {
  if (state.isBooting || state.isMutating) {
    return;
  }

  await ensureStarted();
  if (!state.baseLedgerArtifact && !app) {
    return;
  }

  state.isMutating = true;
  state.error = "";
  state.selectedTamper = nextScenario;

  try {
    await refreshArtifactAndVerification();
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
  } finally {
    state.isMutating = false;
  }
}

async function resetTamperScenario() {
  await setTamperScenario("none");
}

export function useConcordLandingDemo() {
  return {
    state,
    tamperActions,
    ensureStarted,
    addTodo,
    commitStaged,
    completeTodo,
    setTamperScenario,
    resetTamperScenario,
  };
}

void ensureStarted();

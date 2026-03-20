# `@ternent/concord`

Command-driven replay runtime for building non-custodial applications on top of `@ternent/ledger`.

Concord is replay-first:

- ledger history is truth
- replay is the primary abstraction
- replay plugins are the only replay consumer type
- state, reactivity, databases, and indexes are all projection

```ts
import {
  createConcordApp,
  type ConcordReplayPlugin,
} from "@ternent/concord";

const todoPlugin: ConcordReplayPlugin<{
  items: Record<string, { id: string; title: string; completed: boolean }>;
}> = {
  id: "todo",
  initialState() {
    return { items: {} };
  },
  commands: {
    "todo.create-item": async (_ctx, input: { id: string; title: string }) => ({
      kind: "todo.item.created",
      payload: input,
    }),
  },
  applyEntry(entry, ctx) {
    if (entry.kind !== "todo.item.created" || entry.payload.type !== "plain") {
      return;
    }

    const payload = entry.payload.data as { id: string; title: string };
    ctx.setState((state) => ({
      items: {
        ...state.items,
        [payload.id]: {
          id: payload.id,
          title: payload.title,
          completed: false,
        },
      },
    }));
  },
};

const app = await createConcordApp({
  identity,
  storage,
  plugins: [todoPlugin],
});

await app.load();

await app.command("todo.create-item", {
  id: crypto.randomUUID(),
  title: "Buy milk",
});

await app.commit({
  metadata: {
    message: "Create first todo",
  },
});

const todoState = app.getReplayState("todo");
```

## Identity

The app passes a single `SerializedIdentity` into Concord:

```ts
const app = await createConcordApp({
  identity,
  storage,
  plugins,
});
```

Concord derives author, signer, and decrypt capability internally. Command handlers receive the same high-level `SerializedIdentity` at `ctx.identity`. Ledger-facing identity adaptation stays private to Concord.

## Replay Plugins

Replay plugins are the only replay consumer type.

- a replay plugin may keep replay-derived state with `initialState()` and `ctx.setState(...)`
- a replay plugin may materialize into external systems like Loki, Vue refs, React stores, or IndexedDB
- commands remain typed entry producers

`reset` has a narrow meaning:

- `reset` prepares plugin-local replay workspace for a new replay pass
- `reset` does not imply clearing previously published external surfaces
- if a plugin needs external atomic swap behavior, that belongs to the plugin and usually happens in `endReplay`

Concord only guarantees atomicity at the published Concord state boundary. External projection atomicity is plugin-owned.

## Replay And Integrity

The core lifecycle is:

1. `command(...)` stages one or more entries
2. local replay reflects committed truth plus staged truth
3. `commit(...)` groups staged entries into a signed commit
4. replay rebuilds published runtime state from that history

Concord treats committed history as atomic truth. If any reachable committed byte is invalid, Concord does not present the runtime state as trustworthy.

## Partial Replay

Concord supports ranged replay options:

```ts
await app.replay({
  fromEntryId: "entry_a",
  toEntryId: "entry_b",
});
```

Two distinctions matter:

- replay of any ordered slice is deterministic
- authoritative full-state reconstruction still requires replay from genesis or a valid checkpoint

That distinction is intentional. Partial replay metadata exists so Concord stays compatible with future timeline scrubbing and replay-slider UX without redesigning the plugin contract.

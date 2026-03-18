# `@ternent/concord`

Command-driven developer runtime for building non-custodial apps on top of `@ternent/ledger`.

```ts
import { createConcordApp } from "@ternent/concord";

const app = await createConcordApp({
  identity,
  storage,
  plugins: [createTodoPlugin()]
});

await app.load();

await app.command("todo.create-item", {
  id: crypto.randomUUID(),
  title: "Buy milk"
});

await app.command("todo.rename-item", {
  id: "todo_123",
  title: "Buy oat milk"
});

await app.commit({
  metadata: {
    message: "Create and refine first todo"
  }
});

const todoState = app.getPluginState("todo");
```

Concord keeps Ledger as the truth engine. Plugins own command ergonomics and projection logic, while commits remain explicit authored history boundaries.

Concord treats committed history as atomic truth. If any committed byte in reachable history is invalid, the document is globally invalid for normal runtime use, even though verification still reports the precise broken commits or entries.

The core lifecycle is:

1. `command(...)` stages one or more entries
2. local replay reflects committed truth plus staged truth
3. `commit(...)` groups staged entries into a signed commit with contextual metadata
4. replay rebuilds app state from that history

Entries carry domain meaning. Signed commits carry chain integrity.

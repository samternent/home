# AI Rules - Replay Layer

- Replay is the primary abstraction. State is a derived output.
- Support active-ledger replay now and keep multi-ledger composition extensible.
- For phase 1, support many ledgers in the workspace but one active projection at a time.
- Treat multi-ledger composition as deferred.
- Keep replay deterministic, idempotent, and safe to rebuild from scratch.
- Filtering by author, trust policy, commit kind, and timeline belongs here.
- Every replay result should be inspectable, comparable, cacheable, and explainable through `Projection<TState>`.
- Do not let hosted apps invent their own replay engines.

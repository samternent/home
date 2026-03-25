# AI Rules - Hosted Apps Layer

- Hosted apps own views and command interfaces over ledger-backed state.
- They must not mutate truth outside Concord commands.
- They must consume replayed state from the runtime rather than owning independent storage flows.
- Shared system affordances such as history, verify, compare, and open-with should come from shared services.
- Do not introduce a hosted app until the core workspace, explorer, terminal, and replay contracts are stable enough to support it without special cases.

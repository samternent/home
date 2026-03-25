# AI Rules - Run Runtime

- Treat this tree as the target architecture for `run.ternent.dev`.
- Treat this tree as the active implementation home, not just a destination scaffold.
- Keep layers strict: storage, ledger, replay, schema, workspace, services, surfaces, hosted-apps.
- UI routes and components must not talk directly to Solid adapters when a workspace service can own that boundary.
- Hosted apps emit Concord commands and consume replay output. They do not own truth or storage policy.
- Multi-ledger replay belongs in `replay` and `workspace`, never inside a specific hosted app.
- Generic history, verification, compare, and open-with behavior belongs in `services`, not app-specific folders.
- Explorer and terminal are first-class surfaces and should evolve through surface contracts rather than route-local state.
- All UI must use `ternent-ui` primitives and patterns.
- Keep implementation additive and layer-owned rather than rebuilding a monolithic shell.

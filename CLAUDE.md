# CLAUDE.md

Concord development ethos (workspace currently implemented under `apps/solid`):
- Keep architecture ledger-first: commands append entries; replay builds state.
- Prefer app-level fixes before core-runtime changes (`@ternent/concord`, `@ternent/ledger`).
- Security defaults: signer/actor integrity, explicit authz in command handlers, deterministic replay.
- Use typed boundaries: `useAppApi -> typed method -> plugin command`; avoid raw UI command calls.
- Use `ternent-ui` for runtime surfaces and follow Concord principles over convenience hacks.

# LLM Context - Run Runtime

Target product statement:

- A workspace runtime for mounted ledger-backed resources
- Built on Solid for storage and Concord for deterministic replay
- Library, terminal, and hosted apps are separate surfaces over the same workspace state

Important constraints:

- Storage is persistence, never truth.
- Ledgers are truth.
- Replay is the core abstraction.
- Schema packages define meaning.
- In phase 1, plugin packages contain schemas, apps, commands, and inspectors.
- Phase 1 supports multiple ledgers in the workspace, but one active projection at a time.
- Hosted apps explain the domain and emit commands.
- Shared services explain history, trust, and comparison.
- All mutations happen via commands.
- All interfaces operate on the same workspace state.
- Verification is mandatory. Unverified history is not valid runtime input.
- Solid login provisions the Concord identity used for signing and verification.

Migration note:

- `src/modules/run` is the implementation home.
- Do not reintroduce a catch-all shell/runtime module outside this tree.

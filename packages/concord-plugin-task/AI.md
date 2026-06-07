# AI Guidance

Guardrails for this package:

- Keep this package focused on task replay, command payload validation, and ledger compatibility checks.
- Do not add storage, routing, Vue, or hosted-app UI concerns here.
- Concord replay truth is the source of task state. Never add mutable client-side caches that outrun replay.
- Empty ledgers are task-compatible in v1. Mixed-domain ledgers are not.
- Read-only inspection must remain possible without identity. Only commands depend on signer context.
- If a future change widens the domain, update compatibility rules deliberately instead of silently treating unknown entry kinds as task-safe.

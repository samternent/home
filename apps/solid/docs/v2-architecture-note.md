# v2 Architecture Note

The active route slice is:

- `/`
- `/permissions`

All other routes are intentionally inactive and redirect to `/`.

## Concord-First Host

`apps/solid` v2 is a thin host over `@ternent/concord`:

- source of truth: `replay(committed + staged)`
- no direct mutation path
- no persisted derived projection state

Host entrypoints:

- `src/app/runtime/createApp.ts`
- `src/app/api/useAppApi.ts`
- `src/app/plugins/users.ts`
- `src/app/plugins/permissions.ts`

## State Rules

- replay ordering is fixed:
1. committed entries (canonical ledger order)
2. staged entries (in insertion order)
- replay runs after `command`, `commit`, and `discard`
- published state is atomically replaced (never in-place mutated)

## Active DX Surface

- writes: `app.command(...)` via typed wrappers
- reads: `app.select(...)` via typed wrappers
- wrappers:
- `app.users.create`
- `app.users.updateProfile`
- `app.users.addToEncryptionGroup`
- `app.users.removeFromEncryptionGroup`
- `app.permissions.create`
- `app.permissions.grant`
- `app.permissions.revoke`

## Legacy Isolation

Legacy modules and route chains are still present in the repo for migration work, but they are not part of the active v2 router/runtime path in this phase.

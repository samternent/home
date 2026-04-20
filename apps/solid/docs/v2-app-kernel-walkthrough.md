# v2 App Kernel Walkthrough

This guide explains how to build on top of the current v2 kernel in `apps/solid/src`.

It focuses on:

- how the parts fit together
- how to add features safely
- how to get value from commands, ledger, and replay
- concrete code examples you can copy

## 1) Mental Model

The active flow is:

`routes/v2 -> app/api -> core`

- `routes/v2/*`: UI and interaction only (thin)
- `app/api/*`: application kernel and composition point
- `core/*`: session/users/workspace/document/permissions primitives

Use this rule of thumb:

- reads: `appApi.users.listUsers()`, `appApi.permissions.listPermissions()`, plus replay projections
- writes: `appApi.commands.execute({ command: ... })`

That gives you one mutation path, one ledger path, and one replay source.

## 2) What Each App API Section Does

`AppApi` lives in `src/app/api/types.ts` and includes:

- `identity`: active identity lifecycle (`ensureActiveIdentity`, etc.)
- `users`: persisted Concord identities + profile metadata + encryption group membership
- `workspace`: active workspace selection state
- `permissions`: permission reads + direct core command execution
- `commands`: canonical mutation entrypoint with typed success/failure result
- `ledger`: append-only persisted command history
- `replay`: projection over ledger records

## 3) Command Execution Flow

When a route calls:

```ts
const result = appApi.commands.execute({
  command: {
    type: "permission.create",
    title: "Editors",
  },
});
```

The kernel does this:

1. Builds an envelope (command id, issuedAt, actor identity)
2. Dispatches to the installed domain handler for that command type
3. If successful, writes a ledger record with command payload + output
4. Returns a typed result:

- success: `{ ok: true, envelope, output, record }`
- failure: `{ ok: false, envelope, error }`

Use this exact result in UI instead of catching thrown errors in routes.

## 4) Building a New Route on Top of the Kernel

Minimal pattern:

```ts
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppApi } from "@/app/api";

const appApi = useAppApi();
const error = ref<string | null>(null);

onMounted(() => {
  appApi.identity.ensureActiveIdentity();
});

function createPermission(title: string) {
  error.value = null;
  const result = appApi.commands.execute({
    command: { type: "permission.create", title },
  });

  if (!result.ok) {
    error.value = result.error.message;
    return;
  }

  // read refreshed list from appApi.permissions.listPermissions()
}
</script>
```

Route responsibilities stay simple:

- capture user input
- call `commands.execute`
- show validation errors
- refresh local view state from read APIs

## 5) Adding a New Command (Step-by-Step)

Example: new command `permission.rename`.

1. Extend command union in `src/core/permissions/types.ts`.
2. Implement handling in `src/core/permissions/usePermissionsCore.ts`.
3. If it belongs in app-level command execution:
- ensure `AppCommand` includes it (via core union import)
- ensure dispatch in `src/app/api/useAppApi.ts` reaches core handler
4. If replay needs extra projection behavior, update replay logic in `useAppApi.ts`.
5. Add v2 contract tests under `src/tests/v2`.

Keep command payloads deterministic and small. Avoid putting transient UI state in commands.

## 6) Ledger and Replay: How to Use Them

Ledger is persisted local history (`solid/app/ledger/v1` by default).

- API: `appApi.ledger.records`, `appApi.ledger.clear()`
- records include: envelope metadata + command payload + command output

Replay summarizes history:

```ts
const projection = appApi.replay.project(appApi.ledger.records.value);

// projection fields:
// userEvents, permissionEvents, totalEvents,
// lastCommandId, userCount, permissionCount
```

Current replay is event/output folding, not full state reconstruction from first principles. It is intentionally lightweight for v2.

## 7) Testing Pattern That Scales

Use dependency injection on `createAppApi(...)` so tests are deterministic.

```ts
const appApi = createAppApi({
  sessionCore,
  workspaceCore,
  permissionsCore,
  ledgerStorage: memoryStorage,
  ledgerStorageKey: "test/ledger",
});
```

Recommended test layers:

1. core tests (validation + invariants)
2. app contract tests (command result, ledger append, replay projection)
3. route tests (interaction wiring only)

## 8) Identity and Permission Invariants

Two important runtime invariants already enforced:

- active identity must exist for permission mutations
- active identity cannot be revoked from an existing permission
- ensuring active identity persists/updates a matching user in `core/users`

In practice, call `appApi.identity.ensureActiveIdentity()` on route/app mount before running command flows.

## 9) Getting the Most Out of This Architecture

- Keep routes thin; do not move domain logic into components.
- Use `commands.execute` for all mutations to keep ledger complete.
- Use `users` for user lookup, profile metadata, and encryption-group membership.
- Use `permissions` facade plus replay projections for route reads.
- Keep replay projection cheap and additive; don’t overload it with UI-specific formatting.
- Prefer injecting dependencies in tests rather than mocking deep module internals.
- Install business-domain projection plugins only when a real route/use case needs them.

## 10) Current Boundaries and Next Good Upgrades

Current v2 is intentionally local-first and minimal.

Natural next upgrades:

1. Persist document state and ledger with versioned migration strategy.
2. Add optional command idempotency checks (`commandId` dedupe) in ledger append path.
3. Add signed ledger records through Concord crypto/signing integration.
4. Add richer replay projections only when a real view needs them.

If you follow these constraints, you get a clean app-level API without returning to the old complexity.

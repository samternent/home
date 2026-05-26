# AGENTS.md

## Project Frame

You are working on `run.ternent.dev`, a Concord-aligned local-first runtime.

Do not treat this as a normal CRUD app.  
Do not treat Tasks as the product.  
Do not treat Solid as the architecture.

The product is a runtime built around:

- command execution
- staged entries
- explicit commit/discard
- signed append-only ledger history
- deterministic replay
- encrypted privacy groups
- replaceable storage providers
- internal workspace apps registered through a local registry

## Core Mental Model

The ledger is the source of truth.

State is never primary. State is a projection produced by replay.

A command should produce an entry.  
An entry should be replayable.  
A projection should be disposable and rebuildable.

Before implementing or changing behavior, ask:

> Could I delete all derived state, replay the ledger, and get the same result?

If the answer is no, the implementation is probably wrong.

## Runtime Replay Contract

System replay is part of the runtime contract.

The runtime uses a double-pass replay model:

### Pass 1: System Replay

System replay builds runtime infrastructure:

- identity
- users
- profiles
- privacy groups
- grant keys
- encryption/decryption context
- future system-level replay types

### Pass 2: Workspace Replay

Workspace replay derives app state using the context produced by system replay.

Workspace apps include:

- Tasks
- future internal workspace surfaces

Do not bypass the replay pipeline.

Do not add one-off replay behavior in route components, UI components, or app-specific services.

## Privacy Groups

Permissions are encrypted privacy groups.

They are not UI roles.  
They are not ordinary ACLs.  
They are not just labels.

A user without access should not know:

- that a group exists
- what it is called
- who is in it
- which tasks belong to it
- any meaningful metadata about it

The privacy picker should only show groups the current user can decrypt.

Group metadata should be encrypted or represented only as opaque undecryptable data to non-members.

Plain group titles, member lists, or meaningful metadata visible to non-members are correctness bugs.

## Grants And Revocation

Historical transparency is intentional.

If a user is granted access to a privacy group later, they should be able to decrypt historical group entries.

For MVP, revocation means:

- remove future active membership
- prevent future writes
- prevent future group mutations
- do not promise historical erasure
- do not implement key rotation yet

Keep these concepts separate:

- historical grant exists
- viewer has decryptability
- viewer is an active member
- viewer can write future entries

Do not use historical grant existence alone as proof of future write permission.

## Tasks App

Tasks is the first internal workspace app.

Tasks should own:

- task commands
- task replay behavior
- task projections
- task list surface
- task board surface
- task-specific UI

Tasks should not own:

- privacy group semantics
- permission grant rules
- encryption policy
- decryption key discovery
- identity rules
- storage-provider behavior

Those belong to runtime/system infrastructure.

Apps are currently registered locally in code.  
Do not build a dynamic or remote plugin system yet.

## Storage

Storage is replaceable infrastructure.

Do not couple runtime behavior to Solid, local storage, or any single provider.

Storage adapters may persist ledger material, but they are not the source of truth. The signed append-only ledger and deterministic replay model are the source of truth.

## Implementation Rules

Prefer explicit runtime contracts over clever abstractions.

Prefer deterministic replay tests over UI-only tests.

Hide undecryptable data at the projection/API level, not only in components.

Keep clear separation between:

- committed ledger entries
- staged entries
- replay context
- derived projections
- UI selectors
- storage adapters

## Before Making A Change

Verify that the change preserves:

1. deterministic replay
2. actor/signature correctness
3. staged/commit/discard semantics
4. non-member invisibility
5. retroactive group readability after grant
6. future-write prevention after revoke
7. storage-provider independence
8. Tasks as an internal app, not the runtime itself

## Testing Expectations

Add or update tests for architecture-relevant behavior.

Important test areas:

- system replay always runs before workspace replay
- derived projections rebuild correctly from ledger entries
- staged entries behave consistently before and after commit
- discard removes staged effects
- non-members cannot see privacy group metadata
- non-members cannot see encrypted task contents
- newly granted users can read historical group entries
- revoked users cannot write future group entries
- actor spoofing is rejected
- storage changes do not alter replay behavior

## Avoid

Do not introduce:

- dynamic third-party plugin loading
- remote plugin installation
- key rotation
- server-side ACL assumptions
- Solid-specific runtime assumptions
- direct projection mutation from UI
- privacy checks that only happen in components
- command handlers that cannot be deterministically replayed

## Definition Of Success

A successful change makes the runtime:

- more explicit
- more replayable
- more privacy-correct
- less coupled to storage
- easier to extend with additional internal workspace apps

without prematurely adding remote plugins, key rotation, server ACLs, or storage-specific assumptions.

## v0.1.0 Implementation Plan

This repository is unreleased. Treat current `v2` naming as transitional.

For `v0.1.0`:

- no backward compatibility with older entry shapes is required
- no migration layer for legacy projections is required
- no historic-version support matrix is required
- code may be renamed/restructured aggressively to match the runtime model

### Workstream 1: Runtime-Owned Replay Pipeline

Goal:
- Make replay phasing a runtime contract, not API glue logic.

Scope:
- Move phased replay orchestration out of `useAppApi.ts` into runtime modules.
- Replace ambient `AppReplayContext` semantics with explicit pipeline lifecycle:
  - begin pipeline
  - run `system` phase
  - run `workspace` phase
  - end pipeline
- Ensure command execution, commit, discard, import, load, and explicit replay all use one pipeline path.
- Remove or strictly constrain partial replay paths that can bypass system prepass.

Target modules:
- `src/app/runtime/*`
- `src/app/plugins/replayContext.ts`
- `src/app/api/useAppApi.ts`

Acceptance:
1. System replay always executes before workspace replay.
2. Replay order is deterministic for identical entry streams.
3. No app-facing API path can mutate projections outside the pipeline.

### Workstream 2: Privacy Group Data Split (Opaque Public + Encrypted Private)

Goal:
- Enforce non-member invisibility at projection boundaries.

Scope:
- Replace plain permission metadata projections with:
  - minimal public envelope (IDs/keys needed for reference and crypto)
  - encrypted metadata payload (title, members, scope, creator, mutable metadata)
- Ensure selectors/surfaces only expose readable groups to viewers with decryptability.
- Keep undecryptable records opaque in runtime state; do not leak meaningful fields.

Target modules:
- `src/app/plugins/permissions.ts`
- privacy selectors and API types under `src/app/api/*`
- permissions UI surfaces under `src/routes/app/*`

Acceptance:
1. Non-members cannot retrieve group title/member metadata via API selectors.
2. New groups store private metadata encrypted in ledger entries.
3. Creators and newly granted members can read metadata once keys are available.

### Workstream 3: Active Membership vs Historical Grant Separation

Goal:
- Preserve historical transparency while enforcing future-write revocation.

Scope:
- Split read/decryptability from write authority:
  - historical grant/decryptability
  - active membership/write permission
- Revocation removes active membership and future write capability.
- Keep historical grant records for auditability and retro-decrypt behavior.
- Update task mutation guards to use active membership, not historical grant existence.

Target modules:
- `src/app/plugins/permissions.ts`
- `src/app/plugins/tasks.ts`

Acceptance:
1. Revoked users cannot perform future task mutations in the group.
2. Historical decryptability remains possible without key rotation.
3. Write checks and read checks are implemented as separate contracts.

### Workstream 4: Runtime Privacy/Audience Service

Goal:
- Decouple workspace apps from permission internals.

Scope:
- Introduce a runtime privacy service for:
  - audience protection resolution
  - read/write audience checks
  - readable audience listing
  - replay decryption key discovery
- Refactor Tasks to consume this service instead of importing permission internals directly.

Target modules:
- `src/app/runtime/privacy.ts` (new)
- `src/app/plugins/permissions.ts`
- `src/app/plugins/tasks.ts`
- app API contracts under `src/app/api/*`

Acceptance:
1. Tasks does not inspect grant maps or permission keyring internals directly.
2. A second workspace app could reuse privacy audiences via runtime service only.

### Workstream 5: Internal App Registry Contract

Goal:
- Keep static local registration, but remove Tasks-as-special-case assumptions.

Scope:
- Formalize runtime internal app definition shape:
  - app identity
  - surfaces
  - replay/command contributions
- Keep only local static registration for `v0.1.0`.
- Keep route host thin and registry-driven.

Target modules:
- `src/runtime/apps/registry.ts`
- `src/runtime/apps/*`
- runtime route host components

Acceptance:
1. `/w/tasks/list` and `/w/tasks/board` continue to resolve via registry.
2. New internal app addition requires registration, not route-logic branching.

### Workstream 6: Storage Provider Boundary Hardening

Goal:
- Preserve storage replaceability without changing replay truth model.

Scope:
- Keep ledger + replay as truth.
- Keep local storage adapter as default implementation.
- Document and enforce adapter boundary in runtime core types.
- Remove any residual Solid-specific assumptions from runtime-level code paths.

Target modules:
- storage adapter and runtime core boundary modules

Acceptance:
1. Replay logic remains unchanged when swapping storage adapters.
2. Runtime boot contract does not require Solid-specific behavior.

### Workstream 7: Deterministic + Privacy-Correct Test Expansion

Goal:
- Lock architecture intent with tests that fail on regression.

Required test coverage:
1. Replay phase ordering (`system` before `workspace`) across all entrypoints.
2. Deterministic projection rebuild from ledger-only replay.
3. Staged/commit/discard consistency under phased replay.
4. Non-member invisibility at projection/API boundaries.
5. Encrypted group metadata behavior for create/read flows.
6. Newly granted member retro-decrypt for historical encrypted tasks.
7. Revoked member blocked from future group writes.
8. Actor spoofing rejection in command and replay paths.
9. Import/export replay parity for encrypted audiences.

### Delivery Sequence

Implement in this order:
1. Workstream 1
2. Workstream 2
3. Workstream 3
4. Workstream 4
5. Workstream 5
6. Workstream 7
7. Workstream 6

Rationale:
- Replay contract and privacy model must stabilize before API and registry cleanup.
- Test hardening should land as soon as each contract is introduced.
- Storage provider broadening is lower risk and can follow core correctness work.

### Explicit Non-Goals For v0.1.0

Do not implement:
1. Dynamic third-party plugin loading
2. Remote plugin installation
3. Permission key rotation
4. Historical erasure on revoke
5. Server-enforced ACL assumptions
6. Network sync / peer discovery as core runtime scope

## Execution Checklist (PR-Sized)

Use this as the default implementation sequence. Each PR is intentionally small enough to review quickly and revert safely.

### PR-00 Baseline And Safety Rails

Goal:
- Freeze behavior before refactor.

Files:
- `src/tests/v2/permissions-service-v2.test.ts`
- `src/tests/v2/tasks-service-v2.test.ts`
- `src/tests/v2/contracts-v2.test.ts`

Planned diff:
- Add regression tests for current replay ordering assumptions and revoke behavior.
- Mark known-bad revoke/write behavior with explicit TODO test names if needed.

Done when:
1. New tests capture current behavior that will be intentionally changed in PR-03.
2. Test names clearly separate “current” vs “target” behavior.

### PR-01 Runtime Replay Pipeline Skeleton

Goal:
- Introduce runtime-owned replay pipeline contract with no product behavior change yet.

Files:
- `src/app/runtime/types.ts`
- `src/app/runtime/createApp.ts`
- `src/app/runtime/index.ts`
- `src/app/plugins/replayContext.ts`
- `src/app/api/useAppApi.ts`
- `src/tests/v2/contracts-v2.test.ts`

Planned diff:
- Add pipeline types (`RuntimeReplayPhase`, pipeline lifecycle methods).
- Rename `AppReplayContext` to `RuntimeReplayContext`.
- Add explicit lifecycle methods:
  - `beginReplayPipeline()`
  - `setPhase("system" | "workspace")`
  - `endReplayPipeline()`
  - `clearDecryptedPayloadCache()`
- Move `runPhasedReplay` ownership from API glue into runtime abstraction.
- Keep existing external API signatures unchanged.

Done when:
1. `load()` and `replay()` in `useAppApi.ts` call one runtime replay entrypoint.
2. No direct phase mutation remains in route/UI layers.
3. Existing tests still pass.

### PR-02 Unify Mutation Entry Replay Path

Goal:
- Ensure command/commit/discard/import flows all route through the same replay pipeline.

Files:
- `src/app/runtime/createApp.ts`
- `src/app/runtime/types.ts`
- `src/app/api/useAppApi.ts`
- `src/tests/v2/permissions-service-v2.test.ts`
- `src/tests/v2/tasks-service-v2.test.ts`

Planned diff:
- Add runtime helpers that wrap Concord mutations and replay pipeline:
  - `executeCommandWithReplay(...)`
  - `commitWithReplay(...)`
  - `discardWithReplay(...)`
  - `importWithReplay(...)`
- Update `useAppApi` to use these helpers for all mutation entrypoints.
- Define partial replay policy for MVP:
  - either rejected for encrypted workspaces
  - or forced `system` prepass before workspace slice replay

Done when:
1. `command`, `commit`, `discard`, `importLedger`, and explicit `replay` share one replay orchestration path.
2. Determinism tests pass before and after commit/discard.

### PR-03 Revocation Semantics Fix (Active Membership Split)

Goal:
- Separate historical grant history from active write membership.

Files:
- `src/app/plugins/permissions.ts`
- `src/app/plugins/tasks.ts`
- `src/app/plugins/replayContext.ts`
- `src/tests/v2/permissions-service-v2.test.ts`
- `src/tests/v2/tasks-service-v2.test.ts`

Planned diff:
- Extend `PermissionsState` with active membership projection:
  - `activeMemberIdsByPermissionId`
- Keep historical grant maps for decryptability/audit.
- Update revoke replay application to remove active membership.
- Replace `hasPermissionGrant(...)` usage in task mutation auth with active membership checks.
- Keep read/decrypt behavior based on key possession, not active membership.

Done when:
1. Revoked member can still read historical decryptable entries (MVP transparency).
2. Revoked member cannot create/rename/move/assign/archive future permission tasks.
3. Tests explicitly cover both behaviors.

### PR-04 Privacy Group Public/Private Projection Split

Goal:
- Remove plain private metadata from non-member-visible projection contract.

Files:
- `src/app/plugins/permissions.ts`
- `src/app/api/types.ts`
- `src/app/api/useAppApi.ts`
- `src/routes/app/RoutePermissions.vue`
- `src/runtime/apps/tasks/list/runtimeTaskEntryEditor.ts`
- `src/tests/v2/permissions-service-v2.test.ts`
- `src/tests/v2/route-permissions-v2.test.ts`

Planned diff:
- Replace single `PermissionRecord` usage with split runtime models:
  - `PrivacyGroupOpaqueRecord`
  - `PrivacyGroupReadableRecord`
- Keep selectors returning readable records only.
- Ensure UI handles absence of undecryptable groups cleanly.
- Remove transitional backward-compat comments/paths tied to old actor formats.

Done when:
1. Non-members cannot fetch title/member metadata via `permissions.all()` or `permissions.byId(...)`.
2. Creator retains staged visibility immediately after create.
3. Newly granted member sees metadata after grant key replay.

### PR-05 Encrypted Metadata Entry Kind

Goal:
- Store privacy group metadata as encrypted ledger material for new entries.

Files:
- `src/app/plugins/permissions.ts`
- `src/tests/v2/permissions-service-v2.test.ts`
- `src/tests/v2/contracts-v2.test.ts`

Planned diff:
- Add metadata entry kind (for example: `permission.group.meta`).
- Emit minimal public envelope in create flow plus encrypted metadata entry.
- Replay permission state by merging envelope + decrypted metadata.
- Rename `wrappedGroupPrivateKey` to `groupSecretKey` (or explicit encrypted wire/runtime pair naming).

Done when:
1. New group titles/member metadata are not present as plain payload in exported ledger entries.
2. Decryptable viewers reconstruct full readable group projection.
3. Selector behavior remains deterministic.

### PR-06 Runtime Privacy Service Extraction

Goal:
- Move audience/privacy policy out of Tasks plugin internals.

Files:
- `src/app/runtime/privacy.ts` (new)
- `src/app/runtime/types.ts`
- `src/app/runtime/index.ts`
- `src/app/plugins/permissions.ts`
- `src/app/plugins/tasks.ts`
- `src/app/api/useAppApi.ts`
- `src/runtime/apps/tasks/audienceContract.ts`
- `src/tests/v2/tasks-service-v2.test.ts`

Planned diff:
- Add runtime privacy service contract:
  - `resolveProtection(audience)`
  - `canReadAudience(audience, viewer)`
  - `canWriteAudience(audience, actor)`
  - `listReadableAudiences()`
  - `getReplayDecryptionKeys()`
- Refactor task command handlers to call privacy service for mutation checks/protection.
- Refactor replay decryption key access to privacy service.

Done when:
1. `tasks.ts` no longer directly inspects permission grant maps for write checks.
2. Audience behavior is preserved for everyone/user/permission tasks.

### PR-07 Internal App Registry Contributions

Goal:
- Formalize local internal app contribution shape while keeping static registry.

Files:
- `src/runtime/apps/registry.ts`
- `src/runtime/apps/index.ts`
- `src/runtime/apps/tasks/*`
- `src/routes/app/RouteRuntimeApp.vue`
- `src/tests/v2/runtime-app-registry-v0.test.ts`
- `src/tests/v2/route-runtime-app-v0.test.ts`

Planned diff:
- Extend app definition to include explicit contribution fields:
  - surfaces
  - commands
  - replay hooks (declarative metadata only for now)
- Keep tasks as only registered app.
- Keep routing registry-driven; no app-specific route branching.

Done when:
1. Existing `/w/tasks/list` and `/w/tasks/board` paths remain unchanged.
2. Registry tests assert that new apps can be added without route changes.

### PR-08 Storage Provider Contract Cleanup

Goal:
- Make storage boundary explicit and platform-agnostic.

Files:
- `src/app/runtime/storage.ts`
- `src/app/runtime/types.ts`
- `src/app/runtime/createApp.ts`
- `src/tests/v2/contracts-v2.test.ts`

Planned diff:
- Tighten storage adapter interface docs/contracts.
- Ensure no runtime replay behavior depends on localStorage quirks.
- Keep current local storage adapter default.

Done when:
1. Swapping adapter implementation does not require replay logic edits.
2. Storage contract is documented in runtime types.

## First Three PRs: File-Level Starter Diffs

Use this as the immediate kickoff scope.

### Starter Diff A (PR-01)

1. `src/app/plugins/replayContext.ts`
- Rename `AppReplayContext` -> `RuntimeReplayContext`.
- Add `beginReplayPipeline` and `endReplayPipeline`.
- Add `clearDecryptedPayloadCache`.
- Change phase union from `"system" | "full"` to `"system" | "workspace"`.

2. `src/app/runtime/types.ts`
- Add replay pipeline types and runtime replay API methods.

3. `src/app/runtime/createApp.ts`
- Add central runtime replay runner used by `load/replay`.

4. `src/app/api/useAppApi.ts`
- Remove direct `setPhase(...)` orchestration.
- Replace with one runtime replay entrypoint.

### Starter Diff B (PR-02)

1. `src/app/runtime/createApp.ts`
- Add replay-aware wrappers for command/commit/discard/import.

2. `src/app/api/useAppApi.ts`
- Route `command`, `commit`, `discard`, `importLedger`, `replay` through wrappers.

3. `src/tests/v2/tasks-service-v2.test.ts`
- Add assertion that replay consistency is preserved after commit/discard/import paths.

### Starter Diff C (PR-03)

1. `src/app/plugins/permissions.ts`
- Add active membership map to state.
- Update grant/revoke apply functions to maintain active membership.

2. `src/app/plugins/tasks.ts`
- Replace `hasPermissionGrant` mutation auth with active membership auth.
- Keep decrypt/read logic keyed to available private keys.

3. `src/tests/v2/permissions-service-v2.test.ts`
- Add revoke future-write rejection coverage.

4. `src/tests/v2/tasks-service-v2.test.ts`
- Add revoked-member mutation rejection for rename/move/assign/archive.

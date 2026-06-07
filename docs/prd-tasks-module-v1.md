# PRD: Concord Workspace Tasks Foundation MVP

## Summary

This PRD defines the first production Tasks module for the Concord workspace currently hosted in `apps/solid`.

Scope is Foundation MVP:

- ledger-first task domain plugin in local runtime
- public and permission-backed list organization
- list and board task surfaces
- assignment and audience access rules
- explicit stage/commit flow

Out of scope for v1:

- timeline surface
- projects/epics/sprints
- drag-and-drop board interactions
- in-Tasks permission member management

## Product Goals

1. Deliver a real task domain contract on Concord replay state, not UI-local state.
2. Support both public and private collaboration patterns.
3. Enforce identity and permission controls in command handlers.
4. Keep list and board as two projections over one command/state model.

## Domain Model

### Core entities

- `TaskRecord`
  - `id`, `title`, `boardId`, `columnId`
  - `taskListId` (public list link) or `permissionId` (private list link)
  - `assigneeIdentityKey`
  - audience payload fields: `audienceType`, `audienceId`, `keyRef`, `cipher`, `keyMissing`
  - audit fields: `createdAt/By`, `updatedAt/By`, `archivedAt/By`
- `TaskBoardRecord`
  - board identity and metadata
- `TaskBoardColumnRecord`
  - `boardId`, title, order
- `TaskListRecord`
  - public list records only (`isPublic: true`)

### Board and column defaults

- one default board in v1
- fixed canonical columns seeded in state
  - `todo`
  - `doing`
  - `done`
- all column/task records include `boardId` so multi-board can be added later without schema churn

## Commands and Rules

### Command set

- `task.create`
- `task.rename`
- `task.move`
- `task.assign`
- `task.archive`
- `task.list.create` (public list only)

### Enforcement rules

1. Actor/signer integrity: command actor must match runtime signer identity.
2. Assignee existence: assignee must exist in `users` projection.
3. Audience access:
   - `everyone`: open visibility
   - `user`: assignee must match audience user when assigned
   - `permission`: actor and assignee must have permission key access
4. Permission-backed list behavior:
   - tasks may point to system permission groups
   - Tasks does not manage permission membership directly
5. Replay hardening:
   - malformed payloads are no-op
   - author mismatch vs actor is no-op during apply

## Audience and Visibility

- default task audience is creator-owned `user`
- `everyone` audience stores plain payload in v1
- `user` and `permission` audiences persist encrypted-payload contract fields (`cipher`, `keyRef`, `keyMissing`)
- if viewer cannot read a task, task rows are hidden from list and board projections

## App API and Surface Contracts

### `AppApi.tasks`

Mutations:

- `create`
- `rename`
- `move`
- `assign`
- `archive`
- `createPublicList`

Queries:

- `all`
- `byId`
- `byBoard`
- `byColumn`
- `publicLists`
- `permissionLists`
- `boardColumns`
- `boards`
- `defaultBoardId`

### Surface behavior

- List surface:
  - create task
  - create public list
  - rename, assign, move, archive actions
  - uses typed `appApi.tasks` only
- Board surface:
  - column projection from the same task state
  - click-based previous/next move actions (no drag-drop in v1)
  - archive action

## Routing and Naming

Canonical runtime app route in v1 is:

- `/w/:appId/:surfaceId?`

All stale `/app/...` references in tests and runtime acceptance coverage are migrated.

## Test Plan

1. Tasks service/plugin tests
   - create and move replay determinism
   - forged actor rejection
   - assignee permission access guard
   - audience visibility filtering
2. Runtime route tests
   - `/w/tasks` default surface normalization
   - `/w/tasks/list` and `/w/tasks/board` navigation
3. Navigation and route contract tests
   - workspace nav links target `/w/...`
   - route map expects `/w/:appId/:surfaceId?`

## Reference Implementation Behavior

The Tasks privacy/listing model follows the behavior patterns prototyped in:

- `apps/concord-demo/src/module/ledger/useLedger.ts`

Specifically:

- list and board semantics as linked entities
- permission-backed private grouping model
- explicit audience-based visibility outcomes

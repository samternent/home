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
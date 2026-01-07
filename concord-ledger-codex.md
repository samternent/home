# Concord Ledger Hardening Task (Codex Agent)

## Objective

Refactor and harden the Concord ledger implementation to a clean, deterministic, production‑grade contract.

The agent must:

- Apply consistent Concord terminology (ledger / commit / entry).
- Implement canonical hashing and deterministic ID derivation.
- Separate canonical ledger data from runtime state.
- Preserve existing behaviour (staging, commit, replay, hooks).
- Make changes in a professional, reviewable manner.

Do **not** introduce new product features or speculative refactors.

---

## Scope

This task applies to:

- Ledger core implementation (currently named `packages/concord-protocol` or equivalent)
- Application-layer ledger API (`packages/ledger`)
- Shared hashing utilities (`packages/utils`)

---

## Canonical Data Model

### Ledger

```ts
{
  format: "concord-ledger",
  version: 0,
  ledgerId: string,
  head: string,
  commits: Commit[]
}
```

### Commit

```ts
{
  commitId: string,
  parent: string | null,
  time: number,
  author?: string,
  message?: string,
  entries: Entry[]
}
```

### Entry

```ts
{
  entryId: string,
  kind: string,
  time: number,
  author: string,
  sig?: string,
  payload?: object | EncryptedPayload
}
```

### Encrypted payload

```json
{
  "enc": "age",
  "ct": "-----BEGIN AGE ENCRYPTED FILE-----\n...\n-----END AGE ENCRYPTED FILE-----"
}
```

---

## Hashing & Signing Rules (Required)

### Canonical hashing

Implement a canonical hashing function that:

- Uses stable key ordering
- Rejects undefined, functions, symbols, circular references
- Produces correct 64‑character SHA‑256 hex output
- Is browser‑safe (`TextEncoder`, `crypto.subtle`)

### Hashable forms

**Entry ID**

```ts
entryCore = { kind, time, author, payload };
entryId = hash(entryCore);
```

**Commit ID**

```ts
commitCore = { parent, time, author?, message?, entryIds: string[] }
commitId = hash(commitCore)
```

- IDs must not include `entryId`, `commitId`, or signatures.
- Genesis commit must follow the same rules as all other commits.

### Signatures

- Sign the `entryId` string.
- Store the signature on the entry as `sig`.
- Verification recomputes `entryId` from the core and verifies the signature.

---

## Runtime vs Canonical State

- Runtime staging is allowed but must not pollute the canonical ledger file.
- Use `pendingEntries` (runtime only).
- Exported / persisted ledger files must exclude staging state.

---

## Required Refactors

### Ledger core

- Rename types:
  - Record → Entry
  - Block → Commit
  - Ledger → ConcordLedger
- Rename fields:
  - chain → commits
  - records → entries
  - last_hash → parent
  - hash → commitId
  - identity → author
  - timestamp → time
  - collection → kind
  - data → payload
  - signature → sig
  - record.id → entryId
- Deduplicate staged entries by `entryId`, not object identity.
- Fix genesis commit hashing.
- Keep chain validation and consensus logic only if still used.

### Application layer

- Create entries using entryCore → entryId → signature.
- Replace `collection` usage with `kind`.
- Genesis entry kind must be `concord/user/added`.
- Replay must be deterministic:
  1. `concord/user/added`
  2. `concord/perm/*`
  3. by `time`
  4. tie‑break by `entryId`
- Hooks must continue to fire with equivalent semantics.

### Utilities

- Replace existing `hashData()` with canonical implementation.
- Fix broken hex encoding (must be zero‑padded).
- Avoid multiple hashing implementations across packages.

---

## Migration Helper (Recommended)

Provide a pure helper:

```ts
migrateLegacyLedgerToConcord(legacyLedger): ConcordLedger
```

Mapping rules:

- `users` → `concord/user/added`
- `ledger_apps` → `concord/app/registered`
- `schema_<id>` → `concord/schema/<id>/record`

This helper should not mutate input.

---

## Tests (Lightweight but Required)

At minimum:

- Hash stability across object key order differences
- Entry ID stability for identical entry cores
- Commit ID independence from entry payload bodies
- Genesis commit ID consistency

---

## Constraints

- No networking, merging, or consensus features beyond existing code.
- No breaking API changes without a compatibility layer.
- No speculative redesigns.
- Keep TypeScript strict and explicit.
- Small, reviewable commits.

---

## Definition of Done

- Canonical hashing implemented and used everywhere.
- Entry and commit IDs derived from hashable forms.
- Terminology is consistent across code and data.
- Runtime staging is separated from canonical ledger files.
- Replay is deterministic.
- Tests pass.
- Build passes.

Deliver a brief summary of changes and list any intentional non‑changes.

# ADR 0001: Pixbook Receipts Canonicalization and Write Ordering

## Status
Accepted - 2026-02-24

## Context
Pixbook writes must be append-only, idempotent, and replayable while preserving
legacy API compatibility.

## Decision
1. OpenAPI is the contract for all new pixbook command/query endpoints.
2. Legacy `/v1/account/pixbook*` endpoints keep existing body shapes and call the
   new pixbook services internally.
3. Canonical receipt payload bytes are produced with
   `canonicalStringify` from `@ternent/concord-protocol`.
4. Request-hash idempotency keys are computed from canonical payloads produced by
   the same Concord canonicalizer.
5. Stream writes are serialized with `pg_advisory_xact_lock` on
   `account_id + ':' + book_id`.
6. Canonical receipt objects are written to Spaces as per-event objects at
   `pixpax/pixbooks/{accountId}/{bookId}/events/{eventId}.json`.
7. Authoritative stream head and listing index live in Postgres
   (`pixbook_ledger_heads`, `pixbook_receipt_index`).
8. Receipt signing is Vault Transit first; no environment key signer fallback in
   this flow.

## Consequences
1. Spaces remains canonical truth for receipt payloads.
2. Postgres provides SaaS-fast reads and ordering guarantees without listing
   object storage.
3. Rebuild/projector tooling can verify chain and signature deterministically.

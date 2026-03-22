# PixPax v2 Transfer Model Spec

## Status

Designed now, not implemented in phase 1.

## Model

- sender signs a transfer offer for a specific owned card instance
- sender replay marks that instance transferred out
- recipient claims the transfer offer into their Pixbook
- recipient replay adds that exact card instance to ownership

## Required future rules

- transfer offer identity and hash
- spent semantics
- duplicate offer handling
- claim idempotency
- cross-device conflict behavior
- invalid-after-claim behavior

## Non-goals for phase 1

- cancellation
- server-mediated escrow
- marketplace logic

# PixPax v2 API Contract Spec

## Initial routes

- `GET /v1/pixpax/v2/meta`
- `POST /v1/pixpax/v2/deterministic/preview`
- `POST /v1/pixpax/v2/deterministic/issue`
- `POST /v1/pixpax/v2/designated/issue`
- `POST /v1/pixpax/v2/proofs/verify`

## API role

The API may:

- load collection content
- create issuer-signed artifacts
- verify proofs
- expose admin/operator read models

The API must not redefine Pixbook ownership truth.

## Phase 1 scope

- admin/API/core-first
- deterministic issuance preview and issue
- designated issuance by explicit selected cards
- proof verification

## Deferred

- transfer execution routes
- account backup and sync changes
- v1 importer

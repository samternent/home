# API Interface Documentation (Proposed)

Generated: 2026-02-24

This document is explanatory only.
The executable API contract is `api/openapi.yaml`.

Current wave scope:
- Pixbook query/command endpoints only.
- Legacy `/v1/account/pixbook*` endpoints remain compatibility routes.

## Conventions
- All responses include `requestId`.
- Success:
  - `{"ok": true, "data": ..., "requestId": "..."}`
- Error:
  - `{"ok": false, "error": {"code":"...","message":"...","details":{}}, "requestId":"..."}`
- Idempotency:
  - All command endpoints accept `Idempotency-Key` header (UUID).
- Auth:
  - Session cookie / bearer token from better-auth.
  - Identity selection explicit via `X-Identity-Id` header (or body field).

## Core resources

### Pixbooks
**Queries**
- `GET /v1/pixbooks` — list pixbooks for account
- `GET /v1/pixbooks/:id` — pixbook projection (fast read)
- `GET /v1/pixbooks/:id/receipts?after=<eventId>` — canonical receipts feed
- `GET /v1/pixbooks/:id/snapshot` — derived snapshot (optional)

**Commands**
- `POST /v1/pixbooks/commands/create` — creates pixbook + `PIXBOOK_CREATED` receipt
- `POST /v1/pixbooks/:id/commands/save` — explicit save receipt

## Compatibility
- Existing endpoints remain during refactor with deprecation headers.
- This wave keeps legacy pixbook route response bodies unchanged.

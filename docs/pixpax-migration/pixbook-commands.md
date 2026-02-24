# Pixbook Legacy to Command API Migration

Legacy endpoints:
- `GET /v1/account/pixbook`
- `PUT /v1/account/pixbook/snapshot`

New endpoints:
- `GET /v1/pixbooks`
- `GET /v1/pixbooks/:id`
- `GET /v1/pixbooks/:id/receipts?after&limit`
- `GET /v1/pixbooks/:id/snapshot`
- `POST /v1/pixbooks/commands/create`
- `POST /v1/pixbooks/:id/commands/save`

Command headers:
- `Idempotency-Key: <uuid>`
- `X-Signing-Identity-Id: <id>` (required when account has multiple signing identities)

Response contract:
- New endpoints use the request envelope.
- Legacy endpoints retain existing response bodies until sunset.

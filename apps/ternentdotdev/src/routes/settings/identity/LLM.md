# LLM Context - Identity Routes

Required subroutes:

- `/settings/identity/create`
- `/settings/identity/import`
- `/settings/identity/export`

Behavior:

- Create generates keys.
- Import validates payload.
- Export is available only when identity exists.

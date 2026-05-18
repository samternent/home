# CLAUDE.md

`apps/solid` is the active Concord workspace host.

- Build features as domain plugins + typed API + projection surfaces.
- Keep command handlers authoritative for authz/integrity; UI is not a security boundary.
- Respect staged workflow: commands mutate staged history, commit/discard finalizes.
- Use route contract `/w/:appId/:surfaceId?` for runtime apps.
- Prefer extending existing system domains (`users`, `permissions`) before introducing parallel models.
- Use `ternent-ui` primitives/patterns for all runtime UX.

# CLAUDE.md

`apps/*` conventions:
- Treat `apps/solid` as the active Concord workspace implementation.
- Preserve shared contracts (`/w/:appId/:surfaceId?`, typed app APIs, plugin-driven state).
- Keep features modular: system domains (users/permissions) feed app domains (tasks, etc.).
- Do not fork crypto models per app; use runtime-native encryption/decryption flows.

# Storage Layer

Purpose:

- expose provider registration and mounted resources
- resolve paths and handles
- adapt provider storage into workspace-readable resource models

Own here:

- provider manifests and connection state
- provider contract types in `types.ts`
- provider implementations under `providers/*`
- mount descriptors
- resource handles
- path resolution
- attachment and blob access
- cache and sync boundaries

Do not own here:

- replay logic
- schema compatibility
- app-specific UI

Rule:

- Solid is one storage provider implementation at this boundary, not the storage layer itself
- `useRunStorageCatalog.ts` should read from workspace/provider seams, not from provider-local state
- `browser-local` is the default zero-backend provider so the runtime remains usable before external auth

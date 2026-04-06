# Run Runtime

This module tree is the target architecture for `apps/solid` as it evolves into `run.ternent.dev`.

It exists to keep the runtime layered and to stop workspace, replay, storage, services, and surfaces from collapsing into one mixed-responsibility module.

Current direction:

- `src/modules/run` is the active implementation home
- the delivery target is a core-first, verified multi-ledger workspace with one active projection at a time
- storage providers are plugins, not the root runtime assumption
- new work should land in the owning layer, not in route files
- UI should stay thin while the runtime contracts harden

Layer summary:

- `core`: initial runtime assembly around workspace state, verified replay, and projection boot
- `identity`: local identity catalog, active identity switching, and provider-backed recovery
- `storage`: provider registry, mounts, handles, and resource discovery
- `ledger`: commit and history models
- `replay`: deterministic projections and comparison
- `schema`: command contracts and compatibility
- `workspace`: orchestration and shared context
- `services`: generic platform affordances
- `surfaces`: explorer and terminal views
- `tasks`: the first real app-local projection over verified replay truth

Current provider seam:

- `run/storage/types.ts` defines provider, mount, and browse contracts
- `run/workspace/useRunProviderRegistry.ts` owns provider registration
- `run/workspace/useRunMountRegistry.ts` owns active mount inventory
- `run/workspace/useRunWorkspaceRuntime.ts` is the provider-agnostic workspace seam
- `run/workspace/useRunWorkspaceSource.ts` is now a transitional Solid compatibility alias

Current identity seam:

- `run/identity/useRunIdentityService.ts` is the canonical runtime identity authority
- identities are local-first and provider-independent
- providers may cache identities for recovery, but providers do not define the active runtime identity

Current replay rule:

- selection determines candidate input, not runtime truth
- projection state is derived from provider resolution, verification, and replay output
- verification and replay support read-only inspection without identity
- signed create/command flows still require an active identity

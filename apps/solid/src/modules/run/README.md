# Run Runtime

This module tree is the target architecture for `apps/solid` as it evolves into `run.ternent.dev`.

It exists to keep the runtime layered and to stop workspace, replay, storage, services, and surfaces from collapsing into one mixed-responsibility module.

Current direction:

- `src/modules/run` is the active implementation home
- the delivery target is a core-first, verified multi-ledger workspace with one active projection at a time
- new work should land in the owning layer, not in route files
- UI should stay thin while the runtime contracts harden

Layer summary:

- `core`: initial runtime assembly around verified identity, workspace state, and projection boot
- `storage`: mounts, handles, and resource discovery
- `ledger`: commit and history models
- `replay`: deterministic projections and comparison
- `schema`: command contracts and compatibility
- `workspace`: orchestration and shared context
- `services`: generic platform affordances
- `surfaces`: explorer and terminal views
- `hosted-apps`: domain apps on top of workspace services

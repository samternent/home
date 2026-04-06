# Core Layer

Purpose:

- provide the first real runtime assembly for `run.ternent.dev`
- boot a provider-backed multi-ledger workspace into canonical runtime state
- expose a Vue-facing facade over the lower runtime layers for routes and surfaces
- keep UI secondary while runtime contracts harden

Phase 1 ownership:

- provider-aware runtime boot
- core identity handoff from the local identity catalog
- resource and ledger discovery across the workspace
- one active projection at a time
- facade-level diagnostics and surface descriptors exposed to `RouteApp.vue`
- hard runtime reset when the active identity changes

Identity rule:

- replay and verification must work without an active identity
- identity is required for signed mutations, not for read-only inspection
- provider auth is optional and separate from identity readiness
- the core facade may orchestrate provider-backed recovery, but it must not derive identity from a provider

Projection rule:

- workspace selection chooses candidate input only
- projection truth must come from provider resolution, verified replay, and replay output
- Tasks may be inspect-only; interactive capability is an extra runtime fact

Do not own here:

- large product UI surfaces
- schema definitions
- replay engine internals
- storage adapter internals

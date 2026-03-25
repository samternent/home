# Core Layer

Purpose:

- provide the first real runtime assembly for `run.ternent.dev`
- boot a verified multi-ledger workspace from Solid login into canonical workspace state
- expose a Vue-facing facade over the lower runtime layers for routes and surfaces
- keep UI secondary while runtime contracts harden

Phase 1 ownership:

- authenticated runtime boot
- verified identity handoff
- resource and ledger discovery across the workspace
- one active projection at a time
- facade-level diagnostics and surface descriptors exposed to `RouteApp.vue`

Do not own here:

- large product UI surfaces
- schema definitions
- replay engine internals
- storage adapter internals

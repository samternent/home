# Shared Services Layer

Primary spec:

- `/Users/sam/dev/samternent/home/apps/solid/docs/run.shared-services-spec.md`

Purpose:

- expose reusable runtime semantics above workspace/storage/replay and below explorer, terminal, and Tasks

Phase 1 implemented here:

- workspace action semantics
- terminal command language
- task mutation actions

Phase 1 planned here:

- verification service
- history service
- resource facts service

Rules:

- services explain runtime truth, not domain meaning
- services must be workspace-aware and UI-agnostic
- surfaces consume services rather than storage adapters directly
- services are the mutation boundary across explorer, terminal, dashboard, and Tasks
- read-only inspection may work without identity, but signed mutations must still be gated here
- Tasks UI may read replay state, but it must not bypass services for commands

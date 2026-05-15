## Project Overview

ConcordOS is a local-first runtime for building verifiable applications on signed history.

Applications in ConcordOS do not store mutable state directly. Instead, application state is deterministically derived by replaying append-only ledger history into projections and rendering those projections through reusable UI surfaces.

The platform combines:

- Signed identity
- Portable ledger-backed resources
- Deterministic replay
- Shared runtime services
- Surface-based applications
- Local-first storage providers

ConcordOS acts as the runtime host for applications while maintaining a consistent trust, routing and workspace model across the system.

The runtime owns:

- Identity
- Workspace selection
- Resource mounting
- Replay orchestration
- Runtime routing
- Integrity state
- Shared layout chrome
- Commit/staging systems

Applications own:

- Domain commands
- Projection logic
- Rendering surfaces
- Resource compatibility
- User workflows

A single resource may support multiple projections and multiple interchangeable application surfaces.

Examples:

- Tasks rendered as:
  - List
  - Board
  - Timeline
  - Calendar

- Collections rendered as:
  - Gallery
  - Table
  - Explorer
  - Analytics

The long-term vision is for ConcordOS applications to become schema-driven and eventually AI-generatable through a shared runtime contract.

Applications should follow consistent patterns through shared ternent-ui primitives and runtime architecture rather than defining isolated product experiences.

## Directory structure

```txt
src/
  runtime/
    apps/
    identity/
    providers/
    replay/
    routing/
    workspace/
    layouts/

  routes/

  apps/

  components/

  composables/

  stores/

  styles/
  ```

## Commands
- pnpm dev - Start development server (default port 8923)

## General Guidelines
- Always format, lint and test your changes.
- Keep types in the same file where used - extract only when shared
- Prefer function declaration over named arrow functions
- Prefer deterministic replay over mutable runtime state
- Keep runtime concerns separated from application concerns
- All application UI should use shared ternent-ui primitives and layouts
- Applications should register capabilities rather than hardcoding runtime integration
- Routes represent runtime intent, not authoritative application state
- Shared runtime services should remain application-agnostic
- Prefer reusable surfaces over page-specific implementations
- Design for schema compatibility and future generated applications
- Keep storage providers abstracted from application logic
- Avoid tight coupling between projections and rendering surfaces

## Changesets

Pattern: .changeset/[random-adjective]-[random-verb]-[random-noun].md
Keep the summary concise but informative, no implementation details
Must reference actual packages (e.g. @teamwork/lightspeed-app)
IMPORTANT: Always use patch. Never create major or minor changesets

## Pull Requests
Use PR template: .github/pull_request_template.md
Keep the description concise but informative
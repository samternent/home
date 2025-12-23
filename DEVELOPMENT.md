## Tooling

- **Node**: per `.nvmrc` (use `nvm use`).
- **pnpm**: required for workspace.

## Common Commands

- Install deps: `pnpm install`
- Build all: `pnpm -w build`
- Lint all: `pnpm -w lint`
- Test all: `pnpm -w test`
- Add changeset: `pnpm changeset`

## Running Apps

Each app defines its own scripts. Typical pattern:

- Dev: `pnpm --filter <app-name> dev`
- Build: `pnpm --filter <app-name> build`
- Start: `pnpm --filter <app-name> start`

## Working with Packages

- Link locally with pnpm workspaces. Within a package:
  - `pnpm dev` for watch builds
  - Expose typed exports via `index.ts`

## CI Expectations

- CI runs lint/build/test. All checks must pass before merge.

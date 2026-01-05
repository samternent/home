## Getting Started

1. **Node & pnpm**: Use the Node version in `.nvmrc`. Install pnpm globally: `npm i -g pnpm`.
2. **Install**: `pnpm install`
3. **Bootstrap**: `pnpm -w build` (workspace build). See **DEVELOPMENT.md** for per-app scripts.

## Branching & Commits

- Create a feature branch from `main` (`feat/<scope>`, `fix/<scope>`).
- Conventional commits are recommended; **changesets** control versioning and release notes.

## Changesets

- If your change affects a published package/app, run `pnpm changeset` and select affected packages. Keep the summary clear and user-focused.

## Tests & Lint

- Run `pnpm -w test` and `pnpm -w lint`.
- Fix all lints; do not disable rules without justification.

## PRs

- Keep PRs small. Include screenshots for UI changes. Update docs alongside code.

## Security & Secrets

- Never commit secrets. Use GitHub Encrypted Secrets and `.env.example` files for local dev.

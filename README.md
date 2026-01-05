## The personal infrastructure for ternent.dev

This monorepo contains all deployable **apps** and shared **packages** that power `ternent.dev`.

### TL;DR Quickstart

- `nvm use` (reads Node version from `.nvmrc`)
- `pnpm install`
- `pnpm -w build` (build everything)
- `pnpm -w test` (optional)
- run an app: `pnpm --filter <app-name> dev`

### Repo Map

```
root
├─ apps/                 # deployable apps (server + static)
├─ packages/             # shared libraries (publishable)
├─ .ops/                 # Kubernetes manifests, docker build/deploy scripts
├─ .github/              # CI + issue/PR templates
├─ .changeset/           # versioning + release notes
├─ scripts/              # repo-level utilities
├─ pnpm-workspace.yaml   # workspace globs
├─ vercel.json           # static deploy settings
└─ README.md
```

### Conventions

- **Workspace**: pnpm; **versioning**: changesets
- **Deploy**: server apps → Docker Hub + Kubernetes via `.ops`; static sites → Vercel CLI
- **Packages**: public npm modules, semver via changesets

### Developing

- Keep changes small and scoped. See `CONTRIBUTING.md`.
- Prefer adding shared code under `packages/*` rather than duplicating in apps.
- Add `.env.example` values when introducing new env vars.

### Releasing

- If your change impacts a package/app API or user-visible behavior, run `pnpm changeset` and select affected packages.
- `main` merges trigger CI; release flow bumps versions and publishes:
  - docker images for server apps (then deployed by `.ops`)
  - static site deploys to Vercel
  - `npm publish` for packages

### Troubleshooting

- Workspace hoisting issues? Try `pnpm install --force`.
- Local type errors across packages? Ensure `tsconfig` references are up to date and run a clean build: `pnpm -w build --filter ...`.

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

### PixPax Drops Docs

- `docs/pixpax-drops/README.md`
- `docs/pixpax-drops/AI.md`
- `docs/pixpax-drops/SPEC.md`
- `docs/pixpax-drops/PLAN.md`
- `docs/pixpax-drops/CHECKLIST.md`

### PixPax Collection UX Notes

- Public listing: `GET /v1/pixpax/collections/catalog` (public only)
- Collection route resolution: `GET /v1/pixpax/collections/:collectionId/resolve`
- Collection behavior settings are collection-level:
  - `visibility`: `public | unlisted`
  - `issuanceMode`: `scheduled | codes-only`
- Unlisted collections are discoverable via direct route and My Collections after ownership.
- Admin code-token printing:
  - single mint endpoint enriches response with `redeemUrl` + `qrSvg`
  - bulk printable endpoint: `POST /v1/pixpax/collections/:collectionId/:version/code-cards`
  - endpoint returns JSON `items[]` (QR + metadata) for frontend rendering/printing
  - compact redeem tokens use signed handle claims (`v=3`, `kid`, `codeId`, `exp`) with server lookup
  - printed QR links use `https://pixpax.xyz/r/<codeId>` and resolve to `/pixpax/redeem?token=...`

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

### Seal Action

This repo now also exposes a root GitHub Action for sealing built static assets.

The action is generic at the workflow step level:

- your workflow builds a static directory
- the action signs that directory in place
- the action can run either the published `@ternent/seal-cli` package from npm or a repo-local CLI override

Example:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version-file: ".nvmrc"
- uses: samternent/home@main
  env:
    SEAL_PRIVATE_KEY: ${{ secrets.SEAL_PRIVATE_KEY }}
    SEAL_PUBLIC_KEY: ${{ secrets.SEAL_PUBLIC_KEY }}
  with:
    assets-directory: dist
    package-version: latest
```

For this monorepo's own workflows, the action is called with `cli-command: node packages/seal-cli/bin/seal` so it does not depend on npm publication timing.

`seal-cli` itself is published by [.github/workflows/deploy-seal-cli.yml](/Users/sam/dev/samternent/home/.github/workflows/deploy-seal-cli.yml) on tags matching `seal-cli-*.*.*`.

### Troubleshooting

- Workspace hoisting issues? Try `pnpm install --force`.
- Local type errors across packages? Ensure `tsconfig` references are up to date and run a clean build: `pnpm -w build --filter ...`.

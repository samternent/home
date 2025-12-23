## Overview

The repo is a **pnpm monorepo** with `apps/*` (deployable apps) and `packages/*` (shared libraries). Release orchestration uses **changesets** and CI via GitHub Actions. Deploy targets: **Kubernetes** (server apps via Docker images) and **Vercel** (static sites). Packages publish to **npm** on release.

```
root
├─ .changeset/               # versioning & release notes
├─ .github/workflows/        # CI/CD pipelines
├─ .ops/                     # deploy scripts & k8s manifests
├─ apps/                     # deployable applications
│  ├─ <app-a>/
│  └─ <app-b>/
├─ packages/                 # shared libraries/utilities
│  ├─ <pkg-core>/
│  └─ <pkg-ui>/
├─ scripts/                  # repo-level utilities
├─ pnpm-workspace.yaml
├─ vercel.json
└─ README.md
```

## Module Boundaries

- **Apps** import from **packages** only; keep app-local logic inside the app unless there’s reuse.
- **Packages** must be framework-agnostic when possible and publishable.

## Build & Release

- CI validates `pnpm -w lint`, `pnpm -w build`, tests.
- On publish, changesets bump versions and trigger:
  - Docker build & push for server apps → deploy via `.ops`
  - Static exports to Vercel for web apps
  - `npm publish` for packages

## Config & Secrets

- Use environment variables with typed loaders in each app, and `.env.example` committed.

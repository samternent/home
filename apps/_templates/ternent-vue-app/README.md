# ternent-vue-app template

Canonical template for new Ternent Vue apps.

## Features

- Feature-driven architecture (`src/modules/*`)
- Route-folder modules (`src/routes/*`) with CamelCase `Route*.vue`
- Foundational `ternent-identity`, `ternent-utils`, `ternent-ui` support
- Identity create/import/export baseline flows
- Tailwind + custom light/dark theme pair
- PWA + offline-first defaults
- Lighthouse CI thresholds (95+ for perf/a11y/best-practices/seo)

## App Manifest

The template landing page is driven by `app.yaml`.

- Author landing copy, links, snippets, and theme selection in YAML.
- Run `pnpm sync:ternent-app -- --app apps/<app-name>` to regenerate typed runtime config.
- The browser consumes generated TS config only; it does not parse YAML at runtime.

## Fastest Path

If you want the shortest route to a new branded app:

```bash
pnpm scaffold:ternent-app -- --name ledger-demo --title "Ledger Demo" --host ledger-demo.ternent.dev --theme aurora
pnpm --filter ledger-demo dev
```

That creates `apps/ledger-demo`, writes `apps/ledger-demo/app.yaml`, and generates the runtime config immediately.
It also scaffolds:

- `.github/workflows/deploy-ledger-demo.yml`
- a publish entry in `.ops/publish.mjs`

The only manual release setup left is:

- create the Vercel project
- add `VERCEL_LEDGER_DEMO_PROJECT_ID` to GitHub Actions secrets

## Config-First Workflow

If you want to author the app from a manifest before scaffolding it, use a manifest outside `apps/` first.

1. Create a starter manifest:

```bash
pnpm prepare:ternent-app -- --out .ternent-apps/ledger-demo.yaml --name ledger-demo --title "Ledger Demo" --host ledger-demo.ternent.dev --theme aurora
```

2. Edit `.ternent-apps/ledger-demo.yaml` with your copy, links, previews, and theme choice.

3. Scaffold the app from that manifest:

```bash
pnpm scaffold:ternent-app -- --manifest .ternent-apps/ledger-demo.yaml
```

4. Run the app:

```bash
pnpm --filter ledger-demo dev
```

## Updating an Existing App

After scaffolding, the app’s source-of-truth manifest lives inside the app:

- `apps/<app-name>/app.yaml`

When you change that file, regenerate the runtime config with:

```bash
pnpm sync:ternent-app -- --app apps/ledger-demo
```

`sync:ternent-app` updates generated app config only. Deployment workflow and publish registration are scaffolded when the app is first created.

## Concrete Example

Minimal config-first session:

```bash
pnpm prepare:ternent-app -- --out .ternent-apps/receipt-checker.yaml --name receipt-checker --title "Receipt Checker" --host receipt-checker.ternent.dev --theme harbor-rose
pnpm scaffold:ternent-app -- --manifest .ternent-apps/receipt-checker.yaml
pnpm --filter receipt-checker dev
```

## Release Flow

For each scaffolded app the generator wires in the repo-level release hooks:

- `.github/workflows/deploy-<app-name>.yml` deploys the tagged app to Vercel
- `.ops/publish.mjs` includes the app so changeset releases emit a GitHub release entry

Recommended sequence:

1. Run `pnpm prepare:ternent-app` or `pnpm scaffold:ternent-app`
2. Edit `apps/<app-name>/app.yaml`
3. Run `pnpm sync:ternent-app -- --app apps/<app-name>`
4. Create the Vercel project and add `VERCEL_<APP_NAME>_PROJECT_ID` to repo secrets
5. Commit the scaffolded app, workflow, and manifest
6. Add a changeset that bumps the new app package when you want the first production release

## Vercel + GitHub Setup

If you are already logged into both the Vercel CLI and GitHub CLI, you can automate the project/secret wiring with:

```bash
pnpm setup:ternent-app-deploy -- --app apps/ledger-demo
```

That script will:

- link or create the Vercel project for the app via `vercel link --project <app-id> --yes`
- read `.vercel/project.json`
- set `VERCEL_<APP_NAME>_PROJECT_ID` in GitHub Actions secrets
- set `VERCEL_ORG_ID` in GitHub Actions secrets

Optional flags:

- `--project <name>` to use a different Vercel project name
- `--repo <owner/repo>` to target a different GitHub repository
- `--scope <scope>` to target a specific Vercel team/scope
- `--skip-org-secret` if `VERCEL_ORG_ID` is already managed elsewhere

## Monthly Template Refresh

1. Update external dependencies to latest stable.
2. Run `pnpm --filter __APP_ID__ test:unit`.
3. Run `pnpm --filter __APP_ID__ build`.
4. Run `pnpm --filter __APP_ID__ lighthouse:ci`.
5. Update template changelog notes.
